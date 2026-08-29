/*
============================================================
 FEEMAAS CUSTOMER PANEL
 PROJECT CARD COMPONENT
============================================================
*/


function createProjectCard(project){


    const card = document.createElement(
        "article"
    );


    card.className =
        "project-card";



    /*
    --------------------------------------------
    PROJECT STATE
    --------------------------------------------
    */


    const status =
        project.status ||
        "draft";


    const statusMap = {


        draft:{

            label:"پیش‌نویس",

            class:"status-draft"

        },


        tender:{

            label:"در مناقصه",

            class:"status-tender"

        },


        production:{

            label:"در تولید",

            class:"status-production"

        },


        completed:{

            label:"تکمیل شده",

            class:"status-completed"

        },


        default:{

            label:"نامشخص",

            class:"status-default"

        }


    };


    const statusInfo =
        statusMap[status] ||
        statusMap.default;




    /*
    --------------------------------------------
    PROJECT SUMMARY DATA
    --------------------------------------------
    */


    const title =
        project.title ||
        "بدون عنوان";


    const description =
        project.description ||
        "بدون توضیحات";


    const quantity =
        project.quantity ||
        "-";


    const created =
        project.created_at
        ? new Date(
            project.created_at
        ).toLocaleDateString(
            "fa-IR"
        )
        :
        "-";




    /*
    --------------------------------------------
    CARD HTML
    --------------------------------------------
    */


    card.innerHTML = `


        <div class="project-card-glow"></div>


        <header class="project-card-header">


            <div class="project-status ${statusInfo.class}">


                <span class="status-dot"></span>


                ${statusInfo.label}


            </div>


        </header>




        <div class="project-card-body">


            <h3>

                ${escapeHtml(
                    title
                )}

            </h3>



            <p>

                ${escapeHtml(
                    description
                )}

            </p>


        </div>





        <div class="project-card-info">


            <div class="project-info-item">


                <span>
                    مرحله فعلی
                </span>


                <strong>
                    ${statusInfo.label}
                </strong>


            </div>



            <div class="project-info-item">


                <span>
                    تعداد
                </span>


                <strong>
                    ${quantity}
                </strong>


            </div>




            <div class="project-info-item">


                <span>
                    ایجاد
                </span>


                <strong>
                    ${created}
                </strong>


            </div>


        </div>







    `;




    /*
    --------------------------------------------
    EVENTS
    --------------------------------------------
    */


    card.addEventListener(
        "click",
        function(){

            document
            .querySelectorAll(
                ".project-card.selected"
            )
            .forEach(
                item =>
                    item.classList.remove(
                        "selected"
                    )
            );


            card.classList.add(
                "selected"
            );


        }
    );





    card.addEventListener(
        "dblclick",
        function(){


            console.log(
                "Open project:",
                project
            );

if(
    typeof openCustomerProject ===
    "function"
){

   openProjectWorkspace(
    project
);

}
else {

    console.error(
        "openCustomerProject not loaded"
    );

}
        


        }
    );



    return card;


}




/*
============================================================
 HTML SAFE
============================================================
*/


function escapeHtml(
    value
){

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}