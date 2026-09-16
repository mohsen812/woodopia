(function () {

    "use strict";


    function loadDashboard() {


        fetch(
            "/api/projects/consultant/dashboard/"
        )

        .then(
            response => response.json()
        )

        .then(
            data => {


                const queue =
                    document.getElementById(
                        "queue-count"
                    );


                const projects =
                    document.getElementById(
                        "my-projects-count"
                    );


                const tenders =
                    document.getElementById(
                        "tenders-count"
                    );



                if (queue) {

                    queue.innerText =
                        data.queue_count;

                }


                if (projects) {

                    projects.innerText =
                        data.my_projects_count;

                }


                if (tenders) {

                    tenders.innerText =
                        data.active_tenders_count;

                }


            }
        )

        .catch(
            error => {

                console.error(
                    "Dashboard error:",
                    error
                );

            }
        );


    }





    function loadConsultantQueue() {


        const container =
            document.getElementById(
                "consultant-queue-list"
            );


        if (!container) {

            return;

        }



        fetch(
            "/api/projects/consultant/queue/"
        )


        .then(
            response =>
                response.json()
        )


        .then(
            projects => {


                if (!projects.length) {


                    container.innerHTML = `

                        <div class="empty-state">

                            <div class="empty-icon">
                                📂
                            </div>

                            <h3>
                                پروژه‌ای در صف نیست
                            </h3>

                        </div>

                    `;


                    return;

                }



                container.innerHTML = "";



                projects.forEach(
                    project => {


                        const card =
                            document.createElement(
                                "div"
                            );


                        card.className =
                            "project-card";



                        card.innerHTML = `


                            <h3>
                                ${project.title}
                            </h3>


                            <p>
                                وضعیت:
                                ${project.status}
                            </p>


                            <button
                                data-project-id="${project.id}"
                                class="claim-button"
                            >
                                دریافت پروژه
                            </button>


                        `;



                        container.appendChild(
                            card
                        );


                    }
                );


                bindClaimButtons();


            }
        )


        .catch(
            error => {

                console.error(
                    "Queue error:",
                    error
                );

            }
        );


    }





    function bindClaimButtons() {


        const buttons =
            document.querySelectorAll(
                ".claim-button"
            );



        buttons.forEach(
            button => {


                button.addEventListener(
                    "click",
                    function () {


                        const projectId =
                            this.dataset.projectId;



                        claimProject(
                            projectId
                        );


                    }
                );


            }
        );


    }





    function claimProject(
        projectId
    ) {


        fetch(
            `/api/projects/${projectId}/consultant/claim/`,
            {
                method: "POST",
                headers: {
                    "X-CSRFToken":
                        getCookie("csrftoken")
                }
            }
        )


        .then(
            response =>
                response.json()
        )


        .then(
            data => {


                console.log(
                    data
                );


                loadDashboard();

                loadConsultantQueue();

                loadConsultantMyProjects();


            }
        )


        .catch(
            error => {

                console.error(
                    "Claim error:",
                    error
                );

            }
        );


    }


function loadConsultantMyProjects() {

    const container =
        document.getElementById(
            "consultant-my-projects-list"
        );

    if (!container) {
        return;
    }


    fetch(
        "/api/projects/consultant/my-projects/"
    )

        .then(
            response => response.json()
        )

        .then(
            projects => {

                if (!projects.length) {

                    container.innerHTML = `

                        <div class="empty-state">

                            <div class="empty-icon">
                                🧩
                            </div>

                            <h3>
                                هنوز پروژه‌ای برای شما ثبت نشده است
                            </h3>

                        </div>

                    `;

                    return;
                }


                container.innerHTML = "";


                projects.forEach(
                    project => {

                        const card =
                            document.createElement(
                                "div"
                            );


                        card.className =
                            "project-card";


                        card.innerHTML = `

                            <h3>
                                ${project.title}
                            </h3>


                            <p>
                                وضعیت:
                                ${project.status}
                            </p>


                            <p>
                                شناسه پروژه:
                                #${project.id}
                            </p>


                            <button
                                class="open-project-button"
                                data-project-id="${project.id}"
                            >
                                باز کردن پروژه
                            </button>

                        `;


                        container.appendChild(
                            card
                        );

                    }
                );


                bindOpenProjectButtons();

            }
        )

        .catch(
            error => {

                console.error(
                    "My projects error:",
                    error
                );


                container.innerHTML = `

                    <div class="empty-state">

                        <div class="empty-icon">
                            ⚠️
                        </div>

                        <h3>
                            دریافت پروژه‌ها با خطا مواجه شد
                        </h3>

                    </div>

                `;

            }
        );

}

function bindOpenProjectButtons() {

    const buttons =
        document.querySelectorAll(
            ".open-project-button"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const projectId =
                        this.dataset.projectId;


                    openConsultantProjectModal(
                        projectId
                    );

                }
            );

        }
    );

}

let consultantCurrentProject = null;


async function openConsultantProjectModal(projectId) {


    const modal =
        document.getElementById(
            "consultant-project-modal"
        );


    const content =
        document.getElementById(
            "consultant-project-content"
        );


    if(!modal || !content){
        return;
    }


    modal.classList.remove(
        "hidden"
    );


    content.innerHTML =
        "در حال دریافت اطلاعات پروژه...";


    try {


        const response =
            await fetch(
                `/projects/${projectId}/`,
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
                "Project loading failed"
            );

        }


        const project =
            await response.json();


        consultantCurrentProject =
            project;


        renderConsultantProject(
            project
        );


    }
    catch(error){

        console.error(
            error
        );


        content.innerHTML =
            `
            <div class="empty-state">
                خطا در دریافت اطلاعات پروژه
            </div>
            `;

    }

}



function renderConsultantProject(project){


    const title =
        document.getElementById(
            "consultant-project-title"
        );


    const status =
        document.getElementById(
            "consultant-project-status"
        );


    if(title){

        title.innerText =
            project.title;

    }


    if(status){

        status.innerText =
            project.status;

    }


    renderConsultantProjectTab(
        "summary"
    );

}



function renderConsultantProjectTab(tab){


    const content =
        document.getElementById(
            "consultant-project-content"
        );


    if(!content || !consultantCurrentProject){
        return;
    }


    const project =
        consultantCurrentProject;



    switch(tab){


        case "summary":


            content.innerHTML =
            `

            <div class="project-summary">

                <h3>
                    ${project.title}
                </h3>


                <p>
                    ${project.description || ""}
                </p>


                <p>
                    وضعیت:
                    ${project.status}
                </p>


                <p>
                    زمان تحویل:
                    ${project.required_delivery_days || "-"}
                    روز
                </p>


            </div>

            `;

            break;


case "files":

    const files =
        project.attachments || [];


    content.innerHTML =
    `

    <div class="project-section">

        <h3>
            📁 فایل‌های پروژه
        </h3>


        ${
            files.length
            ?
            files.map(
                file =>
                `

                <div class="file-card">

                    <div class="file-icon">
                        📄
                    </div>


                    <div class="file-info">

                        <strong>
                            ${file.title || "فایل پروژه"}
                        </strong>

                        <span>
                            ${file.file_type || ""}
                        </span>

                    </div>


                    <a 
                    href="${file.file}"
                    target="_blank"
                    class="file-open">

                        مشاهده

                    </a>


                </div>

                `
            ).join("")
            :
            `
            <div class="empty-state">
                هنوز فایلی ثبت نشده است.
            </div>
            `
        }


    </div>

    `;


break;


        default:


            content.innerHTML =
            `

            <div class="empty-state">

                <h3>
                    ${tab}
                </h3>

                <p>
                    این بخش در MVP بعدی تکمیل می‌شود.
                </p>

            </div>

            `;

    }


}



function bindConsultantProjectModal(){


    const closeButton =
        document.getElementById(
            "close-consultant-project-modal"
        );


    const backdrop =
        document.getElementById(
            "consultant-project-backdrop"
        );


    const close =
        function(){

            const modal =
                document.getElementById(
                    "consultant-project-modal"
                );


            if(modal){

                modal.classList.add(
                    "hidden"
                );

            }

        };



    if(closeButton){

        closeButton.onclick =
            close;

    }


    if(backdrop){

        backdrop.onclick =
            close;

    }



    document
        .querySelectorAll(
            ".consultant-project-tab"
        )
        .forEach(
            tab => {

                tab.addEventListener(
                    "click",
                    function(){

                        renderConsultantProjectTab(
                            this.dataset.projectTab
                        );

                    }
                );

            }
        );


}
    function getCookie(name) {


        let cookieValue = null;


        if (
            document.cookie &&
            document.cookie !== ""
        ) {


            const cookies =
                document.cookie.split(";");



            for (
                let cookie of cookies
            ) {


                cookie =
                    cookie.trim();



                if (
                    cookie.startsWith(
                        name + "="
                    )
                ) {


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





    document.addEventListener(
        "DOMContentLoaded",
        function () {

            loadDashboard();


            loadConsultantQueue();


            loadConsultantMyProjects();


            bindConsultantProjectModal();

        }
    );

})();