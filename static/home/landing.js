/* =========================================================
   FEEMAAS LANDING PAGE
   VERSION 8
========================================================= */

"use strict";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initCounters();

        initImageFallbacks();

        initScrollReveal();

        initLiveFeed();

        initSmoothNavigation();

        initCardInteraction();

    }
);


/* =========================================================
   COUNTERS
========================================================= */

function initCounters() {

    const counters =
        document.querySelectorAll(
            ".counter"
        );


    if (!counters.length) {
        return;
    }


    const observer =
        new IntersectionObserver(
            (entries, observerInstance) => {

                entries.forEach(
                    entry => {

                        if (!entry.isIntersecting) {
                            return;
                        }


                        const element =
                            entry.target;


                        const target =
                            Number(
                                element.dataset.target
                            );


                        animateCounter(
                            element,
                            target,
                            1300
                        );


                        observerInstance.unobserve(
                            element
                        );

                    }
                );

            },
            {
                threshold: .45
            }
        );


    counters.forEach(
        counter => observer.observe(counter)
    );

}


function animateCounter(
    element,
    target,
    duration
) {

    const start =
        performance.now();


    function update(
        currentTime
    ) {

        const progress =
            Math.min(
                (currentTime - start) /
                duration,
                1
            );


        const eased =
            1 -
            Math.pow(
                1 - progress,
                4
            );


        const value =
            Math.floor(
                target * eased
            );


        element.textContent =
            formatNumber(value);


        if (progress < 1) {

            requestAnimationFrame(
                update
            );

        } else {

            element.textContent =
                formatNumber(target);

        }

    }


    requestAnimationFrame(update);

}


function formatNumber(value) {

    return new Intl.NumberFormat(
        "fa-IR"
    ).format(value);

}


/* =========================================================
   IMAGE FALLBACK
========================================================= */

function initImageFallbacks() {

    const images =
        document.querySelectorAll(
            "img"
        );


    images.forEach(
        image => {

            image.addEventListener(
                "error",
                () => {

                    image.style.display =
                        "none";


                    if (
                        image.parentElement
                    ) {

                        image.parentElement
                            .classList
                            .add(
                                "image-fallback"
                            );

                    }

                }
            );

        }
    );

}


/* =========================================================
   SCROLL REVEAL
========================================================= */

function initScrollReveal() {

    const elements =
        document.querySelectorAll(
            ".capability-card, .order-card, .design-card, .stat-card, .process-item, .activity-item"
        );


    if (!elements.length) {
        return;
    }


    elements.forEach(
        (element, index) => {

            element.style.opacity =
                "0";

            element.style.transform =
                "translateY(20px)";

            element.style.transition =
                `opacity .6s ease ${index * .04}s,
                 transform .6s cubic-bezier(.2,.7,.2,1) ${index * .04}s`;

        }
    );


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            !entry.isIntersecting
                        ) {
                            return;
                        }


                        entry.target.style.opacity =
                            "1";


                        entry.target.style.transform =
                            "translateY(0)";


                        observer.unobserve(
                            entry.target
                        );

                    }
                );

            },
            {
                threshold: .12
            }
        );


    elements.forEach(
        element => observer.observe(element)
    );

}


/* =========================================================
   SMOOTH NAVIGATION
========================================================= */

function initSmoothNavigation() {

    const links =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    links.forEach(
        link => {

            link.addEventListener(
                "click",
                event => {

                    const selector =
                        link.getAttribute(
                            "href"
                        );


                    if (
                        !selector ||
                        selector === "#"
                    ) {

                        return;

                    }


                    const target =
                        document.querySelector(
                            selector
                        );


                    if (!target) {
                        return;
                    }


                    event.preventDefault();


                    const navbar =
                        document.querySelector(
                            ".navbar"
                        );


                    const offset =
                        navbar
                            ? navbar.offsetHeight
                            : 0;


                    const targetPosition =
                        target.getBoundingClientRect()
                            .top +
                        window.scrollY -
                        offset -
                        15;


                    window.scrollTo(
                        {
                            top:
                                targetPosition,

                            behavior:
                                "smooth"
                        }
                    );

                }
            );

        }
    );

}


/* =========================================================
   LIVE FEED
========================================================= */

function initLiveFeed() {

    const items =
        document.querySelectorAll(
            ".activity-item"
        );


    if (!items.length) {
        return;
    }


    const events = [

        {
            text:
                "یک کارگاه سفارش جدید دریافت کرد",

            time:
                "همین حالا · تهران",

            shape:
                "triangle-small",

            color:
                "green"

        },

        {
            text:
                "طراحی جدید وارد مرحله تولید شد",

            time:
                "۲ دقیقه پیش · شبکه تولید",

            shape:
                "hex-small",

            color:
                "purple"

        },

        {
            text:
                "یک پروژه با موفقیت تحویل شد",

            time:
                "۵ دقیقه پیش · اصفهان",

            shape:
                "square-small",

            color:
                "blue"

        }

    ];


    let eventIndex =
        0;


    setInterval(
        () => {

            const item =
                items[
                    eventIndex %
                    items.length
                ];


            const data =
                events[
                    eventIndex %
                    events.length
                ];


            const title =
                item.querySelector(
                    "strong"
                );


            const time =
                item.querySelector(
                    "small"
                );


            const led =
                item.querySelector(
                    ".activity-led"
                );


            const shape =
                item.querySelector(
                    ".activity-shape"
                );


            if (title) {

                title.style.opacity =
                    "0";


                setTimeout(
                    () => {

                        title.textContent =
                            data.text;

                        title.style.opacity =
                            "1";

                    },
                    180
                );

            }


            if (time) {

                time.textContent =
                    data.time;

            }


            if (led) {

                led.className =
                    "activity-led " +
                    data.color;

            }


            if (shape) {

                shape.className =
                    "activity-shape " +
                    data.shape;

            }


            item.animate(
                [
                    {
                        transform:
                            "translateX(0)"
                    },
                    {
                        transform:
                            "translateX(-7px)"
                    },
                    {
                        transform:
                            "translateX(0)"
                    }
                ],
                {
                    duration:
                        650,

                    easing:
                        "ease-out"
                }
            );


            eventIndex++;

        },
        7000
    );

}


/* =========================================================
   CARD INTERACTION
========================================================= */

function initCardInteraction() {

    const cards =
        document.querySelectorAll(
            ".capability-card, .order-card, .design-card"
        );


    cards.forEach(
        card => {

            card.addEventListener(
                "mouseenter",
                () => {

                    const led =
                        card.querySelector(
                            ".card-live i, .visual-led, .design-led i"
                        );


                    if (led) {

                        led.style.animationDuration =
                            ".6s";

                    }

                }
            );


            card.addEventListener(
                "mouseleave",
                () => {

                    const led =
                        card.querySelector(
                            ".card-live i, .visual-led, .design-led i"
                        );


                    if (led) {

                        led.style.animationDuration =
                            "1.5s";

                    }

                }
            );

        }
    );

}


/* =========================================================
   HERO PARALLAX
========================================================= */

const heroVisual =
    document.querySelector(
        ".hero-image-card"
    );


if (heroVisual) {

    window.addEventListener(
        "mousemove",
        event => {

            if (
                window.innerWidth <
                850
            ) {

                return;

            }


            const x =
                (event.clientX /
                    window.innerWidth -
                    .5) *
                8;


            const y =
                (event.clientY /
                    window.innerHeight -
                    .5) *
                5;


            heroVisual.style.transform =
                `rotate(1.2deg)
                 translate(${x}px, ${y}px)`;

        }
    );

}


/* =========================================================
   LIVE BAR RANDOM MICRO UPDATE
========================================================= */

function updateLiveBar() {

    const values =
        document.querySelectorAll(
            ".live-events b"
        );


    if (!values.length) {
        return;
    }


    const increments = [
        12,
        8,
        24
    ];


    values.forEach(
        (element, index) => {

            if (index >= 3) {
                return;
            }


            const base =
                increments[index];


            const random =
                Math.floor(
                    Math.random() * 4
                );


            element.textContent =
                formatNumber(
                    base + random
                );

        }
    );

}


setInterval(
    updateLiveBar,
    10000
);


/* =========================================================
   SHAPE INTERACTION
========================================================= */

const shapeItems =
    document.querySelectorAll(
        ".shape-item"
    );


shapeItems.forEach(
    item => {

        item.addEventListener(
            "click",
            () => {

                shapeItems.forEach(
                    shape =>
                        shape.classList.remove(
                            "active"
                        )
                );


                item.classList.add(
                    "active"
                );

            }
        );

    }
);


/* =========================================================
   PREVENT BROKEN PLACEHOLDER LINKS
========================================================= */

document.querySelectorAll(
    'a[href="#"]'
).forEach(
    link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();

            }
        );

    }
);