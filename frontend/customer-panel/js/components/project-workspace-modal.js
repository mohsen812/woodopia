/*
============================================================
 FEEMAAS CUSTOMER PANEL
 PROJECT WORKSPACE MODAL
============================================================
*/



function openProjectWorkspace(project){
const oldModal =
    document.getElementById(
        "project-workspace-modal"
    );


if(oldModal){

    oldModal.remove();

}

    let modal =
        document.getElementById(
            "project-workspace-modal"
        );


    if(!modal){

        modal =
            document.createElement(
                "div"
            );


        modal.id =
            "project-workspace-modal";


        document.body.appendChild(
            modal
        );

    }



    modal.innerHTML = `


        <div class="project-modal-overlay">


            <div class="project-modal-window">


                <button
                    class="project-modal-close"
                    id="close-project-modal"
                >
                    ×
                </button>



                <header class="project-modal-header">


                    <span class="eyebrow">
                        PROJECT WORKSPACE
                    </span>


                    <h2>
                        ${escapeHtml(project.title)}
                    </h2>


                    <p>
                        ${
                        escapeHtml(
                            project.description ||
                            "بدون توضیحات"
                        )
                        }
                    </p>


                    <div class="project-modal-status">

                        وضعیت:

                        <strong>
                            ${project.status}
                        </strong>

                    </div>


                </header>




                <div class="project-modal-tabs">


                    <button class="active">
                        📁 فایل‌ها
                    </button>


                    <button>
                        💬 گفتگو
                    </button>


                    <button>
                        ◇ مناقصه
                    </button>


                    <button>
                        📄 قرارداد
                    </button>


                    <button>
                        👥 تیم پروژه
                    </button>


                </div>




                <div class="project-modal-content">


                    <div class="project-module-card">

                        <span>
                            📁
                        </span>

                        <h3>
                            فایل‌ها و طراحی‌ها
                        </h3>

                        <p>
                            فایل‌های ارسال شده توسط مشتری
                        </p>

                    </div>



                    <div class="project-module-card">

                        <span>
                            💬
                        </span>

                        <h3>
                            گفتگو
                        </h3>

                        <p>
                            ارتباط با مشاور و کارگاه
                        </p>

                    </div>



                    <div class="project-module-card">

                        <span>
                            ◇
                        </span>

                        <h3>
                            مناقصه
                        </h3>

                        <p>
                            پیشنهادهای دریافتی
                        </p>

                    </div>



                    <div class="project-module-card">

                        <span>
                            📄
                        </span>

                        <h3>
                            قرارداد
                        </h3>

                        <p>
                            پرداخت و قرارداد پروژه
                        </p>

                    </div>



                </div>



            </div>


        </div>


    `;



   modal
    .querySelector(
        "#close-project-modal"
    )
    .onclick =
    function(){


        modal.remove();


    };



}





window.openProjectWorkspace =
    openProjectWorkspace;