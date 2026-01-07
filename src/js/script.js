// Script principal du site
// Gère l'accordéon, le carousel et le menu
(function () {
    'use strict';

    // Fonction pour l'accordéon "L'effet Matilda : c'est quoi ?"
    function initAccordion() {
        const accordeon = document.querySelector('.accordeon');
        if (!accordeon) return; // Si pas d'accordéon sur la page, on sort
        
        const headerButton = accordeon.querySelector('.accordeon-header');
        if (headerButton) {
            headerButton.addEventListener('click', function () {
                accordeon.classList.toggle('accordeon--open');
            });
        }
    }

    // Gestion du carousel d'articles
    function initCarousel() {
        const carousel = document.querySelector('.carousel-articles');
        if (!carousel) return;

        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(track.querySelectorAll('.carousel-slide'));
        const prevBtn = carousel.querySelector('.carousel-arrow--prev');
        const nextBtn = carousel.querySelector('.carousel-arrow--next');
        let current = 0;
        let autoTimer = null; // Timer pour le défilement automatique

        function scrollToIndex(index) {
            if (!slides.length) return;
            const n = (index + slides.length) % slides.length;
            track.scrollTo({ left: slides[n].offsetLeft, behavior: 'smooth' });
            current = n;
        }

        function startAuto() {
            if (autoTimer) clearInterval(autoTimer);
            autoTimer = setInterval(function () {
                scrollToIndex(current + 1);
            }, 5000);
        }

        function stopAuto() {
            if (autoTimer) {
                clearInterval(autoTimer);
                autoTimer = null;
            }
        }

        function restartAuto() {
            stopAuto();
            startAuto();
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                scrollToIndex(current - 1);
                restartAuto();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                scrollToIndex(current + 1);
                restartAuto();
            });
        }

        // Mise à jour de l'index quand on scroll manuellement
        let scrollTimeout = null;
        track.addEventListener('scroll', function () {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function () {
                // Trouve la slide la plus proche
                let closest = 0;
                let minDiff = Infinity;
                for (let i = 0; i < slides.length; i++) {
                    const diff = Math.abs(slides[i].offsetLeft - track.scrollLeft);
                    if (diff < minDiff) { 
                        minDiff = diff; 
                        closest = i; 
                    }
                }
                current = closest;
            }, 100);
        }, { passive: true });

        // Support du drag/touch pour mobile et desktop
        let isPointerDown = false;
        let startX = 0;
        let startScroll = 0;

        track.addEventListener('pointerdown', function (e) {
            isPointerDown = true;
            track.setPointerCapture(e.pointerId);
            startX = e.clientX;
            startScroll = track.scrollLeft;
            stopAuto();
        });

        track.addEventListener('pointermove', function (e) {
            if (!isPointerDown) return;
            const dx = startX - e.clientX;
            track.scrollLeft = startScroll + dx;
        });

        function endPointer(e) {
            if (!isPointerDown) return;
            isPointerDown = false;
            try { 
                track.releasePointerCapture(e.pointerId); 
            } catch (err) { 
                // Erreur ignorée si le navigateur ne supporte pas
            }
            // Aligne sur la slide la plus proche
            let closest = 0;
            let minDiff = Infinity;
            for (let i = 0; i < slides.length; i++) {
                const diff = Math.abs(slides[i].offsetLeft - track.scrollLeft);
                if (diff < minDiff) { minDiff = diff; closest = i; }
            }
            scrollToIndex(closest);
            restartAuto();
        }

        track.addEventListener('pointerup', endPointer);
        track.addEventListener('pointercancel', endPointer);
        track.addEventListener('pointerleave', endPointer);

        // Démarre le défilement automatique
        startAuto();
    }

    // Gestion du menu off-canvas
    function initSiteMenu() {
        const menu = document.getElementById('siteMenu');
        const overlay = document.getElementById('menuOverlay');
        const toggles = document.querySelectorAll('.menu-toggle');
        if (!menu || !overlay || !toggles.length) return;

        const closeBtn = menu.querySelector('.menu-close');
        let lastFocused = null; // Pour remettre le focus après fermeture

        function updateFocusable() {
            return Array.from(menu.querySelectorAll('a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled'));
        }

        function trapFocus(e) {
            if (e.key !== 'Tab') return;
            const focusable = updateFocusable();
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }

        function openMenu() {
            lastFocused = document.activeElement;
            menu.setAttribute('aria-hidden', 'false');
            overlay.hidden = false;
            document.body.classList.add('menu-open');
            const focusable = updateFocusable();
            focusable[0]?.focus();
            document.addEventListener('keydown', trapFocus);
        }

        function closeMenu() {
            menu.setAttribute('aria-hidden', 'true');
            overlay.hidden = true;
            document.body.classList.remove('menu-open');
            document.removeEventListener('keydown', trapFocus);
            lastFocused?.focus();
        }

        toggles.forEach(t => t.addEventListener('click', function (e) {
            e.preventDefault();
            openMenu();
        }));

        closeBtn?.addEventListener('click', function (e) {
            e.preventDefault();
            closeMenu();
        });

        overlay.addEventListener('click', function () { closeMenu(); });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMenu();
        });

        // Accordéon dans le menu (sous-menu Articles)
        const accBtns = menu.querySelectorAll('.menu-accordion');
        accBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const expanded = btn.getAttribute('aria-expanded') === 'true';
                btn.setAttribute('aria-expanded', String(!expanded));
                const submenu = btn.nextElementSibling;
                if (submenu) {
                    submenu.hidden = expanded;
                }
            });
        });

    }

    // Page 404 : compte à rebours et redirection
    function initPage404() {
        const countdownElement = document.getElementById('countdown');
        if (!countdownElement) return; // Pas sur la page 404

        let countdown = 5;
        const timer = setInterval(function () {
            countdown--;
            countdownElement.textContent = countdown;

            if (countdown <= 0) {
                clearInterval(timer);
                window.location.href = 'index.html';
            }
        }, 1000);

        // Bouton pour rediriger immédiatement
        const btn404 = document.querySelector('.btn-404');
        if (btn404) {
            btn404.addEventListener('click', function (e) {
                e.preventDefault();
                clearInterval(timer);
                window.location.href = 'index.html';
            });
        }
    }

    // Validation du formulaire de contact
    function initContactForm() {
        const form = document.querySelector('.contact-form');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            
            const name = form.querySelector('#name').value.trim();
            const email = form.querySelector('#email').value.trim();
            const subject = form.querySelector('#subject').value.trim();
            const message = form.querySelector('#message').value.trim();

            // Validation basique
            if (!name || !email || !subject || !message) {
                alert('Veuillez remplir tous les champs.');
                return;
            }

            // Validation email simple
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Veuillez entrer une adresse email valide.');
                return;
            }

            // Si tout est OK, on pourrait envoyer les données
            // Pour l'instant, on affiche juste un message
            alert('Message envoyé ! (Fonctionnalité à implémenter côté serveur)');
            form.reset();
        });
    }

    // Initialisation quand le DOM est prêt
    document.addEventListener('DOMContentLoaded', function () {
        initAccordion();
        initCarousel();
        initSiteMenu();
        initPage404();
        initContactForm();
    });
})();