document.addEventListener(
"DOMContentLoaded",
function(){

    loadCustomerProjects();

    loadCustomerDashboard();

}

);

// =====================================
// CUSTOMER PROJECTS
// =====================================

async function loadCustomerProjects(){

const container =
    document.getElementById(
        "projects-list"
    );


if(!container){
    return;
}


try{

    const projects =
        await apiGet(
            "/projects/"
        );


    console.log(
        "CUSTOMER PROJECTS:",
        projects
    );


    if(projects.length === 0){

        container.innerHTML =
        `
        <div class="card">
            هنوز پروژه‌ای ثبت نشده است
        </div>
        `;

        return;

    }


    container.innerHTML = "";


    projects.forEach(
        project => {

            const card =
                createProjectCard(
                    project
                );


            container.appendChild(
                card
            );

        }
    );

}
catch(error){

    console.error(
        error
    );


    container.innerHTML =
    `
    خطا در دریافت پروژه‌ها
    `;

}

}

// =====================================
// CUSTOMER DASHBOARD — RECENT PROJECTS
// =====================================

async function loadCustomerDashboard(){

const container =
    document.getElementById(
        "projects"
    );


if(!container){
    return;
}


try{

    const projects =
        await apiGet(
            "/projects/"
        );


    console.log(
        "CUSTOMER DASHBOARD PROJECTS:",
        projects
    );


    if(
        !projects ||
        projects.length === 0
    ){

        container.innerHTML =
        `
        <div class="card">
            هنوز پروژه‌ای ثبت نشده است
        </div>
        `;

        return;

    }


    const recentProjects =
        projects.slice(
            0,
            3
        );


    container.innerHTML = "";


    recentProjects.forEach(
        project => {

            const card =
                createProjectCard(
                    project
                );


            container.appendChild(
                card
            );

        }
    );


}
catch(error){

    console.error(
        "FEEMAAS: Dashboard projects failed",
        error
    );


    container.innerHTML =
    `
    <div class="card">
        خطا در دریافت پروژه‌های اخیر
    </div>
    `;

}

}

// =====================================
// CUSTOMER WORKSPACE NAVIGATION
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        const navItems =
            document.querySelectorAll(
                "[data-view]"
            );


        const views =
            document.querySelectorAll(
                ".workspace-view"
            );


        const pageTitle =
            document.querySelector(
                ".topbar h1"
            );


        navItems.forEach(
            item => {


                item.addEventListener(
                    "click",
                    function(){


                        const target =
                            this.dataset.view;


                        if(
                            !target
                        ){
                            return;
                        }


                        views.forEach(
                            view => {

                                view.classList.add(
                                    "hidden"
                                );

                            }
                        );


                        const targetView =
                            document.getElementById(
                                target + "-view"
                            );


                        if(targetView){

                            targetView.classList.remove(
                                "hidden"
                            );

                        }


                        navItems.forEach(
                            nav => {

                                nav.classList.remove(
                                    "active"
                                );

                            }
                        );


                        this.classList.add(
                            "active"
                        );


                        if(pageTitle){

                            const titles = {

                                dashboard:
                                    "پیشخوان",

                                projects:
                                    "پروژه‌های من",

                                tenders:
                                    "مناقصه‌ها",

                                messages:
                                    "پیام‌ها",

                                contracts:
                                    "قراردادها",

                                payments:
                                    "پرداخت‌ها",

                                files:
                                    "فایل‌ها",

                                settings:
                                    "تنظیمات",

                                profile:
                                    "حساب کاربری"

                            };


                            pageTitle.innerText =
                                titles[target] ||
                                "Workspace";

                        }


                    }
                );


            }
        );


    }
);