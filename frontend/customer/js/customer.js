(function () {

    "use strict";


    /*
    --------------------------------------------------
    CONFIG
    --------------------------------------------------
    */


    const IDENTITY_URL =
        "/api/workspace/identity/";


    const PROJECTS_URL =
        "/projects/";



    const CREATE_PROJECT_URL =
        "/projects/";



    /*
    --------------------------------------------------
    STATE
    --------------------------------------------------
    */


    let currentProject = null;



    /*
    --------------------------------------------------
    DOM REFERENCES
    --------------------------------------------------
    */


    const usernameElement =
        document.getElementById(
            "customerUsername"
        );


    const projectCountElement =
        document.getElementById(
            "projectCount"
        );


    const projectsListElement =
        document.getElementById(
            "projectsList"
        );


    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );



    const createProjectButton =
        document.getElementById(
            "createProjectBtn"
        );



    /*
    --------------------------------------------------
    PROJECT MODAL DOM
    --------------------------------------------------
    */


    const projectModal =
        document.getElementById(
            "projectModal"
        );


    const closeProjectModalButton =
        document.getElementById(
            "closeProjectModal"
        );


    const modalProjectTitle =
        document.getElementById(
            "modalProjectTitle"
        );


    const modalProjectStatus =
        document.getElementById(
            "modalProjectStatus"
        );


    const modalProjectContent =
        document.getElementById(
            "modalProjectContent"
        );



    /*
    --------------------------------------------------
    CREATE PROJECT MODAL DOM
    --------------------------------------------------
    */


    const createProjectModal =
        document.getElementById(
            "createProjectModal"
        );


    const closeCreateProjectModalButton =
        document.getElementById(
            "closeCreateProjectModal"
        );


    const createProjectForm =
        document.getElementById(
            "createProjectForm"
        );



    /*
    --------------------------------------------------
    INIT
    --------------------------------------------------
    */


 if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeCustomerPanel
    );

} else {

    initializeCustomerPanel();

}



    async function initializeCustomerPanel(){


        try {


            const identity =
                await loadIdentity();



            if(!identity){

                return;

            }



            renderIdentity(
                identity
            );



            await loadProjects();



        }
        catch(error){


            console.error(
                "Customer panel error:",
                error
            );



            showError(
                "خطا در بارگذاری پنل مشتری"
            );


        }


    }






    /*
    --------------------------------------------------
    IDENTITY
    --------------------------------------------------
    */



    async function loadIdentity(){



        const response =
            await fetch(
                IDENTITY_URL,
                {

                    credentials:
                        "same-origin",

                    headers:{

                        "Accept":
                            "application/json"

                    }

                }

            );




        if(response.status === 401){


            redirectToLogin();

            return null;


        }




        if(!response.ok){


            throw new Error(
                "Identity failed"
            );


        }



        return await response.json();



    }







    function renderIdentity(identity){



        if(!usernameElement){

            return;

        }



        const user =
            identity.user || {};



        usernameElement.textContent =
            user.username ||
            user.email ||
            "کاربر";



    }






    /*
    --------------------------------------------------
    PROJECTS LOAD
    --------------------------------------------------
    */



    async function loadProjects(){



        const response =
            await fetch(
                PROJECTS_URL,
                {

                    credentials:
                        "same-origin",

                    headers:{

                        "Accept":
                            "application/json"

                    }

                }

            );





        if(response.status === 401){


            redirectToLogin();

            return;


        }






        if(!response.ok){


            throw new Error(
                "Projects failed"
            );


        }





        const data =
            await response.json();





        const projects =
            normalizeProjects(
                data
            );




        renderProjects(
            projects
        );



    }







    function normalizeProjects(data){



        if(Array.isArray(data)){


            return data;


        }




        if(
            data &&
            Array.isArray(data.results)
        ){


            return data.results;


        }




        if(
            data &&
            Array.isArray(data.projects)
        ){


            return data.projects;


        }




        return [];


    }





    /*
    --------------------------------------------------
    RENDER PROJECTS
    --------------------------------------------------
    */


    function renderProjects(projects){



        if(projectCountElement){


            projectCountElement.textContent =
                toPersianNumber(
                    projects.length
                );


        }





        if(!projectsListElement){

            return;

        }





        if(projects.length === 0){



            projectsListElement.innerHTML = `


                <div class="empty-state">


                    هنوز پروژه‌ای ثبت نشده است.


                </div>


            `;


            return;


        }






        projectsListElement.innerHTML =


            projects
                .map(
                    createProjectCard
                )
                .join("");




        bindProjectEvents();



    }







    function createProjectCard(project){



        return `


        <article
            class="project-card"
            data-project-id="${project.id}"
        >



            <h3>

                ${escapeHtml(
                    project.title ||
                    "پروژه بدون عنوان"
                )}

            </h3>





            <p>

                ${escapeHtml(
                    project.description ||
                    "بدون توضیحات"
                )}

            </p>





            <p>

                وضعیت:

                ${escapeHtml(
                    project.status ||
                    "نامشخص"
                )}

            </p>





            <button

                type="button"

                class="open-project-btn"

                data-project-id="${project.id}"

            >

                مشاهده پروژه

            </button>



        </article>


        `;


    }







    function bindProjectEvents(){



        const buttons =
            document.querySelectorAll(
                ".open-project-btn"
            );





        buttons.forEach(
            button => {



                button.addEventListener(
                    "click",
                    function(){


                        openProjectModal(
                            this.dataset.projectId
                        );


                    }
                );



            }
        );



    }







    /*
    --------------------------------------------------
    PROJECT DETAIL MODAL
    --------------------------------------------------
    */





    async function openProjectModal(projectId){



        if(!projectModal){

            return;

        }




        projectModal.classList.remove(
            "hidden"
        );




        if(modalProjectContent){


            modalProjectContent.innerHTML =

                "در حال دریافت اطلاعات پروژه...";


        }







        try {



            const response =

                await fetch(

                    `${PROJECTS_URL}${projectId}/`,

                    {


                        credentials:
                            "same-origin",


                        headers:{

                            "Accept":
                                "application/json"
 

                        }


                    }

                );






            if(!response.ok){


                throw new Error(
                    "Project detail failed"
                );


            }






            const project =

                await response.json();





            currentProject =
                project;





            renderProjectModal(
                project
            );



        }
        catch(error){



            console.error(
                error
            );




            if(modalProjectContent){


                modalProjectContent.innerHTML =

                    "خطا در دریافت اطلاعات پروژه";


            }


        }



    }








    function renderProjectModal(project){



        if(modalProjectTitle){


            modalProjectTitle.textContent =

                project.title ||

                "پروژه بدون عنوان";


        }






        if(modalProjectStatus){


            modalProjectStatus.textContent =

                project.status ||

                "-";


        }






        renderProjectSummary();



    }








    function renderProjectSummary(){



        if(!currentProject ||
           !modalProjectContent){


            return;


        }






        modalProjectContent.innerHTML = `


            <div class="project-summary">



                <h3>

                    خلاصه پروژه

                </h3>





                <p>

                    ${escapeHtml(

                        currentProject.description ||

                        "بدون توضیحات"

                    )}

                </p>






                <div class="project-summary-grid">



                    <div>

                        <strong>
                            وضعیت
                        </strong>


                        <span>

                            ${escapeHtml(

                                currentProject.status ||

                                "-"

                            )}

                        </span>


                    </div>






                    <div>


                        <strong>
                            بودجه
                        </strong>



                        <span>


                            ${
                                currentProject.estimated_budget

                                ?

                                escapeHtml(
                                    String(
                                        currentProject.estimated_budget
                                    )
                                )

                                :

                                "ثبت نشده"

                            }


                        </span>


                    </div>





                    <div>


                        <strong>
                            زمان تحویل
                        </strong>



                        <span>


                            ${
                                currentProject.required_delivery_days

                                ?

                                toPersianNumber(
                                    currentProject.required_delivery_days
                                )
                                +
                                " روز"


                                :

                                "ثبت نشده"


                            }


                        </span>


                    </div>





                    <div>


                        <strong>
                            فایل‌ها
                        </strong>



                        <span>


                            ${toPersianNumber(

                                (
                                    currentProject.attachments ||

                                    []

                                ).length

                            )}


                        </span>



                    </div>



                </div>




            </div>


        `;


    }







    /*
    --------------------------------------------------
    PROJECT TABS
    --------------------------------------------------
    */


    const projectTabs =

        document.querySelectorAll(
            ".project-tab"
        );





    projectTabs.forEach(
        tab => {


            tab.addEventListener(
                "click",
                function(){



                    projectTabs.forEach(
                        item =>

                            item.classList.remove(
                                "active"
                            )

                    );




                    this.classList.add(
                        "active"
                    );




                    renderProjectTab(
                        this.dataset.tab
                    );



                }

            );



        }

    );








    function renderProjectTab(tab){



        if(!currentProject ||
           !modalProjectContent){


            return;


        }






        switch(tab){



            case "summary":


                renderProjectSummary();

                break;





            case "files":

                renderProjectFiles();


                break;
                modalProjectContent.innerHTML = `


                    <div class="project-tab-placeholder">


                        <h3>
                            فایل‌ها
                        </h3>


                        <p>

                            مدیریت فایل‌ها در مرحله بعد فعال می‌شود.

                        </p>


                    </div>


                `;


                break;





            case "messages":


                renderPlaceholder(
                    "گفتگو",
                    "گفتگوی پروژه در مرحله بعد متصل می‌شود."
                );


                break;






            case "timeline":


                renderPlaceholder(
                    "Timeline",
                    "نمایش مراحل پروژه در مرحله بعد."
                );


                break;





            case "tender":


                renderPlaceholder(
                    "مناقصه",
                    "اتصال به Tender بعد از تکمیل جریان پروژه."
                );


                break;






            case "contract":


                renderPlaceholder(
                    "قرارداد",
                    "قرارداد پس از انتخاب کارگاه نمایش داده می‌شود."
                );


                break;






            case "payments":


                renderPlaceholder(
                    "پرداخت‌ها",
                    "مراحل پرداخت بعداً اضافه می‌شود."
                );


                break;



            default:


                renderProjectSummary();


        }



    }







    function renderPlaceholder(title,text){



        modalProjectContent.innerHTML = `


            <div class="project-tab-placeholder">


                <h3>
                    ${title}
                </h3>



                <p>
                    ${text}
                </p>



            </div>


        `;


    }




    /*
    --------------------------------------------------
    CREATE PROJECT
    --------------------------------------------------
    */


    if(createProjectButton){


        createProjectButton.addEventListener(
            "click",
            function(){


                openCreateProjectModal();


            }
        );


    }






    function openCreateProjectModal(){



        if(!createProjectModal){

            console.warn(
                "createProjectModal not found"
            );

            return;

        }



        createProjectModal.classList.remove(
            "hidden"
        );



    }






    if(closeCreateProjectModalButton){



        closeCreateProjectModalButton.addEventListener(
            "click",
            closeCreateProjectModal
        );



    }







    function closeCreateProjectModal(){



        if(createProjectModal){


            createProjectModal.classList.add(
                "hidden"
            );


        }


    }







    if(createProjectForm){



        createProjectForm.addEventListener(
            "submit",
            createProject
        );


    }





function getCookie(name){

    let cookieValue = null;

    if(document.cookie){

        const cookies =
            document.cookie.split(";");


        for(
            let i = 0;
            i < cookies.length;
            i++
        ){

            const cookie =
                cookies[i].trim();


            if(
                cookie.substring(
                    0,
                    name.length + 1
                )
                ===
                (name + "=")
            ){

                cookieValue =
                    decodeURIComponent(
                        cookie.substring(
                            name.length + 1
                        )
                    );

                break;
            }

        }

    }

    return cookieValue;

}

    async function createProject(event){



        event.preventDefault();





        const formData =
            new FormData(
                createProjectForm
            );


        const filesInput =
            document.getElementById(
                "projectFilesInput"
            );


        if(filesInput){

            Array.from(
                filesInput.files
            ).forEach(
                file => {

                    formData.append(
                        "attachments",
                        file
                    );

                }
            );

        }



        try {


            const response =

                await fetch(

                    CREATE_PROJECT_URL,

                    {

                        method:
                            "POST",

                        credentials:
                            "same-origin",

                        headers:{

                            "Accept":
                                "application/json",
                            "X-CSRFToken":
                                getCookie("csrftoken")

                        },

                        body:
                            formData

                    }

                );



            if(!response.ok){


                const error =
                    await response.text();


                console.error(
                    "CREATE PROJECT ERROR:",
                    response.status,
                    error
                );


                throw new Error(
                    "Create project failed"
                );


            }


            const project =
                await response.json();


            currentProject =
                project;

           const filesInput =
    document.getElementById(
        "projectFilesInput"
    );

if(
    filesInput &&
    filesInput.files.length > 0
){
    await uploadProjectFiles(
        project.id
    );
}
            closeCreateProjectModal();


            createProjectForm.reset();


            await loadProjects();


            openProjectModal(
                project.id
            );


        }
        catch(error){

            console.error(
                "Create project error:",
                error
            );


            alert(
                "خطا در ایجاد پروژه"
            );

        }


    }

    /*
    --------------------------------------------------
    CLOSE PROJECT MODAL
    --------------------------------------------------
    */





    if(closeProjectModalButton){



        closeProjectModalButton.addEventListener(
            "click",
            closeProjectModal
        );



    }







    function closeProjectModal(){



        if(projectModal){



            projectModal.classList.add(
                "hidden"
            );



        }


    }








    /*
    --------------------------------------------------
    LOGOUT
    --------------------------------------------------
    */



    if(logoutButton){



        logoutButton.addEventListener(
            "click",
            function(){


                window.location.href =

                    "/accounts/logout/";



            }
        );



    }








    /*
    --------------------------------------------------
    HELPERS
    --------------------------------------------------
    */





    function redirectToLogin(){



        window.location.href =

            "/accounts/login/?next=/customer/";



    }







    function showError(message){



        if(projectsListElement){



            projectsListElement.innerHTML = `


                <div class="empty-state">


                    ${escapeHtml(message)}


                </div>


            `;


        }


    }








    function escapeHtml(value){



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







    function toPersianNumber(number){



        return String(number)

            .replace(
                /\d/g,
                function(d){

                    return "۰۱۲۳۴۵۶۷۸۹"[d];

                }
            );


    }
function renderProjectFiles(){

    if(!currentProject){

        modalProjectContent.innerHTML = `
            <div class="empty-state">
                اطلاعات پروژه موجود نیست
            </div>
        `;

        return;

    }


    const attachments =
        currentProject.attachments || [];

    if(!attachments.length){


        modalProjectContent.innerHTML = `

            <div class="empty-state">

                <h3>
                    فایل‌های پروژه
                </h3>

                <p>
                    هنوز فایلی برای این پروژه ثبت نشده است.
                </p>

            </div>

        `;

        return;

    }





    modalProjectContent.innerHTML = `

        <div class="project-files">

            <h3>
                فایل‌های پروژه
            </h3>


            <div class="project-files-list">


                ${
                    attachments.map(file => {


                        return `

                        <article class="project-file-card">


                            <h4>
                                ${
                                    file.title ||
                                    "فایل پروژه"
                                }
                            </h4>


                            <p>
                                نوع:
                                ${
                                    file.file_type
                                }
                            </p>


                            <a
                                href="${file.file}"
                                target="_blank"
                            >
                                مشاهده فایل
                            </a>


                        </article>

                        `;


                    }).join("")
                }


            </div>


        </div>

    `;


}

console.log("CUSTOMER JS LOADED");

async function uploadProjectFiles(projectId){

    const filesInput =
        document.getElementById(
            "projectFilesInput"
        );


    if(
        !filesInput ||
        !filesInput.files.length
    ){

        return;

    }



    for(
        const file of filesInput.files
    ){


        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );



        const response =
            await fetch(
                `/projects/${projectId}/attachments/`,
                {
                    method:"POST",

                    credentials:
                        "same-origin",

                    body:
                        formData,

                    headers:{
                        "Accept":
                            "application/json",
                        "X-CSRFToken":

                            getCookie("csrftoken")
                    }
                }
            );



        if(!response.ok){

            console.error(
                "Attachment upload failed",
                await response.text()
            );

            throw new Error(
                "Attachment upload failed"
            );

        }

    }

}
})();