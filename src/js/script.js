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

    // Init on DOM ready
    document.addEventListener('DOMContentLoaded', function () {
        initAccordion();
        initCarousel();
    });
})();