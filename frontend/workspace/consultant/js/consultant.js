(function () {

"use strict";
function getCSRFToken(){

    const cookie =
        document.cookie
        .split("; ")
        .find(
            row =>
            row.startsWith("csrftoken=")
        );


    return cookie
        ? cookie.split("=")[1]
        : "";

}

/* ==================================================
   DASHBOARD
================================================== */

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


/* ==================================================
   CONSULTANT QUEUE
================================================== */

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
        response => response.json()
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
                            ${escapeHTML(
                                project.title
                            )}
                        </h3>

                        <p>
                            وضعیت:
                            ${escapeHTML(
                                project.status
                            )}
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

            container.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        ⚠️
                    </div>

                    <h3>
                        دریافت صف پروژه‌ها با خطا مواجه شد
                    </h3>

                </div>

            `;

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

            credentials:
                "same-origin",

            headers: {

                "X-CSRFToken":
                    getCookie(
                        "csrftoken"
                    )

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


/* ==================================================
   CONSULTANT MY PROJECTS
================================================== */

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
                            ${escapeHTML(
                                project.title
                            )}
                        </h3>

                        <p>
                            وضعیت:
                            ${escapeHTML(
                                project.status
                            )}
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


/* ==================================================
   CURRENT PROJECT
================================================== */

let consultantCurrentProject = null;


/* ==================================================
   OPEN PROJECT MODAL
================================================== */

async function openConsultantProjectModal(
    projectId
) {

    const modal =
        document.getElementById(
            "consultant-project-modal"
        );


    const content =
        document.getElementById(
            "consultant-project-content"
        );


    if (!modal || !content) {

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

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Project loading failed"
            );

        }


        const project =
            await response.json();
        
        console.log(
            "FEEMAAS PROJECT DATA:",
            project
        );

        console.log(
            "FEEMAAS SPECIFICATION FILES:",
            project.specification_attachments
        );

        consultantCurrentProject =
            project;


        renderConsultantProject(
            project
        );

    }

    catch (error) {

        console.error(
            "Project loading error:",
            error
        );


        content.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    خطا در دریافت اطلاعات پروژه
                </h3>

            </div>

        `;

    }

}


/* ==================================================
   PROJECT JOURNEY
================================================== */

function renderProjectJourney(
    status
) {

    const stages = [

        {
            key: "draft",
            title: "ثبت پروژه"
        },

        {
            key: "consulting",
            title: "بررسی مشاور"
        },

        {
            key: "tender",
            title: "مناقصه"
        },

        {
            key: "production",
            title: "تولید"
        },

        {
            key: "completed",
            title: "گزارش نهایی"
        }

    ];


    const currentIndex =
        stages.findIndex(
            stage =>
                stage.key === status
        );


    const activeIndex =
        currentIndex >= 0
            ? currentIndex
            : 0;


    return `

        <div class="project-journey">

            <div class="project-journey-title">
                مسیر پروژه
            </div>


            <div class="project-journey-track">

                ${stages.map(
                    (
                        stage,
                        index
                    ) => {

                        let state =
                            "pending";


                        if (
                            index <
                            activeIndex
                        ) {

                            state =
                                "completed";

                        }

                        else if (
                            index ===
                            activeIndex
                        ) {

                            state =
                                "current";

                        }


                        return `

                            <div
                                class="
                                    project-journey-stage
                                    ${state}
                                "
                            >

                                <div
                                    class="project-journey-node"
                                ></div>


                                <div
                                    class="project-journey-label"
                                >
                                    ${stage.title}
                                </div>

                            </div>


                            ${
                                index <
                                stages.length - 1
                                ?
                                `
                                    <div
                                        class="
                                            project-journey-line
                                            ${
                                                index <
                                                activeIndex
                                                    ? "completed"
                                                    : ""
                                            }
                                        "
                                    ></div>
                                `
                                :
                                ""
                            }

                        `;

                    }
                ).join("")}

            </div>

        </div>

    `;

}


/* ==================================================
   RENDER PROJECT
================================================== */

function renderConsultantProject(
    project
) {

    const title =
        document.getElementById(
            "consultant-project-title"
        );


    const status =
        document.getElementById(
            "consultant-project-status"
        );


    if (title) {

        title.innerText =
            project.title;

    }


    if (status) {

        status.innerText =
            project.status;

    }


    const journey =
        document.getElementById(
            "consultant-project-journey"
        );


    if (journey) {

        journey.innerHTML =
            renderProjectJourney(
                project.status
            );

    }


    renderConsultantProjectTab(
        "summary"
    );

}


/* ==================================================
   PROJECT TABS
================================================== */

function renderConsultantProjectTab(
    tab
) {

    const content =
        document.getElementById(
            "consultant-project-content"
        );


    if (
        !content ||
        !consultantCurrentProject
    ) {

        return;

    }


    const project =
        consultantCurrentProject;


    switch (tab) {


        /* ------------------------------------------
           SUMMARY
        ------------------------------------------ */

        case "summary":

            content.innerHTML = `

                <div class="project-summary">

                    <h3>
                        ${escapeHTML(
                            project.title
                        )}
                    </h3>


                    <p>
                        ${escapeHTML(
                            project.description || ""
                        )}
                    </p>


                    <p>
                        وضعیت:
                        ${escapeHTML(
                            project.status
                        )}
                    </p>


                    <p>
                        زمان تحویل:
                        ${
                            project.required_delivery_days ||
                            "-"
                        }
                        روز
                    </p>

                </div>

            `;

            break;


        /* ------------------------------------------
           FILES
        ------------------------------------------ */

        case "files": {

            const files = [
                ...(project.attachments || []),
                ...(project.specification_attachments || [])
            ];


            content.innerHTML = `

                <div class="project-section">

                    <h3>
                        📁 فایل‌های پروژه
                    </h3>


                    ${
                        files.length
                        ?

                        files.map(
                            file => `

                                <div
                                    class="file-card"
                                >

                                    <div
                                        class="file-icon"
                                    >
                                        📄
                                    </div>


                                    <div
                                        class="file-info"
                                    >

                                        <strong>
                                            ${escapeHTML(
                                                file.title ||
                                                "فایل پروژه"
                                            )}
                                        </strong>


                                        <span>
                                            ${escapeHTML(
                                                file.file_type ||
                                                (
                                                    file.file
                                                    ?
                                                    file.file.split(".").pop().toUpperCase()
                                                    :
                                                    ""
                                                )
                                            )}
                                        </span>

                                    </div>


                                    <a
                                        href="${escapeAttribute(
                                            file.file
                                        )}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="file-open"
                                    >
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

        }


        /* ------------------------------------------
           STANDARDIZATION
        ------------------------------------------ */

        case "standardization":

            loadConsultantStandardization(
                project.id
            );

            break;


        /* ------------------------------------------
           OTHER MVP TABS
        ------------------------------------------ */

        case "messages":

        case "timeline":

        case "tender":

        case "report":

        default:

            content.innerHTML = `

                <div class="empty-state">

                    <h3>
                        ${escapeHTML(
                            getTabTitle(tab)
                        )}
                    </h3>


                    <p>
                        این بخش در MVP بعدی تکمیل می‌شود.
                    </p>

                </div>

            `;

            break;

    }

}


/* ==================================================
   STANDARDIZATION LOAD
================================================== */

async function loadConsultantStandardization(
    projectId
) {

    const content =
        document.getElementById(
            "consultant-project-content"
        );


    if (!content) {

        return;

    }


    content.innerHTML = `

        <div class="project-section">

            <h3>
                استانداردسازی پروژه
            </h3>


            <div class="empty-state">
                در حال دریافت اطلاعات استانداردسازی...
            </div>

        </div>

    `;


    try {

        const response =
            await fetch(
                `/api/projects/${projectId}/standardization/`,
                {
                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Standardization loading failed"
            );

        }


        const data =
            await response.json();


        renderConsultantStandardization(
            data
        );

    }

    catch (error) {

        console.error(
            "Standardization loading error:",
            error
        );


        content.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    خطا در دریافت استانداردسازی
                </h3>


                <p>
                    اطلاعات استانداردسازی پروژه دریافت نشد.
                </p>

            </div>

        `;

    }

}


/* ==================================================
   STANDARDIZATION RENDER
================================================== */

function renderConsultantStandardization(
    data
) {

    const content =
        document.getElementById(
            "consultant-project-content"
        );


    if (!content) {

        return;

    }


    const items =
        data.items || [];


    const minimumRows = 5;

    const totalRows =
        Math.max(
            minimumRows,
            items.length
        );


    const rows = [];


    for (
        let index = 0;
        index < totalRows;
        index++
    ) {

        rows.push(
            items[index] || {}
        );

    }
console.log(
    "STANDARDIZATION RENDER UPDATED"
);

    content.innerHTML = `

        <div class="project-section standardization-section">

            <div class="standardization-header">

                <div>

                    <h3>
                        استانداردسازی پروژه
                    </h3>

                    <p>
                        مشاور آیتم‌های پروژه و مشخصات فنی
                        مورد نیاز برای مناقصه را تعیین می‌کند.
                    </p>

                </div>


                <button
                    type="button"
                    class="standardization-add-button"
                    id="add-standardization-item"
                >
                    <span class="standardization-add-icon">＋</span>
                    افزودن ردیف
                </button>

            </div>


            <div class="standardization-table-wrapper">

                <div class="standardization-table">

                    <div class="standardization-table-head">

                        <div class="standardization-col-number">
                            #
                        </div>

                        <div class="standardization-col-name">
                            نام آیتم
                        </div>

                        <div class="standardization-col-quantity">
                            تعداد
                        </div>

                        <div class="standardization-col-dimensions">
                            ابعاد
                        </div>

                        <div class="standardization-col-material">
                            متریال
                        </div>

                        <div class="standardization-col-technical">
                            مشخصات فنی
                        </div>
                        <div class="standardization-col-files">
                            فایل
                        </div>
                        <div class="standardization-col-status">
                            وضعیت مشتری
                        </div>

                        <div class="standardization-col-required">
                            الزامی
                        </div>

                        <div class="standardization-col-actions">
                            حذف
                        </div>

                    </div>


                    <div id="standardization-items">

                        ${
                            rows.map(
                                (item, index) =>
                                    renderStandardizationItem(
                                        item,
                                        index + 1
                                    )
                            ).join("")
                        }

                    </div>

                </div>

            </div>


            <div class="standardization-add-row">

                <button
                    type="button"
                    class="standardization-add-button secondary"
                    id="add-standardization-item-bottom"
                >
                    <span class="standardization-add-icon">＋</span>
                    افزودن ردیف جدید
                </button>

            </div>


            <div class="standardization-actions">

                <button
                    type="button"
                    class="standardization-save-button"
                    id="save-standardization"
                >
                    ذخیره استانداردسازی

                </button>


                <button
                   type="button"
                   class="standardization-send-button"
                   id="send-standardization-to-customer"
                >
                   ارسال برای تایید مشتری
                </button>

             </div>

        </div>

    `;


    bindStandardizationEvents();


document
    .querySelectorAll(".standardization-item")
    .forEach(async function(itemElement) {

        const files =
            await loadStandardizationItemFiles(
                itemElement
            );

        renderStandardizationFileButton(
            itemElement,
            files
        );

    });

}


/* ==================================================
   STANDARDIZATION ITEM
================================================== */

function renderStandardizationItem(
    item = {},
    rowNumber = 1
) {

    const hasSavedItem =
        Boolean(
            item.project_item_id
        );


    return `

        <div
            class="standardization-item ${
                hasSavedItem
                    ? "standardization-item-saved"
                    : "standardization-item-new"
            }"
            data-item-id="${
                item.project_item_id || ""
            }"
            data-specification-id="${
                item.specification_id || ""
            }"
        >

            <div class="standardization-row">

                <div
                    class="standardization-col-number standardization-row-number"
                >
                    ${String(rowNumber).padStart(2, "0")}
                </div>


                <div class="standardization-col-name">

                    <input
                        type="text"
                        data-field="name"
                        value="${escapeAttribute(
                            item.name || ""
                        )}"
                        placeholder="نام آیتم"
                    >

                </div>


                <div class="standardization-col-quantity">

                    <input
                        type="number"
                        min="1"
                        data-field="quantity"
                        value="${
                            item.quantity || 1
                        }"
                    >

                </div>


                <div class="standardization-col-dimensions">

                    <input
                        type="text"
                        data-field="dimensions"
                        value="${escapeAttribute(
                            item.dimensions || ""
                        )}"
                        placeholder="180×80×75"
                    >

                </div>


                <div class="standardization-col-material">

                    <input
                        type="text"
                        data-field="material"
                        value="${escapeAttribute(
                            item.material || ""
                        )}"
                        placeholder="چوب راش"
                    >

                </div>


                <div class="standardization-col-technical">

                    <textarea
                        data-field="technical_details"
                        rows="2"
                        placeholder="مشخصات ساخت، اتصالات، پرداخت..."
                    >${escapeHTML(
                        item.technical_details || ""
                    )}</textarea>


                    <textarea
                        class="standardization-description"
                        data-field="description"
                        rows="1"
                        placeholder="توضیح تکمیلی (اختیاری)"
                    >${escapeHTML(
                        item.description || ""
                    )}</textarea>

                </div>
   
            
                <div class="standardization-col-files">

                     <button
                         type="button"
                         class="standardization-file-button"
                         title="افزودن فایل"
                     >
                         📎
                     </button>

                </div>


                <div class="standardization-col-status">

                ${
                    item.customer_review_status === "approved"
                    ?
                    "🟢 تایید مشتری"

                    :
                    item.customer_review_status === "revise"
                    ?
                    "🟠 نیاز به اصلاح"

                    :
                    "⚪ در انتظار"
                }

                </div> 
                <div class="standardization-col-required">

                    <label
                        class="standardization-check"
                        title="این آیتم برای مناقصه الزامی است"
                    >

                        <input
                            type="checkbox"
                            data-field="is_required"
                            ${
                                item.is_required !== false
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span></span>

                    </label>

                </div>


                <div class="standardization-col-actions">

                    <button
                        type="button"
                        class="standardization-remove-button"
                        title="حذف ردیف"
                        aria-label="حذف ردیف"
                    >
                        ×
                    </button>

                </div>

            </div>

        </div>

    `;

}

/* ==================================================
   STANDARDIZATION ITEM FILES
================================================== */

async function loadStandardizationItemFiles(
    itemElement
) {

    const specificationId =
        itemElement.dataset.specificationId;

    if (!specificationId) {

        return [];

    }

    try {

        const response =
            await fetch(
                `/api/tenders/specifications/${specificationId}/attachments/`,
                {
                    credentials: "same-origin",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        if (!response.ok) {

            console.error(
                "Failed to load specification attachments:",
                response.status
            );

            return [];

        }


        const files =
            await response.json();


        itemElement._standardizationFiles =
            Array.isArray(files)
                ? files
                : [];


        return itemElement._standardizationFiles;

    } catch (error) {

        console.error(
            "Error loading specification attachments:",
            error
        );

        return [];

    }

}
function renderStandardizationFileButton(
    itemElement,
    files = []
) {

    const fileColumn =
        itemElement.querySelector(
            ".standardization-col-files"
        );


    if (!fileColumn) {
        return;
    }


    if (!files.length) {

        fileColumn.innerHTML = `
            <button
                type="button"
                class="standardization-file-empty"
                title="افزودن فایل"
            >
                ＋
            </button>
        `;

        return;
    }


    const firstFile = files[0];


    const fileUrl =
        firstFile.file || "";


    const isImage =
        /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i
        .test(fileUrl);



    fileColumn.innerHTML = `

        <div
            class="standardization-file-tile"
            title="${files.map(
                file => file.title || file.file.split("/").pop()
            ).join(" , ")}"
        >


            <div class="standardization-file-badge">
                ${files.length}
            </div>


            <div class="standardization-file-preview">

                ${
                    isImage
                    ?
                    `
                    <img
                        src="${escapeAttribute(fileUrl)}"
                        class="standardization-file-thumbnail"
                    >
                    `
                    :
                    `
                    <span class="standardization-file-icon">
                        📎
                    </span>
                    `
                }

            </div>


        </div>

    `;

}
/* ==================================================
   STANDARDIZATION FILE MANAGER
================================================== */

let standardizationFileManagerSpecificationId = null;
let standardizationFileManagerItemElement = null;


function getStandardizationFileName(file) {

    if (file.title) {
        return file.title;
    }

    if (file.file) {

        return file.file
            .split("/")
            .pop()
            .split("?")[0];

    }

    return "فایل بدون نام";

}


function getStandardizationFileExtension(file) {

    const name =
        getStandardizationFileName(file);

    const parts =
        name.split(".");

    if (parts.length < 2) {
        return "";
    }

    return parts
        .pop()
        .toUpperCase();

}


function isStandardizationImage(file) {

    const url =
        file.file || "";

    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i
        .test(url);

}


function createStandardizationFileManager() {

    if (
        document.getElementById(
            "standardization-file-manager"
        )
    ) {
        return;
    }


    document.body.insertAdjacentHTML(
        "beforeend",
        `

        <div
            id="standardization-file-manager"
            class="standardization-file-manager hidden"
        >

            <div
                class="standardization-file-manager-backdrop"
                data-file-manager-close
            ></div>


            <div
                class="standardization-file-manager-box"
            >

                <div
                    class="standardization-file-manager-header"
                >

                    <div>

                        <div
                            class="standardization-file-manager-eyebrow"
                        >
                            PROJECT FILES
                        </div>

                        <h3>
                            فایل‌های آیتم
                        </h3>

                    </div>


                    <button
                        type="button"
                        class="standardization-file-manager-close"
                        data-file-manager-close
                        aria-label="بستن"
                    >
                        ×
                    </button>

                </div>


                <div
                    class="standardization-file-manager-toolbar"
                >

                    <div
                        class="standardization-file-manager-info"
                    >
                        فایل‌های فنی این آیتم
                    </div>


                    <button
                        type="button"
                        id="standardization-file-manager-upload"
                        class="standardization-file-manager-upload"
                    >
                        <span>＋</span>
                        افزودن فایل
                    </button>


                    <input
                        type="file"
                        id="standardization-file-manager-input"
                        multiple
                        hidden
                    >

                </div>


                <div
                    id="standardization-file-manager-list"
                    class="standardization-file-manager-list"
                >
                </div>

            </div>

        </div>

        `
    );

}


async function loadFileManagerFiles() {

    const list =
        document.getElementById(
            "standardization-file-manager-list"
        );


    if (!list) {
        return;
    }


    if (
        !standardizationFileManagerSpecificationId
    ) {

        list.innerHTML = `
            <div class="standardization-file-manager-empty">
                ابتدا استانداردسازی این آیتم را ذخیره کنید.
            </div>
        `;

        return;

    }


    list.innerHTML = `
        <div class="standardization-file-manager-loading">
            در حال بارگذاری فایل‌ها...
        </div>
    `;


    try {

        const response =
            await fetch(
                `/api/tenders/specifications/${standardizationFileManagerSpecificationId}/attachments/`,
                {
                    credentials: "same-origin",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const files =
            await response.json();


        if (
            standardizationFileManagerItemElement
        ) {

            standardizationFileManagerItemElement
                ._standardizationFiles =
                    Array.isArray(files)
                        ? files
                        : [];

            renderStandardizationFileButton(
                standardizationFileManagerItemElement,
                standardizationFileManagerItemElement
                    ._standardizationFiles
            );

        }


        renderStandardizationFileManagerList(
            Array.isArray(files)
                ? files
                : []
        );


    } catch (error) {

        console.error(
            "Failed to load file manager files:",
            error
        );


        list.innerHTML = `
            <div class="standardization-file-manager-error">
                بارگذاری فایل‌ها انجام نشد.
            </div>
        `;

    }

}


function renderStandardizationFileManagerList(
    files = []
) {

    const list =
        document.getElementById(
            "standardization-file-manager-list"
        );


    if (!list) {
        return;
    }


    if (!files.length) {

        list.innerHTML = `
            <div class="standardization-file-manager-empty">
                هنوز فایلی برای این آیتم ثبت نشده است.
            </div>
        `;

        return;

    }


    list.innerHTML =
        files.map(
            function(file) {

                const fileName =
                    getStandardizationFileName(
                        file
                    );


                const extension =
                    getStandardizationFileExtension(
                        file
                    );


                const image =
                    isStandardizationImage(
                        file
                    );


                return `

                    <div
                        class="standardization-file-manager-item"
                        data-file-id="${file.id}"
                    >

                        <div
                            class="standardization-file-manager-preview"
                        >

                            ${
                                image
                                    ? `
                                        <img
                                            src="${escapeAttribute(file.file)}"
                                            alt=""
                                        >
                                    `
                                    : `
                                        <span>
                                            ${extension || "FILE"}
                                        </span>
                                    `
                            }

                        </div>


                        <div
                            class="standardization-file-manager-meta"
                        >

                            <div
                                class="standardization-file-manager-name"
                            >
                                ${escapeHTML(fileName)}
                            </div>


                            <div
                                class="standardization-file-manager-sub"
                            >
                                ${
                                    file.uploaded_by_name
                                        ? escapeHTML(
                                            file.uploaded_by_name
                                        )
                                        : ""
                                }
                            </div>

                        </div>


                        <a
                            class="standardization-file-manager-open"
                            href="${escapeAttribute(file.file)}"
                            target="_blank"
                            rel="noopener"
                        >
                            مشاهده
                        </a>


                        <button
                            type="button"
                            class="standardization-file-manager-delete"
                            data-file-delete="${file.id}"
                            title="حذف فایل"
                        >
                            ×
                        </button>

                    </div>

                `;

            }
        ).join("");

}


async function uploadStandardizationFiles(
    files
) {

    if (
        !standardizationFileManagerSpecificationId ||
        !files.length
    ) {
        return;
    }


    const csrfToken =
        document.cookie
            .split("; ")
            .find(
                row =>
                    row.startsWith(
                        "csrftoken="
                    )
            )
            ?.split("=")[1];


    for (
        const file of files
    ) {

        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        formData.append(
            "title",
            file.name
        );


        const response =
            await fetch(
                `/api/tenders/specifications/${standardizationFileManagerSpecificationId}/attachments/`,
                {
                    method: "POST",

                    credentials: "same-origin",

                    headers: {
                        "X-CSRFToken":
                            csrfToken || "",
                        "Accept":
                            "application/json"
                    },

                    body: formData
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "File upload failed:",
                errorText
            );

            throw new Error(
                `Upload failed: ${response.status}`
            );

        }

    }


    await loadFileManagerFiles();

}


async function deleteStandardizationFile(
    fileId
) {

    if (
        !standardizationFileManagerSpecificationId ||
        !fileId
    ) {
        return;
    }


    const confirmed =
        window.confirm(
            "این فایل حذف شود؟"
        );


    if (!confirmed) {
        return;
    }


    const csrfToken =
        document.cookie
            .split("; ")
            .find(
                row =>
                    row.startsWith(
                        "csrftoken="
                    )
            )
            ?.split("=")[1];


    const response =
        await fetch(
            `/api/tenders/specifications/${standardizationFileManagerSpecificationId}/attachments/${fileId}/`,
            {
                method: "DELETE",

                credentials: "same-origin",

                headers: {
                    "X-CSRFToken":
                        csrfToken || "",
                    "Accept":
                        "application/json"
                }
            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(
            "File delete failed:",
            errorText
        );

        alert(
            "حذف فایل انجام نشد."
        );

        return;

    }


    await loadFileManagerFiles();

}


function openStandardizationFileManager(
    itemElement
) {

    const specificationId =
        itemElement.dataset.specificationId;


    if (!specificationId) {

        alert(
            "ابتدا استانداردسازی را ذخیره کنید."
        );

        return;

    }


    createStandardizationFileManager();


    standardizationFileManagerSpecificationId =
        specificationId;


    standardizationFileManagerItemElement =
        itemElement;


    const manager =
        document.getElementById(
            "standardization-file-manager"
        );


    if (!manager) {
        return;
    }


    manager.classList.remove(
        "hidden"
    );


    loadFileManagerFiles();

}


function closeStandardizationFileManager() {

    const manager =
        document.getElementById(
            "standardization-file-manager"
        );


    if (!manager) {
        return;
    }


    manager.classList.add(
        "hidden"
    );


    standardizationFileManagerSpecificationId =
        null;


    standardizationFileManagerItemElement =
        null;

}
/* ==================================================
   STANDARDIZATION EVENTS
================================================== */

function bindStandardizationFileManagerEvents() {

    if (
        document.body.dataset.standardizationFileManagerEventsBound ===
        "true"
    ) {
        return;
    }

    document.body.dataset.standardizationFileManagerEventsBound =
        "true";


    document.addEventListener(
        "click",
        function (event) {

            /*
             * CLOSE FILE MANAGER
             */

            const closeButton =
                event.target.closest(
                    "[data-file-manager-close]"
                );


            if (closeButton) {

                event.preventDefault();

                closeStandardizationFileManager();

                return;
            }


            /*
             * OPEN FILE PICKER
             */

            const uploadButton =
                event.target.closest(
                    "#standardization-file-manager-upload"
                );


            if (uploadButton) {

                event.preventDefault();

                const fileInput =
                    document.getElementById(
                        "standardization-file-manager-input"
                    );


                if (fileInput) {

                    fileInput.click();

                }

                return;
            }


            /*
             * DELETE FILE
             */

            const deleteButton =
                event.target.closest(
                    "[data-file-delete]"
                );


            if (deleteButton) {

                event.preventDefault();

                const fileId =
                    deleteButton.dataset.fileDelete;


                if (fileId) {

                    deleteStandardizationFile(
                        fileId
                    );

                }

                return;
            }

        }
    );


    /*
     * FILE INPUT
     */

    document.addEventListener(
        "change",
        async function (event) {

            if (
                event.target.id !==
                "standardization-file-manager-input"
            ) {

                return;

            }


            const fileInput =
                event.target;


            if (
                !fileInput.files ||
                !fileInput.files.length
            ) {

                return;

            }


            const uploadButton =
                document.getElementById(
                    "standardization-file-manager-upload"
                );


            try {

                if (uploadButton) {

                    uploadButton.disabled =
                        true;

                    uploadButton.innerHTML = `
                        <span>...</span>
                        در حال آپلود...
                    `;

                }


                await uploadStandardizationFiles(
                    Array.from(
                        fileInput.files
                    )
                );

            }

            catch (error) {

                console.error(
                    "File upload error:",
                    error
                );


                alert(
                    "آپلود فایل انجام نشد."
                );

            }

            finally {

                if (uploadButton) {

                    uploadButton.disabled =
                        false;

                    uploadButton.innerHTML = `
                        <span>＋</span>
                        افزودن فایل
                    `;

                }


                fileInput.value = "";

            }

        }
    );

}


function bindStandardizationEvents() {

    const addButtons =
        document.querySelectorAll(
            "#add-standardization-item, #add-standardization-item-bottom"
        );


    const itemsContainer =
        document.getElementById(
            "standardization-items"
        );


    /*
     * ADD STANDARDIZATION ROW
     */

    if (
        addButtons.length &&
        itemsContainer
    ) {

        addButtons.forEach(
            function (addButton) {

                addButton.addEventListener(
                    "click",
                    function () {

                        itemsContainer.insertAdjacentHTML(
                            "beforeend",
                            renderStandardizationItem()
                        );


                        updateStandardizationRowNumbers();

                    }
                );

            }
        );

    }


    /*
     * STANDARDIZATION ROW EVENTS
     */

    if (itemsContainer) {

        itemsContainer.addEventListener(
            "click",
            function (event) {

                /*
                 * REMOVE ROW
                 */

                const removeButton =
                    event.target.closest(
                        ".standardization-remove-button"
                    );


                if (removeButton) {

                    event.preventDefault();


                    const item =
                        removeButton.closest(
                            ".standardization-item"
                        );


                    if (item) {

                        item.remove();

                        updateStandardizationRowNumbers();

                    }

                    return;

                }


                /*
                 * FILE MANAGER
                 */

                const fileTile =
                    event.target.closest(
                        ".standardization-file-tile"
                    );


                const fileEmpty =
                    event.target.closest(
                        ".standardization-file-empty"
                    );


                if (
                    !fileTile &&
                    !fileEmpty
                ) {

                    return;

                }


                const itemElement =
                    event.target.closest(
                        ".standardization-item"
                    );


                if (!itemElement) {

                    return;

                }


                openStandardizationFileManager(
                    itemElement
                );

            }
        );


        /*
         * LOAD FILES FOR SAVED ITEMS
         */

        const standardizationItems =
            itemsContainer.querySelectorAll(
                ".standardization-item"
            );


        standardizationItems.forEach(
            async function (itemElement) {

                const specificationId =
                    itemElement.dataset.specificationId;


                if (!specificationId) {

                    return;

                }


                const files =
                    await loadStandardizationItemFiles(
                        itemElement
                    );


                renderStandardizationFileButton(
                    itemElement,
                    files
                );

            }
        );

    }


    /*
     * SAVE STANDARDIZATION
     */

    const saveButton =
        document.getElementById(
            "save-standardization"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveConsultantStandardization
        );

    }
const sendButton =
    document.getElementById(
        "send-standardization-to-customer"
    );


if (sendButton) {

    sendButton.addEventListener(
        "click",
        async function(){

            if(!consultantCurrentProject){

                alert(
                    "پروژه انتخاب نشده است."
                );

                return;

            }


            try {

                const response =
                    await fetch(
                        `/api/projects/${consultantCurrentProject.id}/standardization/send/`,
                        {
                            method:"POST",
                            headers:{
                                "X-CSRFToken":
                                getCSRFToken()
                            }
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "STANDARDIZATION SENT:",
                    data
                );


                alert(
                    "استانداردسازی برای تایید مشتری ارسال شد."
                );


            }
            catch(error){

                console.error(
                    error
                );

                alert(
                    "ارسال استانداردسازی ناموفق بود."
                );

            }


        }
    );

}


    /*
     * FILE MANAGER EVENTS
     *
     * The File Manager is created dynamically,
     * so its buttons use delegated events.
     */

    bindStandardizationFileManagerEvents();

}
/* ==================================================
   STANDARDIZATION ROW NUMBERS
================================================== */

function updateStandardizationRowNumbers() {

    const container =
        document.getElementById(
            "standardization-items"
        );


    if (!container) {

        return;

    }


    const rows =
        container.querySelectorAll(
            ".standardization-item"
        );


    rows.forEach(
        function (row, index) {

            const number =
                row.querySelector(
                    ".standardization-row-number"
                );


            if (number) {

                number.textContent =
                    String(
                        index + 1
                    ).padStart(
                        2,
                        "0"
                    );

            }

        }
    );

}


/* ==================================================
   STANDARDIZATION SAVE
================================================== */

async function saveConsultantStandardization() {

    const container =
        document.getElementById(
            "standardization-items"
        );


    if (!container) {

        return;

    }


    const itemElements =
        container.querySelectorAll(
            ".standardization-item"
        );


    if (!itemElements.length) {

        alert(
            "حداقل یک آیتم اضافه کنید."
        );

        return;

    }


    const saveButton =
        document.getElementById(
            "save-standardization"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "در حال ذخیره...";

    }


    try {

        let savedCount = 0;


        for (
            const itemElement
            of itemElements
        ) {

            const getValue =
                function (field) {

                    const element =
                        itemElement.querySelector(
                            `[data-field="${field}"]`
                        );


                    return element
                        ? element.value
                        : "";

                };


            const getChecked =
                function (field) {

                    const element =
                        itemElement.querySelector(
                            `[data-field="${field}"]`
                        );


                    return element
                        ? element.checked
                        : false;

                };


            const name =
                getValue(
                    "name"
                ).trim();


            /*
             * Blank rows are placeholders.
             * They must not be sent to the API.
             */
            if (!name) {

                continue;

            }


            const quantityValue =
                parseInt(
                    getValue(
                        "quantity"
                    ) || "1",
                    10
                );


            const payload = {
                title:

                    name,

                name:

                    name,

                description:

                    getValue(
                        "description"
                    ),

                quantity:

                    Number.isFinite(
                        quantityValue
                    ) && quantityValue > 0

                        ? quantityValue

                        : 1,

                dimensions:

                    getValue(
                        "dimensions"
                    ),

                material:

                    getValue(
                        "material"
                    ),

                technical_details:

                    getValue(
                        "technical_details"
                    ),

                is_required:

                    getChecked(
                        "is_required"
                    )

            };


            const itemId =
                itemElement.dataset.itemId;


            if (itemId) {

                payload.project_item_id =
                    parseInt(
                        itemId,
                        10
                    );

            }


            const response =
                await fetch(
                    `/api/projects/${consultantCurrentProject.id}/standardization/`,
                    {

                        method:
                            "POST",

                        credentials:
                            "same-origin",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json",

                            "X-CSRFToken":
                                getCookie(
                                    "csrftoken"
                                )

                        },

                        body:
                            JSON.stringify(
                                payload
                            )

                    }
                );


            if (!response.ok) {

                const errorData =
                    await response.json()
                    .catch(
                        () => ({})
                    );


                throw new Error(
                    JSON.stringify(
                       errorData
                    )
                 );

             }


/*
 * The standardization API returns the
 * persisted ConsultantSpecification ID.
 *
 * We need this ID for item-level
 * file attachments.
 */
  const savedData =
    await response.json();


const specificationId =
    savedData.specification_id;


if (specificationId) {

    itemElement.dataset.specificationId =
        specificationId;

}


savedCount++;

        }


        if (!savedCount) {

            throw new Error(
                "حداقل یک آیتم با نام وارد کنید."
            );

        }


        alert(
            "استانداردسازی با موفقیت ذخیره شد."
        );


        await loadConsultantStandardization(
            consultantCurrentProject.id
        );

    }

    catch (error) {

        console.error(
            "STANDARDIZATION SAVE ERROR:",
            error
        );


        alert(
            error.message ||
            "ذخیره استانداردسازی انجام نشد."
        );

    }

    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "ذخیره استانداردسازی";

        }

    }

}


/* ==================================================
   MODAL EVENTS
================================================== */

function bindConsultantProjectModal() {

    const closeButton =
        document.getElementById(
            "close-consultant-project-modal"
        );


    const backdrop =
        document.getElementById(
            "consultant-project-backdrop"
        );


    const close =
        function () {

            const modal =
                document.getElementById(
                    "consultant-project-modal"
                );


            if (modal) {

                modal.classList.add(
                    "hidden"
                );

            }

        };


    if (closeButton) {

        closeButton.onclick =
            close;

    }


    if (backdrop) {

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
                    function () {

                        renderConsultantProjectTab(
                            this.dataset.projectTab
                        );

                    }
                );

            }
        );

}


/* ==================================================
   HELPERS
================================================== */

function getCookie(
    name
) {

    let cookieValue =
        null;


    if (
        document.cookie &&
        document.cookie !== ""
    ) {

        const cookies =
            document.cookie.split(
                ";"
            );


        for (
            let cookie
            of cookies
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


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


function getTabTitle(
    tab
) {

    const titles = {

        messages:
            "گفتگو",

        timeline:
            "روند",

        tender:
            "مناقصه",

        report:
            "گزارش"

    };


    return (
        titles[tab] ||
        tab ||
        "بخش پروژه"
    );

}


/* ==================================================
   INIT
================================================== */

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
