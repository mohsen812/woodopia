(function () {

    "use strict";


    /*
    --------------------------------------------------
    CUSTOMER SIDEBAR NAVIGATION
    --------------------------------------------------
    */


    const sidebarLinks =
        document.querySelectorAll(
            "[data-sidebar-target]"
        );


    const createProjectSidebarButton =
        document.querySelector(
            '[data-sidebar-action="create-project"]'
        );


    const dashboardSection =
        document.querySelector(
            ".welcome-section"
        );


    const projectsSection =
        document.querySelector(
            ".projects-section"
        );


    const createProjectModal =
        document.getElementById(
            "createProjectModal"
        );


    const createProjectButton =
        document.getElementById(
            "createProjectBtn"
        );



    /*
    --------------------------------------------------
    ACTIVE SIDEBAR ITEM
    --------------------------------------------------
    */


    function setActiveLink(link) {

        sidebarLinks.forEach(
            function (item) {

                item.classList.remove(
                    "active"
                );

            }
        );


        if (link) {

            link.classList.add(
                "active"
            );

        }

    }



    /*
    --------------------------------------------------
    SCROLL TO DASHBOARD
    --------------------------------------------------
    */


    function showDashboard(link) {

        setActiveLink(link);


        if (!dashboardSection) {

            return;

        }


        dashboardSection.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

    }



    /*
    --------------------------------------------------
    SCROLL TO PROJECTS
    --------------------------------------------------
    */


    function showProjects(link) {

        setActiveLink(link);


        if (!projectsSection) {

            return;

        }


        projectsSection.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

    }



    /*
    --------------------------------------------------
    OPEN CREATE PROJECT MODAL
    --------------------------------------------------
    */


    function openCreateProjectModal(link) {

        setActiveLink(link);


        /*
        اگر منطق اصلی customer.js دکمه
        createProjectBtn را فعال کرده باشد،
        همان دکمه را صدا می‌زنیم.
        */


        if (createProjectButton) {

            createProjectButton.click();

            return;

        }


        /*
        fallback:
        اگر دکمه اصلی پیدا نشد، خود Modal
        را باز می‌کنیم.
        */


        if (createProjectModal) {

            createProjectModal.classList.remove(
                "hidden"
            );

        }

    }



    /*
    --------------------------------------------------
    FUTURE SECTIONS
    --------------------------------------------------
    */


    function futureSection(link, name) {

        setActiveLink(link);


        console.log(
            "Customer section not implemented yet:",
            name
        );


        alert(
            "بخش «" +
            name +
            "» هنوز در حال توسعه است."
        );

    }



    /*
    --------------------------------------------------
    SIDEBAR EVENTS
    --------------------------------------------------
    */


    sidebarLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const target =
                        link.getAttribute(
                            "data-sidebar-target"
                        );


                    if (
                        target ===
                        "dashboard"
                    ) {

                        showDashboard(
                            link
                        );

                        return;

                    }


                    if (
                        target ===
                        "projects"
                    ) {

                        showProjects(
                            link
                        );

                        return;

                    }


                    if (
                        target ===
                        "tenders"
                    ) {

                        futureSection(
                            link,
                            "مناقصه‌ها"
                        );

                        return;

                    }


                    if (
                        target ===
                        "contracts"
                    ) {

                        futureSection(
                            link,
                            "قراردادها"
                        );

                        return;

                    }


                    if (
                        target ===
                        "payments"
                    ) {

                        futureSection(
                            link,
                            "پرداخت‌ها"
                        );

                        return;

                    }


                    if (
                        target ===
                        "files"
                    ) {

                        futureSection(
                            link,
                            "فایل‌ها"
                        );

                        return;

                    }


                    if (
                        target ===
                        "settings"
                    ) {

                        futureSection(
                            link,
                            "تنظیمات"
                        );

                    }

                }
            );

        }
    );



    /*
    --------------------------------------------------
    CREATE PROJECT SIDEBAR
    --------------------------------------------------
    */


    if (
        createProjectSidebarButton
    ) {

        createProjectSidebarButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                openCreateProjectModal(
                    createProjectSidebarButton
                );

            }
        );

    }



})();