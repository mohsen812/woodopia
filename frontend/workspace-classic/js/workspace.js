/*
============================================================
 FEEMAAS WORKSPACE ENGINE
 Dashboard / Navigation / Projects / Modal
============================================================
*/


/*
============================================================
 PROJECT LOADING
============================================================
*/

async function loadProjects() {

    const dashboardContainer =
        document.getElementById(
            "projects"
        );


    const projectsContainer =
        document.getElementById(
            "projects-list"
        );


    try {

        const projects =
            await apiGet(
                "/projects/"
            );


        console.log(
            "FEEMAAS Workspace: Projects loaded:",
            projects
        );



        /*
        ====================================================
         DASHBOARD — RECENT PROJECTS
        ====================================================
        */

        if (dashboardContainer) {

            dashboardContainer.innerHTML = "";


            if (
                !Array.isArray(projects) ||
                projects.length === 0
            ) {

                dashboardContainer.innerHTML = `

                    <div class="loading-state">

                        هنوز پروژه‌ای ایجاد نشده است.

                    </div>

                `;

            }
            else {

                projects
                    .slice(0, 5)
                    .forEach(project => {

                        dashboardContainer.appendChild(
                            createProjectCard(
                                project
                            )
                        );

                    });

            }

        }



        /*
        ====================================================
         PROJECTS PAGE — ALL PROJECTS
        ====================================================
        */

        if (projectsContainer) {

            projectsContainer.innerHTML = "";


            if (
                !Array.isArray(projects) ||
                projects.length === 0
            ) {

                projectsContainer.innerHTML = `

                    <div class="loading-state">

                        هنوز پروژه‌ای ایجاد نشده است.

                    </div>

                `;

            }
            else {

                projects.forEach(project => {

                    projectsContainer.appendChild(
                        createProjectCard(
                            project
                        )
                    );

                });

            }

        }

    }
    catch (error) {

        console.error(
            "FEEMAAS Workspace: Project loading error:",
            error
        );


        const message = `

            <div class="loading-state">

                خطا در دریافت پروژه‌ها

            </div>

        `;


        if (dashboardContainer) {

            dashboardContainer.innerHTML =
                message;

        }


        if (projectsContainer) {

            projectsContainer.innerHTML =
                message;

        }

    }

}



/*
============================================================
 VIEW MANAGEMENT
============================================================
*/

function showView(target) {

    if (!target) {

        return;

    }


    const views =
        document.querySelectorAll(
            ".workspace-view"
        );


    const navItems =
        document.querySelectorAll(
            ".nav-item[data-view]"
        );


    /*
    ========================================================
     HIDE ALL VIEWS
    ========================================================
    */

    views.forEach(view => {

        view.classList.add(
            "hidden"
        );

    });


    /*
    ========================================================
     REMOVE ACTIVE NAVIGATION
    ========================================================
    */

    navItems.forEach(nav => {

        nav.classList.remove(
            "active"
        );

    });


    /*
    ========================================================
     FIND TARGET VIEW
    ========================================================
    */

    const targetView =
        document.getElementById(
            `${target}-view`
        );


    if (!targetView) {

        console.warn(
            "FEEMAAS: View not found:",
            target
        );

        return;

    }


    /*
    ========================================================
     SHOW TARGET
    ========================================================
    */

    targetView.classList.remove(
        "hidden"
    );


    /*
    ========================================================
     ACTIVE NAV ITEM
    ========================================================
    */

    const activeNav =
        document.querySelector(
            `.nav-item[data-view="${target}"]`
        );


    if (activeNav) {

        activeNav.classList.add(
            "active"
        );

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}



/*
============================================================
 NAVIGATION
============================================================
*/

function setupNavigation() {

    /*
    ========================================================
     SIDEBAR NAVIGATION
    ========================================================
    */

    const navItems =
        document.querySelectorAll(
            ".nav-item[data-view]"
        );


    navItems.forEach(item => {

        item.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                const target =
                    item.dataset.view;


                showView(
                    target
                );

            }
        );

    });



    /*
    ========================================================
     OTHER DATA-VIEW BUTTONS
    ========================================================
    */

    const buttons =
        document.querySelectorAll(
            "[data-view]:not(.nav-item)"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                const target =
                    button.dataset.view;


                showView(
                    target
                );

            }
        );

    });

}



/*
============================================================
 PROJECT MODAL
============================================================
*/

function setupModal() {

    const modal =
        document.getElementById(
            "project-modal"
        );


    const closeButton =
        document.getElementById(
            "close-project-modal"
        );


    const backdrop =
        document.querySelector(
            "#project-modal .modal-backdrop"
        );


    if (!modal) {

        console.warn(
            "FEEMAAS: Project modal not found."
        );

        return;

    }



    /*
    ========================================================
     CLOSE BUTTON
    ========================================================
    */

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                closeProjectModal();

            }
        );

    }



    /*
    ========================================================
     BACKDROP
    ========================================================
    */

    if (backdrop) {

        backdrop.addEventListener(
            "click",
            function() {

                closeProjectModal();

            }
        );

    }



    /*
    ========================================================
     ESC KEY
    ========================================================
    */

    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Escape" &&
                !modal.classList.contains("hidden")
            ) {

                closeProjectModal();

            }

        }
    );

}



/*
============================================================
 INITIALIZE WORKSPACE
============================================================
*/

function initializeWorkspace() {

    console.log(
        "FEEMAAS Workspace: Initializing..."
    );


    /*
    ========================================================
     INITIAL VIEW
    ========================================================
    */

    showView(
        "dashboard"
    );


    /*
    ========================================================
     NAVIGATION
    ========================================================
    */

    setupNavigation();


    /*
    ========================================================
     MODAL
    ========================================================
    */

    setupModal();


    /*
    ========================================================
     PROJECTS
    ========================================================
    */

    loadProjects();

}



/*
============================================================
 DOM READY
============================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    function() {

        window.scrollTo(
            0,
            0
        );


        initializeWorkspace();

    }
);