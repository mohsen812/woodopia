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
        document.getElementById("projects");


    const projectsContainer =
        document.getElementById("projects-list");


    try {


        const projects =
            await apiGet("/projects/");



        /*
        ================================
        Dashboard Recent Projects
        ================================
        */


        if (dashboardContainer) {


            dashboardContainer.innerHTML = "";


            if (!projects.length) {


                dashboardContainer.innerHTML = `

                    <div class="loading-state">

                        هنوز پروژه‌ای ایجاد نشده است.

                    </div>

                `;


            }
            else {


                projects
                    .slice(0,5)
                    .forEach(project => {


                        dashboardContainer.appendChild(
                            createProjectCard(project)
                        );


                    });


            }

        }



        /*
        ================================
        All Projects View
        ================================
        */


        if (projectsContainer) {


            projectsContainer.innerHTML = "";


            if (!projects.length) {


                projectsContainer.innerHTML = `

                    <div class="loading-state">

                        هنوز پروژه‌ای ایجاد نشده است.

                    </div>

                `;


            }
            else {


                projects.forEach(project => {


                    projectsContainer.appendChild(
                        createProjectCard(project)
                    );


                });


            }

        }


    }
    catch(error) {


        const message = `

            <div class="loading-state">

                خطا در دریافت پروژه‌ها

            </div>

        `;



        if(dashboardContainer){

            dashboardContainer.innerHTML =
                message;

        }



        if(projectsContainer){

            projectsContainer.innerHTML =
                message;

        }



        console.error(
            "FEEMAAS Workspace:",
            error
        );


    }


}





/*
============================================================
 VIEW MANAGEMENT
============================================================
*/


function showView(target){


    const views =
        document.querySelectorAll(
            ".workspace-view"
        );



    const navItems =
        document.querySelectorAll(
            ".nav-item[data-view]"
        );



    /*
    Hide all views
    */

    views.forEach(view => {


        view.classList.add(
            "hidden"
        );


    });



    /*
    Remove active state
    */

    navItems.forEach(nav => {


        nav.classList.remove(
            "active"
        );


    });



    const targetView =
        document.getElementById(
            `${target}-view`
        );



    if(!targetView){


        console.warn(
            "FEEMAAS: View not found",
            target
        );


        return;

    }



    targetView.classList.remove(
        "hidden"
    );



    const activeNav =
        document.querySelector(
            `.nav-item[data-view="${target}"]`
        );



    if(activeNav){


        activeNav.classList.add(
            "active"
        );


    }



    window.scrollTo({

        top:0,

        behavior:"smooth"

    });


}






/*
============================================================
 NAVIGATION
============================================================
*/


function setupNavigation(){



    const navItems =
        document.querySelectorAll(
            ".nav-item[data-view]"
        );



    navItems.forEach(item => {



        item.addEventListener(
            "click",
            function(){


                const target =
                    item.dataset.view;


                showView(target);


            }
        );


    });




    const buttons =
        document.querySelectorAll(
            "[data-view]:not(.nav-item)"
        );



    buttons.forEach(button => {


        button.addEventListener(
            "click",
            function(){


                showView(
                    button.dataset.view
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


function setupModal(){



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



    if(!modal){

        return;

    }



    if(closeButton){


        closeButton.addEventListener(
            "click",
            closeProjectModal
        );


    }



    if(backdrop){


        backdrop.addEventListener(
            "click",
            closeProjectModal
        );


    }



    document.addEventListener(
        "keydown",
        function(event){


            if(
                event.key === "Escape" &&
                !modal.classList.contains("hidden")
            ){


                closeProjectModal();


            }


        }
    );



}






/*
============================================================
 INITIAL DASHBOARD STATE
============================================================
*/


function initializeWorkspace(){


    showView(
        "dashboard"
    );


    setupNavigation();


    setupModal();


    loadProjects();


}






document.addEventListener(
    "DOMContentLoaded",
    function(){

        window.scrollTo(0,0);

        initializeWorkspace();

    }
);