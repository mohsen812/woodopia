/*
============================================================
 FEEMAAS CUSTOMER PANEL
 PROJECTS PAGE
 NEON GLASS PROJECT CARDS
============================================================
*/


async function loadProjectsPage(){


    const container =
        document.getElementById(
            "customer-view"
        );


    if(!container){

        console.error(
            "Customer view container not found"
        );

        return;

    }



    container.innerHTML = `

        <div class="page-header">

            <span class="eyebrow">
                PROJECTS
            </span>

            <h2>
                پروژه‌های من
            </h2>

            <p>
                مدیریت سفارش‌ها، فایل‌ها،
                مناقصه‌ها و قراردادهای پروژه‌ها
            </p>

        </div>



        <div
            class="projects-grid"
            id="customer-projects-grid"
        >

            <div class="loading-card">
                در حال دریافت پروژه‌ها...
            </div>


        </div>

    `;



    const grid =
        document.getElementById(
            "customer-projects-grid"
        );



    try {


        const projects =
            await apiGet(
                "/projects/"
            );



        console.log(
            "Customer Projects:",
            projects
        );



        if(
            !projects ||
            projects.length === 0
        ){

            grid.innerHTML = `

                <div class="glass-panel">

                    <h3>
                        هنوز پروژه‌ای ندارید
                    </h3>

                    <p>
                        اولین پروژه خود را ایجاد کنید.
                    </p>

                </div>

            `;

            return;

        }



 grid.innerHTML = "";


projects.forEach(
    project => {

        const card =
            createProjectCard(
                project
            );


        grid.appendChild(
            card
        );

    }
);




    }
    catch(error){


        console.error(
            "Project loading error:",
            error
        );


        grid.innerHTML = `

            <div class="glass-panel error">

                خطا در دریافت پروژه‌ها

            </div>

        `;


    }


}







function getProjectStatusStyle(
    status
){


    const map = {


        draft:{

            label:"پیش‌نویس",

            color:"cyan"

        },


        tender:{

            label:"مناقصه",

            color:"purple"

        },


        production:{

            label:"در حال تولید",

            color:"green"

        },


        completed:{

            label:"تکمیل شده",

            color:"gold"

        }


    };



    return (
        map[status]
        ||
        {

            label:status || "نامشخص",

            color:"cyan"

        }

    );


}







function createCustomerProjectCard(
    project
){



    const status =
        getProjectStatusStyle(
            project.status
        );



    return `


    <article

        class="
            customer-project-card
            neon-${status.color}
        "

        data-project-id="${project.id}"

    >



        <div class="project-glow"></div>




        <div class="project-card-header">


            <div class="project-status-light">

                <span></span>

                ${status.label}

            </div>



            <div class="project-id">

                #${project.id}

            </div>


        </div>





        <h3>

            ${
                project.title ||
                "بدون عنوان"
            }

        </h3>




        <p class="project-description">

            ${
                project.description ||
                "بدون توضیحات"
            }

        </p>





        <div class="project-metrics">


            <div>

                <span>
                    تعداد
                </span>


                <strong>
                    ${
                        project.quantity ??
                        "-"
                    }
                </strong>


            </div>




            <div>

                <span>
                    بودجه
                </span>


                <strong>
                    ${
                        project.budget ??
                        "-"
                    }
                </strong>


            </div>




            <div>

                <span>
                    فایل
                </span>


                <strong>
                    📎
                </strong>


            </div>


        </div>





        <div class="project-card-footer">


            <span>
                مشاهده فضای پروژه →
            </span>


        </div>



    </article>


    `;


}



window.loadProjectsPage =
    loadProjectsPage;