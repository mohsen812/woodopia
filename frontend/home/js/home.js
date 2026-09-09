(function () {

    "use strict";


    /* =====================================================
       HEADER
    ====================================================== */

    const header =
        document.getElementById("site-header");

    function updateHeader() {

        if (!header) {
            return;
        }

        if (window.scrollY > 30) {

            header.classList.add("scrolled");

        } else {

            header.classList.remove("scrolled");

        }
    }

    window.addEventListener(
        "scroll",
        updateHeader,
        { passive: true }
    );

    updateHeader();


    /* =====================================================
       MOBILE MENU
    ====================================================== */

    const menuToggle =
        document.getElementById("menu-toggle");

    const mainNav =
        document.getElementById("main-nav");

    if (menuToggle && mainNav) {

        menuToggle.addEventListener(
            "click",
            function () {

                const isOpen =
                    mainNav.classList.toggle("open");

                menuToggle.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

            }
        );


        mainNav
            .querySelectorAll("a")
            .forEach(function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        mainNav.classList.remove("open");

                        menuToggle.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            });

    }


    /* =====================================================
       COUNTERS
    ====================================================== */

    const counters =
        document.querySelectorAll(
            "[data-counter]"
        );

    function animateCounter(element) {

        const target =
            Number(
                element.dataset.counter
            );

        if (!Number.isFinite(target)) {
            return;
        }

        const duration = 1400;

        const start =
            performance.now();

        function tick(now) {

            const progress =
                Math.min(
                    (now - start) / duration,
                    1
                );

            const eased =
                1 - Math.pow(
                    1 - progress,
                    3
                );

            const value =
                Math.floor(
                    target * eased
                );

            element.textContent =
                value.toLocaleString("en-US");

            if (progress < 1) {

                requestAnimationFrame(tick);

            } else {

                element.textContent =
                    target.toLocaleString("en-US");

            }
        }

        requestAnimationFrame(tick);
    }


    if ("IntersectionObserver" in window) {

        const counterObserver =
            new IntersectionObserver(
                function (entries, observer) {

                    entries.forEach(function (entry) {

                        if (!entry.isIntersecting) {
                            return;
                        }

                        animateCounter(
                            entry.target
                        );

                        observer.unobserve(
                            entry.target
                        );

                    });

                },
                {
                    threshold: 0.45
                }
            );


        counters.forEach(function (counter) {

            counterObserver.observe(counter);

        });

    } else {

        counters.forEach(
            animateCounter
        );

    }


    /* =====================================================
       SIMPLE PARALLAX
    ====================================================== */

    const heroVisual =
        document.querySelector(
            ".hero-visual"
        );

    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    if (
        heroVisual &&
        !reducedMotion &&
        window.matchMedia("(pointer:fine)").matches
    ) {

        let ticking = false;

        window.addEventListener(
            "scroll",
            function () {

                if (ticking) {
                    return;
                }

                ticking = true;

                requestAnimationFrame(
                    function () {

                        const scroll =
                            window.scrollY;

                        const movement =
                            Math.min(
                                scroll * 0.08,
                                35
                            );

                        heroVisual.style.transform =
                            "translateY(" +
                            movement +
                            "px)";

                        ticking = false;

                    }
                );

            },
            { passive: true }
        );

    }


    /* =====================================================
       CARD POINTER EFFECT
    ====================================================== */

    const cards =
        document.querySelectorAll(
            ".project-card, .workshop-card, .designer-card"
        );


    if (
        !reducedMotion &&
        window.matchMedia("(pointer:fine)").matches
    ) {

        cards.forEach(function (card) {

            card.addEventListener(
                "pointermove",
                function (event) {

                    const rect =
                        card.getBoundingClientRect();

                    const x =
                        event.clientX -
                        rect.left;

                    const y =
                        event.clientY -
                        rect.top;

                    const rotateY =
                        ((x / rect.width) - 0.5) * 2;

                    const rotateX =
                        ((y / rect.height) - 0.5) * -2;

                    card.style.transform =
                        "perspective(900px) " +
                        "rotateX(" +
                        rotateX +
                        "deg) " +
                        "rotateY(" +
                        rotateY +
                        "deg) " +
                        "translateY(-4px)";

                }
            );


            card.addEventListener(
                "pointerleave",
                function () {

                    card.style.transform =
                        "";

                }
            );

        });

    }

})();
