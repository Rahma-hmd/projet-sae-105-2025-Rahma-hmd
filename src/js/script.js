// script.js (moved from inline)
// Handles accordion and carousel (scroll-based) with touch/drag support
(function () {
    'use strict';

    function initAccordion() {
        const accordeon = document.querySelector('.accordeon');
        if (!accordeon) return;
        const headerButton = accordeon.querySelector('.accordeon-header');
        if (headerButton) {
            headerButton.addEventListener('click', function () {
                accordeon.classList.toggle('accordeon--open');
            });
        }
    }

    function initCarousel() {
        const carousel = document.querySelector('.carousel-articles');
        if (!carousel) return;

        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(track.querySelectorAll('.carousel-slide'));
        const prevBtn = carousel.querySelector('.carousel-arrow--prev');
        const nextBtn = carousel.querySelector('.carousel-arrow--next');
        let current = 0;
        let autoTimer = null;

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

        // Update current index based on closest slide when scrolling
        let scrollTimeout = null;
        track.addEventListener('scroll', function () {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function () {
                // find nearest slide by offsetLeft
                let closest = 0;
                let minDiff = Infinity;
                for (let i = 0; i < slides.length; i++) {
                    const diff = Math.abs(slides[i].offsetLeft - track.scrollLeft);
                    if (diff < minDiff) { minDiff = diff; closest = i; }
                }
                current = closest;
            }, 100);
        }, { passive: true });

        // Touch / pointer drag support for desktop and mobile
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
            try { track.releasePointerCapture(e.pointerId); } catch (err) { }
            // snap to nearest slide
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

        // Start auto
        startAuto();

        // If user touches with finger, stop auto until release (handled by pointer events above)
    }

    function initSiteMenu() {
        const menu = document.getElementById('siteMenu');
        const overlay = document.getElementById('menuOverlay');
        const toggles = document.querySelectorAll('.menu-toggle');
        if (!menu || !overlay || !toggles.length) return;

        const closeBtn = menu.querySelector('.menu-close');

        let lastFocused = null;

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

        // Accordion inside menu
        const accBtns = menu.querySelectorAll('.menu-accordion');
        accBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const expanded = btn.getAttribute('aria-expanded') === 'true';
                btn.setAttribute('aria-expanded', String(!expanded));
                const submenu = btn.nextElementSibling;
                if (submenu) submenu.hidden = expanded;

                // If this accordion has a carousel, initialize or toggle it
                const carousel = btn.parentElement.querySelector('.menu-articles');
                if (carousel) {
                    carousel.hidden = expanded;
                    if (!carousel._menuCarouselInit && !expanded) {
                        initMenuArticlesCarousel(carousel);
                        carousel._menuCarouselInit = true;
                    }
                }
            });
        });

        function initMenuArticlesCarousel(carouselEl) {
            const track = carouselEl.querySelector('.menu-articles-track');
            const prev = carouselEl.querySelector('.menu-article-prev');
            const next = carouselEl.querySelector('.menu-article-next');
            if (!track) return;

            function scrollBySlide(direction) {
                const slide = track.querySelector('.menu-article');
                if (!slide) return;
                const step = slide.offsetWidth + parseFloat(getComputedStyle(track).gap || 0);
                track.scrollBy({ left: direction * step, behavior: 'smooth' });
            }

            prev?.addEventListener('click', function () { scrollBySlide(-1); });
            next?.addEventListener('click', function () { scrollBySlide(1); });

            // pointer drag
            let isDown = false, startX = 0, startScroll = 0;
            track.addEventListener('pointerdown', function (e) {
                isDown = true; track.setPointerCapture(e.pointerId);
                startX = e.clientX; startScroll = track.scrollLeft;
            });
            track.addEventListener('pointermove', function (e) {
                if (!isDown) return; const dx = startX - e.clientX; track.scrollLeft = startScroll + dx;
            });
            function endDrag(e) { if (!isDown) return; isDown = false; try { track.releasePointerCapture(e.pointerId); } catch (err) { } }
            track.addEventListener('pointerup', endDrag); track.addEventListener('pointercancel', endDrag); track.addEventListener('pointerleave', endDrag);
        }
    }

    // Init on DOM ready
    document.addEventListener('DOMContentLoaded', function () {
        initAccordion();
        initCarousel();
        initSiteMenu();
    });
})();