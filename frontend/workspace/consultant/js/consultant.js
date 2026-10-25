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
    progress
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
            stage.key === progress?.current_stage
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
                project.progress
            );

    }


    renderConsultantProjectTab(
        "summary"
    );

}


/* ==================================================
   CONSULTANT FILE CENTER
================================================== */

function loadConsultantFileCenter(projectId, content) {
    const resolveConsultantFileUrl = rawUrl => {
        if (!rawUrl) return "";

        try {
            const parsed = new URL(rawUrl, window.location.href);

            if (
                parsed.hostname === window.location.hostname &&
                window.location.port &&
                !parsed.port
            ) {
                parsed.port = window.location.port;
            }

            return parsed.href;
        } catch (_) {
            return rawUrl;
        }
    };

    const status = content.querySelector(".consultant-files-status");
    const groupsContainer = content.querySelector(".consultant-files-groups");
    const totalElement = content.querySelector(".consultant-files-total");

    if (!status || !groupsContainer) return;

    const escapeText = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

    const getExtension = url => {
        try {
            return new URL(url, window.location.origin).pathname
                .split(".").pop().toLowerCase();
        } catch (_) {
            return "";
        }
    };

    const getKind = (file) => {
        const ext = getExtension(file.file || "");
        if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
        if (ext === "pdf") return "pdf";
        if (["doc", "docx", "odt"].includes(ext)) return "document";
        if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
        if (["dwg", "dxf", "skp", "3ds", "obj", "stl"].includes(ext)) return "design";
        return "other";
    };

    const roleLabels = {
        customer: "فایل‌های مشتری",
        consultant: "فایل‌های مشاور",
        workshop: "فایل‌های کارگاه",
        designer: "فایل‌های طراح",
        company: "فایل‌های شرکت"
    };

    const showStatus = message => {
        status.textContent = message;
    };

    async function refreshFiles() {
        showStatus("در حال دریافت فایل‌ها...");

        try {
            const response = await fetch(`/api/projects/${projectId}/files/`, {
                credentials: "include",
                headers: { "X-Requested-With": "XMLHttpRequest" }
            });

            if (!response.ok) {
                throw new Error(response.status === 403
                    ? "اجازه دسترسی به فایل‌های این پروژه را ندارید."
                    : "دریافت فایل‌ها ناموفق بود.");
            }

            const data = await response.json();
            const roles = Object.entries(roleLabels);

            const totalFiles = roles.reduce((total, [role]) => {
                const items = Array.isArray(data[role]) ? data[role] : [];
                return total + items.length;
            }, 0);

			if (totalElement) {
                totalElement.textContent = totalFiles;
            }

            showStatus(totalFiles
                ? "فایل‌های هر نقش در بخش مربوط به خود نمایش داده می‌شوند."
                : "هنوز فایلی ثبت نشده است.");

            groupsContainer.innerHTML = roles.map(([role, label]) => {
                const roleFiles = Array.isArray(data[role]) ? data[role] : [];

                return `
                    <section class="consultant-file-role-card"
                        data-role-section="${escapeText(role)}">
                        <header class="consultant-file-role-header">
                            <div class="consultant-file-role-title">
                                <strong>${escapeText(label)}</strong>
                                <small>${roleFiles.length
                                    ? `${roleFiles.length} فایل`
                                    : "فایلی ثبت نشده"}</small>
                            </div>
                            <span class="consultant-file-role-count ${
                                roleFiles.length ? "has-files" : ""
                            }">${roleFiles.length}</span>
                        </header>
                        <div class="consultant-file-role-items">
                            ${roleFiles.map(file => {
                                const url = resolveConsultantFileUrl(file.file || "");
                                const title = file.title || "فایل پروژه";
                                const kind = getKind(file);
                                const ext = getExtension(url);
                                const source = file.source || "project";
                                const preview = kind === "image" && url
                                    ? `<img src="${escapeText(url)}" alt="" loading="lazy">`
                                    : `<span class="consultant-file-type-icon">${
                                        kind === "pdf" ? "📕" :
                                        kind === "document" ? "📄" :
                                        kind === "spreadsheet" ? "📊" :
                                        kind === "design" ? "📐" : "📎"
                                    }</span>`;

                                return `
                                    <article class="consultant-file-card"
                                        data-file-id="${escapeText(file.id)}"
                                        data-file-url="${escapeText(url)}"
                                        data-file-title="${escapeText(title)}"
                                        data-file-kind="${kind}"
                                        data-file-extension="${escapeText(ext)}"
                                        data-file-source="${escapeText(source)}">
                                        <button type="button"
                                            class="consultant-file-preview"
                                            aria-label="پیش‌نمایش ${escapeText(title)}"
                                            ${url ? "" : "disabled"}>
                                            ${preview}
                                        </button>
                                        <div class="consultant-file-details">
                                            <strong>${escapeText(title)}</strong>
                                            <span>${escapeText(file.file_type || ext.toUpperCase() || "FILE")}</span>
                                            <small>${escapeText(label)}${
                                                source === "standardization" ? " · استانداردسازی" : ""
                                            }</small>
                                        </div>
                                        ${source === "project" ? `
                                            <button type="button" class="consultant-file-delete"
                                                aria-label="حذف ${escapeText(title)}"
                                                title="حذف فایل">حذف</button>` : ""}
                                    </article>`;
                            }).join("")}
                            ${roleFiles.length ? "" : `
                                <div class="consultant-file-role-empty">
                                    فایلی برای این نقش ثبت نشده است.
                                </div>`}
                        </div>
                    </section>`;
            }).join("");

        } catch (error) {
            showStatus(error.message || "خطا در دریافت فایل‌ها.");
            groupsContainer.innerHTML = "";
        }
    }

    function openPreview(card) {
        const url = card.dataset.fileUrl;
        if (!url) return;

        const title = card.dataset.fileTitle || "پیش‌نمایش فایل";
        const kind = card.dataset.fileKind;
        const ext = card.dataset.fileExtension;

        document.getElementById("consultant-file-preview-modal")?.remove();

        const modal = document.createElement("div");
        modal.id = "consultant-file-preview-modal";
        modal.className = "consultant-file-preview-modal";
        modal.innerHTML = `
            <div class="consultant-file-preview-backdrop" data-close-preview></div>
            <section class="consultant-file-preview-dialog"
                role="dialog" aria-modal="true" aria-label="${escapeText(title)}">
                <header class="consultant-file-preview-toolbar">
                    <strong>${escapeText(title)}</strong>
                    <div>
                        <a href="${escapeText(url)}" download>دریافت فایل</a>
                        <button type="button" data-close-preview aria-label="بستن">×</button>
                    </div>
                </header>
                <div class="consultant-file-preview-body">
                    ${
                        kind === "image"
                            ? `<img src="${escapeText(url)}" alt="${escapeText(title)}">`
                        : ext === "pdf"
                            ? `<iframe src="${escapeText(url)}" title="${escapeText(title)}"></iframe>`
                        : `<div class="consultant-file-preview-fallback">
                                <div>📎</div>
                                <p>پیش‌نمایش این نوع فایل در مرورگر پشتیبانی نمی‌شود.</p>
                                <a href="${escapeText(url)}" download>دریافت فایل</a>
                           </div>`
                    }
                </div>
            </section>`;

        document.body.appendChild(modal);
        document.body.classList.add("consultant-file-preview-open");

        const close = () => {
            modal.remove();
            document.body.classList.remove("consultant-file-preview-open");
            document.removeEventListener("keydown", onKeyDown);
        };
        const onKeyDown = event => {
            if (event.key === "Escape") close();
        };

        modal.addEventListener("click", event => {
            if (event.target.closest("[data-close-preview]")) close();
        });
        document.addEventListener("keydown", onKeyDown);
        modal.querySelector("[data-close-preview]")?.focus();
    }

    groupsContainer.addEventListener("click", async event => {
        const previewButton = event.target.closest(".consultant-file-preview");
        if (previewButton) {
            openPreview(previewButton.closest(".consultant-file-card"));
            return;
        }

        const deleteButton = event.target.closest(".consultant-file-delete");
        if (!deleteButton) return;

        const card = deleteButton.closest(".consultant-file-card");
        const fileId = card?.dataset.fileId;
        if (!fileId || !confirm("آیا از حذف این فایل مطمئن هستی؟")) return;

        deleteButton.disabled = true;
        showStatus("در حال حذف فایل...");

        try {
            const response = await fetch(
                `/api/projects/${projectId}/attachments/${encodeURIComponent(fileId)}/delete/`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "X-CSRFToken": getCSRFToken(),
                        "X-Requested-With": "XMLHttpRequest"
                    }
                }
            );

            if (!response.ok) {
                throw new Error(response.status === 403 || response.status === 404
                    ? "حذف ممکن نیست؛ فقط فایل‌های مجاز خودت را می‌توانی حذف کنی."
                    : "حذف فایل ناموفق بود.");
            }

            await refreshFiles();
        } catch (error) {
            showStatus(error.message || "خطا هنگام حذف فایل.");
            deleteButton.disabled = false;
        }
    });

    const uploadButton = content.querySelector(".consultant-files-upload");
    const fileInput = content.querySelector(".consultant-files-input");

    uploadButton?.addEventListener("click", () => fileInput?.click());

    fileInput?.addEventListener("change", async () => {
        const selectedFiles = Array.from(fileInput.files || []);
        if (!selectedFiles.length) return;

        uploadButton.disabled = true;

        try {
            for (let index = 0; index < selectedFiles.length; index++) {
                const file = selectedFiles[index];
                showStatus(`در حال بارگذاری فایل ${index + 1} از ${selectedFiles.length}: ${file.name}`);

                const formData = new FormData();
                formData.append("file", file);
                formData.append("title", file.name);

                const response = await fetch(`/api/projects/${projectId}/attachments/`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "X-CSRFToken": getCSRFToken() },
                    body: formData
                });

                if (!response.ok) {
                    const responseBody = await response.text();
                    console.error("Consultant project file upload failed:", {
                        status: response.status,
                        body: responseBody
                    });

                    let detail = responseBody;
                    try {
                        const parsed = JSON.parse(responseBody);
                        detail = parsed.detail || parsed.file ||
                            parsed.title || JSON.stringify(parsed);
                        if (typeof detail !== "string") {
                            detail = JSON.stringify(detail);
                        }
                    } catch (_) {}

                    throw new Error(
                        `Upload failed (HTTP ${response.status}): ${detail || "No server details"}`
                    );
                }
            }

            fileInput.value = "";
            await refreshFiles();
        } catch (error) {
            showStatus(error.message || "خطا هنگام بارگذاری فایل.");
        } finally {
            uploadButton.disabled = false;
        }
    });

    refreshFiles();
}

/* ==================================================
   END CONSULTANT FILE CENTER
================================================== */


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
            content.innerHTML = `
                <div class="project-section consultant-file-center">
                    <div class="consultant-files-header">
                        <div class="consultant-files-heading">
                            <span class="consultant-files-eyebrow">
                                PROJECT FILE CENTER
                            </span>

                            <h3>
                                فایل‌های پروژه
                                <span class="consultant-files-total">0</span>
                            </h3>

                            <p>
                                فایل‌های پروژه در فضای اختصاصی هر نقش نگهداری می‌شوند.
                            </p>
                        </div>

                        <button type="button" class="consultant-files-upload">
                            <span aria-hidden="true">+</span>
                            افزودن فایل
                        </button>
                    </div>

                    <input
                        type="file"
                        class="consultant-files-input"
                        multiple
                        hidden
                    >

                    <div class="consultant-files-status" aria-live="polite">
                        در حال دریافت فایل‌ها...
                    </div>

                    <div class="consultant-files-groups"></div>
                </div>
            `;

            loadConsultantFileCenter(project.id, content);
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

            content.innerHTML = `

                <div class="empty-state">

                    <h3>
                        گفتگو
                    </h3>

                    <p>
                        بخش گفتگو در MVP بعدی تکمیل می‌شود.
                    </p>

                </div>

            `;

            break;


        case "timeline":

            content.innerHTML = `

                <div class="empty-state">

                    <h3>
                        روند پروژه
                    </h3>

                    <p>
                        بخش روند پروژه در MVP بعدی تکمیل می‌شود.
                    </p>

                </div>

            `;

            break;


        case "tender":

            loadConsultantTender(
                project.id
            );

            break;




        case "proposals":

            loadConsultantProposals(
                project.id
            );

            break;

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

async function loadConsultantTender(
    projectId
){

    const content =
        document.getElementById(
            "consultant-project-content"
        );


    if(!content){
        return;
    }


    content.innerHTML = `

        <div class="project-section">

            <div class="tender-loading">

                <div class="tender-loading-dot"></div>

                <span>
                    در حال دریافت کنترل مناقصه...
                </span>

            </div>

        </div>

    `;


    try {

        const response =
            await fetch(
                `/api/projects/${projectId}/tender/`,
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
                "Tender loading failed"
            );

        }


        const data =
            await response.json();


        renderConsultantTender(
            data
        );

    }
    catch(error){

        console.error(
            "Tender error:",
            error
        );


        content.innerHTML = `

            <div class="project-section">

                <div class="tender-error">

                    <div class="tender-error-icon">
                        ⚠️
                    </div>

                    <h3>
                        خطا در دریافت اطلاعات مناقصه
                    </h3>

                    <p>
                        اطلاعات کنترل مناقصه پروژه دریافت نشد.
                    </p>

                </div>

            </div>

        `;

    }

}

/* ==================================================
   TENDER CONTROL ACTIONS
================================================== */

async function startConsultantTender(
    tenderId,
    projectId
){

    if(!confirm(
        "آیا از شروع مناقصه اطمینان دارید؟\n\nپس از شروع، مناقصه برای کارگاه‌های انتخاب‌شده فعال می‌شود."
    )){
        return;
    }


    try{

        const response =
            await fetch(
                `/api/tenders/${tenderId}/start/`,
                {
                    method: "POST",

                    credentials:
                        "same-origin",

                    headers:{
                        "Accept":
                            "application/json",

                        "Content-Type":
                            "application/json",

                        "X-CSRFToken":
                            getCSRFToken()
                    },

                    body: JSON.stringify({})
                }
            );


        const data =
            await response.json();


        if(!response.ok){

            throw new Error(
                data.detail ||
                data.message ||
                "شروع مناقصه انجام نشد."
            );

        }


        alert(
            data.message ||
            "مناقصه با موفقیت شروع شد."
        );


        await loadConsultantTender(
            projectId
        );

    }
    catch(error){

        console.error(
            "Tender start error:",
            error
        );


        alert(
            error.message ||
            "خطا در شروع مناقصه."
        );

    }

}


async function closeConsultantTender(
    tenderId,
    projectId
){

    if(!confirm(
        "آیا از پایان دادن به این مناقصه اطمینان دارید؟\n\nپس از پایان، دریافت پیشنهادهای جدید متوقف می‌شود."
    )){
        return;
    }


    try{

        const response =
            await fetch(
                `/api/tenders/${tenderId}/close/`,
                {
                    method: "POST",

                    credentials:
                        "same-origin",

                    headers:{
                        "Accept":
                            "application/json",

                        "Content-Type":
                            "application/json",

                        "X-CSRFToken":
                            getCSRFToken()
                    },

                    body: JSON.stringify({})
                }
            );


        const data =
            await response.json();


        if(!response.ok){

            throw new Error(
                data.detail ||
                data.message ||
                "پایان مناقصه انجام نشد."
            );

        }


        alert(
            data.message ||
            "مناقصه با موفقیت پایان یافت."
        );


        await loadConsultantTender(
            projectId
        );

    }
    catch(error){

        console.error(
            "Tender close error:",
            error
        );


        alert(
            error.message ||
            "خطا در پایان مناقصه."
        );

    }

}

/* ==================================================
   TENDER WORKSHOP SELECTION
================================================== */

async function openTenderWorkshopSelector(
    tenderId,
    projectId,
    currentParticipants = []
){

    const existingModal =
        document.getElementById(
            "tender-workshop-selector-modal"
        );

    if(existingModal){
        existingModal.remove();
    }


    const selectedIds =
        new Set(
            currentParticipants
                .map(
                    participant =>
                        Number(participant.organization)
                )
                .filter(
                    id => !Number.isNaN(id)
                )
        );


    const modal =
        document.createElement("div");

    modal.id =
        "tender-workshop-selector-modal";

    modal.className =
        "tender-workshop-modal";


    modal.innerHTML = `

        <div class="tender-workshop-modal-backdrop"></div>

        <div
            class="tender-workshop-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tender-workshop-selector-title"
        >

            <div class="tender-workshop-modal-header">

                <div>

                    <span class="tender-panel-kicker">
                        WORKSHOP SELECTION
                    </span>

                    <h3 id="tender-workshop-selector-title">
                        انتخاب کارگاه‌های مناقصه
                    </h3>

                    <p>
                        کارگاه‌هایی را که می‌خواهید برای این مناقصه
                        انتخاب شوند مشخص کنید.
                    </p>

                </div>

                <button
                    type="button"
                    class="tender-workshop-modal-close"
                    id="tender-workshop-modal-close"
                    aria-label="بستن"
                >
                    ×
                </button>

            </div>


            <div class="tender-workshop-modal-toolbar">

                <input
                    type="search"
                    id="tender-workshop-search"
                    class="tender-workshop-search"
                    placeholder="جستجوی نام کارگاه..."
                    autocomplete="off"
                >

                <span
                    class="tender-workshop-selected-count"
                    id="tender-workshop-selected-count"
                >
                    ${selectedIds.size} کارگاه انتخاب شده
                </span>

            </div>


            <div
                class="tender-workshop-list"
                id="tender-workshop-list"
            >

                <div class="tender-workshop-loading">
                    <span class="tender-loading-dot"></span>
                    در حال دریافت فهرست کارگاه‌ها...
                </div>

            </div>


            <div class="tender-workshop-modal-footer">

                <div class="tender-workshop-footer-info">

                    <span>
                        انتخاب‌های فعلی جایگزین انتخاب‌های قبلی می‌شوند.
                    </span>

                </div>

                <div class="tender-workshop-footer-actions">

                    <button
                        type="button"
                        class="tender-workshop-secondary-button"
                        id="tender-workshop-cancel"
                    >
                        انصراف
                    </button>

                    <button
                        type="button"
                        class="tender-workshop-primary-button"
                        id="tender-workshop-save"
                    >
                        ذخیره انتخاب‌ها
                    </button>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    const closeModal = () => {

        modal.remove();

    };


    const closeButton =
        document.getElementById(
            "tender-workshop-modal-close"
        );


    const cancelButton =
        document.getElementById(
            "tender-workshop-cancel"
        );


    const backdrop =
        modal.querySelector(
            ".tender-workshop-modal-backdrop"
        );


    if(closeButton){
        closeButton.addEventListener(
            "click",
            closeModal
        );
    }


    if(cancelButton){
        cancelButton.addEventListener(
            "click",
            closeModal
        );
    }


    if(backdrop){
        backdrop.addEventListener(
            "click",
            closeModal
        );
    }


    const searchInput =
        document.getElementById(
            "tender-workshop-search"
        );


    const list =
        document.getElementById(
            "tender-workshop-list"
        );


    const selectedCount =
        document.getElementById(
            "tender-workshop-selected-count"
        );


    function updateSelectedCount(){

        const count =
            selectedIds.size;

        if(selectedCount){

            selectedCount.textContent =
                `${count} کارگاه انتخاب شده`;

        }

    }


    function renderWorkshopList(
        workshops
    ){

        if(!Array.isArray(workshops)){
            workshops = [];
        }


        const query =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";


        const filtered =
            workshops.filter(
                workshop => {

                    const name =
                        String(
                            workshop.name || ""
                        )
                        .toLowerCase();

                    return !query ||
                        name.includes(query);

                }
            );


        if(!filtered.length){

            list.innerHTML = `

                <div class="tender-workshop-empty">

                    <div class="tender-workshop-empty-icon">
                        ◌
                    </div>

                    <strong>
                        کارگاهی پیدا نشد
                    </strong>

                    <small>
                        نام کارگاه را بررسی کنید.
                    </small>

                </div>

            `;

            return;

        }


        list.innerHTML =
            filtered
                .map(
                    workshop => {

                        const id =
                            Number(workshop.id);

                        const checked =
                            selectedIds.has(id);

                        const safeName =
                            escapeHTML(
                                workshop.name ||
                                "کارگاه بدون نام"
                            );


                        return `

                            <label
                                class="tender-workshop-option
                                ${checked ? "selected" : ""}"
                                data-workshop-option="${id}"
                            >

                                <input
                                    type="checkbox"
                                    class="tender-workshop-checkbox"
                                    value="${id}"
                                    ${checked ? "checked" : ""}
                                >

                                <span
                                    class="tender-workshop-checkmark"
                                >
                                    ✓
                                </span>

                                <span
                                    class="tender-workshop-option-content"
                                >

                                    <strong>
                                        ${safeName}
                                    </strong>

                                    <small>
                                        کارگاه فعال
                                    </small>

                                </span>

                            </label>

                        `;

                    }
                )
                .join("");


        list
            .querySelectorAll(
                ".tender-workshop-checkbox"
            )
            .forEach(
                checkbox => {

                    checkbox.addEventListener(
                        "change",
                        () => {

                            const id =
                                Number(
                                    checkbox.value
                                );


                            if(checkbox.checked){

                                selectedIds.add(id);

                            }
                            else{

                                selectedIds.delete(id);

                            }


                            const option =
                                checkbox.closest(
                                    ".tender-workshop-option"
                                );


                            if(option){

                                option.classList.toggle(
                                    "selected",
                                    checkbox.checked
                                );

                            }


                            updateSelectedCount();

                        }
                    );

                }
            );

    }


    if(searchInput){

        searchInput.addEventListener(
            "input",
            () => {

                renderWorkshopList(
                    window.__tenderAvailableWorkshops || []
                );

            }
        );

    }


    try{

        const response =
            await fetch(
                "/api/organizations/workshops/",
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        if(!response.ok){

            throw new Error(
                data.detail ||
                data.message ||
                "دریافت فهرست کارگاه‌ها انجام نشد."
            );

        }


        const workshops =
            Array.isArray(data.workshops)
                ? data.workshops
                : [];


        window.__tenderAvailableWorkshops =
            workshops;


        renderWorkshopList(
            workshops
        );

    }
    catch(error){

        console.error(
            "Workshop list error:",
            error
        );


        list.innerHTML = `

            <div class="tender-workshop-error">

                <div class="tender-workshop-empty-icon">
                    !
                </div>

                <strong>
                    دریافت کارگاه‌ها انجام نشد
                </strong>

                <small>
                    ${escapeHTML(
                        error.message ||
                        "خطای نامشخص"
                    )}
                </small>

            </div>

        `;

    }


    const saveButton =
        document.getElementById(
            "tender-workshop-save"
        );


    if(saveButton){

        saveButton.addEventListener(
            "click",
            async () => {

                const organizationIds =
                    Array.from(
                        selectedIds
                    );


                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "در حال ذخیره...";


                try{

                    const response =
                        await fetch(
                            `/api/tenders/${tenderId}/participants/`,
                            {
                                method: "POST",

                                credentials:
                                    "same-origin",

                                headers:{
                                    "Accept":
                                        "application/json",

                                    "Content-Type":
                                        "application/json",

                                    "X-CSRFToken":
                                        getCSRFToken()
                                },

                                body:
                                    JSON.stringify({
                                        organizations:
                                            organizationIds
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    if(!response.ok){

                        throw new Error(
                            data.detail ||
                            data.message ||
                            "ذخیره کارگاه‌ها انجام نشد."
                        );

                    }


                    alert(
                        data.message ||
                        "کارگاه‌های مناقصه با موفقیت ذخیره شدند."
                    );


                    closeModal();


                    await loadConsultantTender(
                        projectId
                    );

                }
                catch(error){

                    console.error(
                        "Workshop selection error:",
                        error
                    );


                    alert(
                        error.message ||
                        "خطا در ذخیره کارگاه‌ها."
                    );


                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "ذخیره انتخاب‌ها";

                }

            }
        );

    }

}

/* ==================================================
   TENDER SETTINGS PANEL
================================================== */

function openTenderSettingsPanel(
    tender,
    projectId
){

    const existingModal =
        document.getElementById(
            "tender-settings-modal"
        );

    if(existingModal){
        existingModal.remove();
    }


    function toDateTimeLocalValue(value){

        if(!value){
            return "";
        }

        const date =
            new Date(value);

        if(Number.isNaN(date.getTime())){
            return "";
        }

        const pad =
            number =>
                String(number).padStart(2, "0");

        return (
            date.getFullYear() +
            "-" +
            pad(date.getMonth() + 1) +
            "-" +
            pad(date.getDate()) +
            "T" +
            pad(date.getHours()) +
            ":" +
            pad(date.getMinutes())
        );

    }


    const modal =
        document.createElement("div");

    modal.id =
        "tender-settings-modal";

    modal.className =
        "tender-workshop-modal";


    modal.innerHTML = `

        <div class="tender-workshop-modal-backdrop"></div>

        <div
            class="tender-workshop-modal-dialog tender-settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tender-settings-title"
        >

            <div class="tender-workshop-modal-header">

                <div>

                    <span class="tender-panel-kicker">
                        TENDER SETTINGS
                    </span>

                    <h3 id="tender-settings-title">
                        تنظیمات مناقصه
                    </h3>

                    <p>
                        زمان‌بندی و ساختار دورهای مناقصه را مشخص کنید.
                    </p>

                </div>

                <button
                    type="button"
                    class="tender-workshop-modal-close"
                    id="tender-settings-close"
                    aria-label="بستن"
                >
                    ×
                </button>

            </div>


            <div class="tender-settings-form">

                <div class="tender-settings-field">

                    <label for="tender-scheduled-start">
                        شروع مناقصه
                    </label>

                    <input
                        type="datetime-local"
                        id="tender-scheduled-start"
                        value="${toDateTimeLocalValue(
                            tender.scheduled_start_at
                        )}"
                    >

                    <small>
                        زمان برنامه‌ریزی‌شده شروع مناقصه
                    </small>

                </div>


                <div class="tender-settings-field">

                    <label for="tender-deadline">
                        مهلت ارسال پیشنهاد
                    </label>

                    <input
                        type="datetime-local"
                        id="tender-deadline"
                        value="${toDateTimeLocalValue(
                            tender.deadline
                        )}"
                    >

                    <small>
                        آخرین زمان مجاز برای ارسال پیشنهاد
                    </small>

                </div>


                <div class="tender-settings-field">

                    <label for="tender-scheduled-end">
                        پایان مناقصه
                    </label>

                    <input
                        type="datetime-local"
                        id="tender-scheduled-end"
                        value="${toDateTimeLocalValue(
                            tender.scheduled_end_at
                        )}"
                    >

                    <small>
                        زمان پایان برنامه‌ریزی‌شده مناقصه
                    </small>

                </div>


                <div class="tender-settings-field">

                    <label for="tender-round-count">
                        تعداد دور
                    </label>

                    <input
                        type="number"
                        id="tender-round-count"
                        min="1"
                        step="1"
                        value="${Number(tender.round_count || 1)}"
                    >

                    <small>
                        تعداد دورهای قابل اجرای مناقصه
                    </small>

                </div>

            </div>


            <div class="tender-workshop-modal-footer">

                <div class="tender-workshop-footer-info">

                    <span>
                        این تنظیمات تا قبل از فعال‌سازی قابل ویرایش هستند.
                    </span>

                </div>

                <div class="tender-workshop-footer-actions">

                    <button
                        type="button"
                        class="tender-workshop-secondary-button"
                        id="tender-settings-cancel"
                    >
                        انصراف
                    </button>

                    <button
                        type="button"
                        class="tender-workshop-primary-button"
                        id="tender-settings-save"
                    >
                        ذخیره تنظیمات
                    </button>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    const closeModal = () => {

        modal.remove();

    };


    document
        .getElementById("tender-settings-close")
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("tender-settings-cancel")
        ?.addEventListener(
            "click",
            closeModal
        );


    modal
        .querySelector(
            ".tender-workshop-modal-backdrop"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    const saveButton =
        document.getElementById(
            "tender-settings-save"
        );


    saveButton?.addEventListener(
        "click",
        async () => {

            const startInput =
                document.getElementById(
                    "tender-scheduled-start"
                );

            const deadlineInput =
                document.getElementById(
                    "tender-deadline"
                );

            const endInput =
                document.getElementById(
                    "tender-scheduled-end"
                );

            const roundInput =
                document.getElementById(
                    "tender-round-count"
                );


            const startValue =
                startInput.value;

            const deadlineValue =
                deadlineInput.value;

            const endValue =
                endInput.value;

            const roundCount =
                Number(roundInput.value);


            if(
                !startValue ||
                !deadlineValue ||
                !endValue
            ){

                alert(
                    "لطفاً زمان شروع، مهلت و پایان مناقصه را مشخص کنید."
                );

                return;

            }


            if(
                !Number.isInteger(roundCount) ||
                roundCount < 1
            ){

                alert(
                    "تعداد دور باید حداقل ۱ باشد."
                );

                return;

            }


            const startDate =
                new Date(startValue);

            const deadlineDate =
                new Date(deadlineValue);

            const endDate =
                new Date(endValue);


            if(
                startDate >= endDate
            ){

                alert(
                    "زمان پایان باید بعد از زمان شروع باشد."
                );

                return;

            }


            if(
                deadlineDate < startDate
            ){

                alert(
                    "مهلت ارسال پیشنهاد نمی‌تواند قبل از شروع مناقصه باشد."
                );

                return;

            }


            if(
                deadlineDate > endDate
            ){

                alert(
                    "مهلت ارسال پیشنهاد نمی‌تواند بعد از پایان مناقصه باشد."
                );

                return;

            }


            saveButton.disabled =
                true;

            saveButton.textContent =
                "در حال ذخیره...";


            try{

                const response =
                    await fetch(
                        `/api/tenders/${tender.id}/settings/`,
                        {
                            method: "PATCH",

                            credentials:
                                "same-origin",

                            headers: {

                                "Accept":
                                    "application/json",

                                "Content-Type":
                                    "application/json",

                                "X-CSRFToken":
                                    getCSRFToken()

                            },

                            body:
                                JSON.stringify({

                                    scheduled_start_at:
                                        startDate.toISOString(),

                                    deadline:
                                        deadlineDate.toISOString(),

                                    scheduled_end_at:
                                        endDate.toISOString(),

                                    round_count:
                                        roundCount

                                })

                        }
                    );


                const data =
                    await response.json();


                if(!response.ok){

                    throw new Error(
                        data.detail ||
                        data.message ||
                        "ذخیره تنظیمات انجام نشد."
                    );

                }


                closeModal();


                await loadConsultantTender(
                    projectId
                );

            }
            catch(error){

                console.error(
                    "Tender settings error:",
                    error
                );


                alert(
                    error.message ||
                    "خطا در ذخیره تنظیمات مناقصه."
                );


                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "ذخیره تنظیمات";

            }

        }
    );

}




async function loadConsultantProposals(projectId) {

    const content = document.getElementById(
        "consultant-project-content"
    );

    if (!content) {
        return;
    }

    content.innerHTML = `
        <div class="project-section proposals-section">
            <p class="proposals-message">
                در حال دریافت پیشنهادها...
            </p>
        </div>
    `;

    try {
        const response = await fetch(
            `/api/projects/${projectId}/tender/`,
            {
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error("Proposals loading failed");
        }

        const data = await response.json();

        // Avoid showing a response for a project that is no longer active.
        if (
            typeof project !== "undefined" &&
            project &&
            String(project.id) !== String(projectId)
        ) {
            return;
        }

        renderConsultantProposals(data);
    } catch (error) {
        console.error("Proposals error:", error);

        const currentContent = document.getElementById(
            "consultant-project-content"
        );

        if (currentContent) {
            currentContent.innerHTML = `
                <div class="project-section proposals-section">
                    <p class="proposals-message">
                        دریافت پیشنهادها انجام نشد. دوباره تلاش کن.
                    </p>
                    <button
                        type="button"
                        class="proposals-retry"
                        onclick="loadConsultantProposals(${Number(projectId) || 0})">
                        تلاش دوباره
                    </button>
                </div>
            `;
        }
    }
}


function renderConsultantProposals(data) {

    const content = document.getElementById(
        "consultant-project-content"
    );

    if (!content) {
        return;
    }

    const escapeText = value => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const tender = data && data.tender
        ? data.tender
        : null;

    const visibility = data && data.visibility
        ? data.visibility
        : {};

    if (!tender) {
        content.innerHTML = `
            <section class="project-section proposals-section">
                <h3>پیشنهادهای مناقصه</h3>
                <p class="proposals-message">
                    هنوز مناقصه‌ای برای این پروژه ایجاد نشده است.
                </p>
            </section>
        `;
        return;
    }

    const rounds = Array.isArray(tender.rounds)
        ? tender.rounds
        : [];


    const bids = [];

    rounds.forEach(round => {
        const roundBids = Array.isArray(round.bids)
            ? round.bids
            : [];

        roundBids
            .filter(bid => bid.status === "submitted")
            .forEach(bid => {
                bids.push({
                    ...bid,
                    _roundName: round.round_number
                        ? `دور ${round.round_number}`
                        : "",
                    _roundStatus: round.status || ""
                });
            });
    });

    const showAlias = visibility.show_alias === true;
    const showPrice = visibility.show_price === true;
    const showIdentity =
        visibility.show_workshop_identity === true;
    const showRank = visibility.show_rank === true;

    // Customer selection is separate from technical approval and official ranking.
    const customerSelection = data.customer_selection || data.tender?.customer_selection || null;
    const selectedBidId = customerSelection?.bid_id != null
        ? String(customerSelection.bid_id)
        : "";


    // Technical review is allowed only after closure
    // and before the tender is revealed.
    const reviewEnabled =
        tender.status === "closed" &&
        !tender.revealed_at &&
        !showPrice;

    // Ranking must come from explicit API fields, never card order.
    const evaluation = data.evaluation;
    const rankingRows = [];

    const collectRankingRows = value => {
        if (Array.isArray(value)) {
            value.forEach(collectRankingRows);
            return;
        }

        if (!value || typeof value !== "object") {
            return;
        }

        if (
            value.bid_id != null ||
            value.bid != null ||
            value.public_alias != null
        ) {
            rankingRows.push(value);
        }

        Object.entries(value).forEach(([key, child]) => {
            if (
                ["rankings", "results", "ranked_bids", "bids"]
                    .includes(key) &&
                Array.isArray(child)
            ) {
                child.forEach(collectRankingRows);
            }
        });
    };

    if (showRank && evaluation) {
        collectRankingRows(evaluation);
    }

    const findRanking = bid => {
        const row = rankingRows.find(item => {
            const itemBidId =
                item.bid_id ??
                (item.bid && typeof item.bid === "object"
                    ? item.bid.id
                    : item.bid);

            if (
                itemBidId != null &&
                bid.id != null &&
                String(itemBidId) === String(bid.id)
            ) {
                return true;
            }

            return Boolean(
                item.public_alias &&
                bid.public_alias &&
                item.public_alias === bid.public_alias
            );
        });

        if (!row) {
            return null;
        }

        const rawRank =
            row.rank ??
            row.rank_position ??
            row.position;

        const rank = Number(rawRank);

        return Number.isInteger(rank) && rank > 0
            ? rank
            : null;
    };

    const activeTenderTab = content.dataset.activeTenderTab || "bids";

    // Sort by explicit evaluation rank, never by card/DB order.
    if (showRank) {
        bids.sort((a, b) => {
            const rankA = findRanking(a);
            const rankB = findRanking(b);

            if (rankA == null && rankB == null) return 0;
            if (rankA == null) return 1;
            if (rankB == null) return -1;
            return rankA - rankB;
        });
    }

    const rankClass = rank => {
        if (rank === 1) return "proposal-rank-gold";
        if (rank === 2) return "proposal-rank-green";
        if (rank === 3) return "proposal-rank-blue";
        return "";
    };

    const money = value => {
        if (value == null || value === "") {
            return "—";
        }

        const numeric = Number(value);

        return Number.isFinite(numeric)
            ? numeric.toLocaleString("fa-IR")
            : escapeText(value);
    };

    const renderBid = bid => {
        const rank = showRank ? findRanking(bid) : null;
        const alias = showAlias && bid.public_alias
            ? escapeText(bid.public_alias)
            : "";

        const workshopName = showIdentity
            ? (
                bid.workshop_name ||
                bid.workshop_display_name ||
                ""
            )
            : "";

        const finalAmount =
            bid.final_amount ??
            bid.total_amount ??
            null;

        const fields = [];

        if (bid.production_days != null) {
            fields.push(
                `<span>زمان تولید: ${escapeText(bid.production_days)} روز</span>`
            );
        }

        if (bid.delivery_days != null) {
            fields.push(
                `<span>زمان تحویل: ${escapeText(bid.delivery_days)} روز</span>`
            );
        }

        if (bid.warranty_months != null) {
            fields.push(
                `<span>ضمانت: ${escapeText(bid.warranty_months)} ماه</span>`
            );
        }

        if (
            Array.isArray(bid.items) &&
            bid.items.length
        ) {
            fields.push(
                `<span>اقلام پیشنهاد: ${money(bid.items.length)}</span>`
            );
        }

        const priceMarkup = showPrice
            ? `
                <div class="proposal-price">
                    <span>مبلغ نهایی</span>
                    <strong>${money(finalAmount)}</strong>
                    ${
                        bid.discount_percentage != null
                            ? `<span>تخفیف: ${escapeText(bid.discount_percentage)}٪</span>`
                            : ""
                    }
                </div>
            `
            : "";

        const rankMarkup = rank
            ? `
                <span class="proposal-rank ${rankClass(rank)}">
                    رتبه ${money(rank)}
                </span>
            `
            : "";

        const identityMarkup = showIdentity && workshopName
            ? `
                <div class="proposal-workshop">
                    کارگاه: ${escapeText(workshopName)}
                </div>
            `
            : "";

        const aliasMarkup = alias
            ? `<div class="proposal-alias">شناسه پیشنهاد: ${alias}</div>`
            : "";

        const technicalMarkup = bid.technical_notes
            ? `
                <p class="proposal-notes">
                    ${escapeText(bid.technical_notes)}
                </p>
            `
            : "";

        const reviewStatus = [
            "approved",
            "rejected",
            "pending"
        ].includes(bid.review_status)
            ? bid.review_status
            : "pending";

        const reviewStatusLabels = {
            pending: "در انتظار بررسی فنی",
            approved: "تأیید فنی شده",
            rejected: "رد شده در بررسی فنی"
        };

        const reviewStatusMarkup = `
            <div class="proposal-review-status proposal-review-status-${reviewStatus}">
                <span class="proposal-review-status-label">
                    وضعیت بررسی فنی
                </span>
                <strong>
                    ${reviewStatusLabels[reviewStatus]}
                </strong>
                ${
                    reviewStatus === "rejected" && bid.rejection_reason
                        ? `<p class="proposal-rejection-reason">دلیل رد: ${escapeText(bid.rejection_reason)}</p>`
                        : ""
                }
            </div>
        `;

        const reviewActionsMarkup = !reviewEnabled
            ? ""
            : reviewStatus !== "pending"
                ? `
                    <div
                        class="proposal-review-actions proposal-review-actions-locked"
                        title="${reviewStatus === "approved" ? "تأیید فنی ثبت شده" : "رد فنی ثبت شده"}"
                        aria-label="${reviewStatus === "approved" ? "تأیید فنی ثبت شده" : "رد فنی ثبت شده"}"
                    >
                        <span
                            class="proposal-review-locked-icon ${reviewStatus === "approved" ? "approved" : "rejected"}"
                            aria-hidden="true"
                        >${reviewStatus === "approved" ? "✓" : "✕"}</span>
                    </div>
                  `
                : `
                    <div class="proposal-review-actions">
                        <button
                            type="button"
                            class="proposal-review-button proposal-review-approve"
                            data-bid-review="${escapeText(bid.id)}"
                            data-review-decision="approved"
                        >تأیید فنی</button>
                        <button
                            type="button"
                            class="proposal-review-button proposal-review-reject"
                            data-bid-review="${escapeText(bid.id)}"
                            data-review-decision="rejected"
                        >رد پیشنهاد</button>
                    </div>
                  `;

        return `
            <article
                class="proposal-card ${rank ? rankClass(rank) : ""} ${selectedBidId !== "" && bid.id != null && String(bid.id) === selectedBidId ? "proposal-card-customer-selected" : ""}"
                data-proposal-bid-id="${escapeText(bid.id ?? "")}"
            >

                <div class="proposal-card-heading">
                <h4>
                    پیشنهاد
                    ${bid._roundName
                        ? `— ${escapeText(bid._roundName)}`
                        : ""}
                </h4>
                ${rankMarkup}
            </div>
                ${aliasMarkup}
                ${selectedBidId !== "" && bid.id != null && String(bid.id) === selectedBidId
                    ? `<div class="proposal-customer-selection">
                           <span class="proposal-customer-selection-check" aria-hidden="true">✓</span>
                           <strong>انتخاب‌شده توسط مشتری</strong>
                       </div>
                       <div class="proposal-selection-lock-state">
                           ${customerSelection?.is_locked
                               ? "🔒 انتخاب مشتری توسط مشاور قفل شده است."
                               : "🔓 انتخاب مشتری هنوز قفل نشده است."}
                       </div>
                       <button
                           type="button"
                           class="proposal-selection-lock-button"
                           data-selection-lock="${escapeText(tender.id)}"
                           data-selection-locked="${customerSelection?.is_locked ? "true" : "false"}"
                       >${customerSelection?.is_locked
                           ? "بازکردن قفل انتخاب"
                           : "قفل‌کردن انتخاب مشتری"}</button>`
                    : ""}
                ${identityMarkup}
                <div class="proposal-facts">
                    ${fields.join("")}
                </div>
                ${technicalMarkup}
                ${reviewStatusMarkup}
                ${reviewActionsMarkup}
                ${priceMarkup}
            </article>
        `;
    };

    const bidsMarkup = bids.length
        ? bids.map(renderBid).join("")
        : `
            <div class="proposals-empty">
                <p>در حال حاضر پیشنهادی برای نمایش در دسترس نیست.</p>
            </div>
        `;

    const stageMessage = !showPrice
        ? "قیمت‌ها هنوز برای این مرحله قابل نمایش نیستند."
        : (
            !showIdentity
                ? "قیمت‌ها قابل مشاهده‌اند؛ هویت کارگاه‌ها تا انتشار رسمی رتبه‌بندی پنهان می‌ماند."
                : "هویت کارگاه‌ها و اطلاعات مجاز پیشنهادها قابل مشاهده است."
        );

    const preliminaryApproved = Boolean(tender.preliminary_approved_at);
    const commission1Approved = tender.commission_check_1 === true;
    const commission2Approved = tender.commission_check_2 === true;
    const rankingsPublished = Boolean(tender.rankings_published_at);
    const tenderRevealed = Boolean(tender.revealed_at);
    const canRunCommissionActions =
        tender.status === "revealed" && tenderRevealed;

    const commissionButton = (action, label, disabled) => `
        <button type="button"
                class="proposal-review-button"
                data-commission-action="${action}"
                ${disabled ? "disabled" : ""}>
            ${label}
        </button>
    `;

    content.innerHTML = `
        <nav class="tender-workflow-tabs"
             aria-label="بخش‌های مناقصه"
             style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
            <button type="button"
                    class="proposal-review-button"
                    data-tender-tab="bids"
                    aria-selected="true">
                پیشنهادها
            </button>
            <button type="button"
                    class="proposal-review-button"
                    data-tender-tab="commission"
                    aria-selected="false">
                تأیید کمیسیون و رتبه‌بندی
            </button>
        </nav>

        <section class="project-section tender-commission-section"
                 data-tender-panel="commission"
                 hidden>
            <div class="proposals-header">
                <div>
                    <div class="proposals-kicker">COMMISSION WORKFLOW</div>
                    <h3>تأیید کمیسیون و انتشار رتبه‌ها</h3>
                    <p>
                        ابتدا تأیید اولیه، سپس هر دو تأیید کمیسیون،
                        و در پایان انتشار رسمی رتبه‌بندی را ثبت کن.
                    </p>
                </div>
            </div>

            <div class="proposal-facts" style="display:grid;gap:12px">
                <div><strong>وضعیت مناقصه:</strong>
                    ${escapeText(tender.status || "نامشخص")}</div>
                <div><strong>تأیید اولیه:</strong>
                    ${preliminaryApproved ? "ثبت شده" : "ثبت نشده"}</div>
                <div><strong>تأیید کمیسیون اول:</strong>
                    ${commission1Approved ? "ثبت شده" : "ثبت نشده"}</div>
                <div><strong>تأیید کمیسیون دوم:</strong>
                    ${commission2Approved ? "ثبت شده" : "ثبت نشده"}</div>
                <div><strong>انتشار رسمی رتبه‌ها:</strong>
                    ${rankingsPublished ? "منتشر شده" : "منتشر نشده"}</div>
            </div>

            <div class="proposal-review-actions"
                 style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
                ${commissionButton(
                    "preliminary-approve",
                    "تأیید اولیه پیشنهادها",
                    !canRunCommissionActions || preliminaryApproved
                )}
                ${commissionButton(
                    "commission-check-1",
                    "ثبت تأیید کمیسیون اول",
                    !canRunCommissionActions || !preliminaryApproved ||
                        commission1Approved || rankingsPublished
                )}
                ${commissionButton(
                    "commission-check-2",
                    "ثبت تأیید کمیسیون دوم",
                    !canRunCommissionActions || !preliminaryApproved ||
                        commission2Approved || rankingsPublished
                )}
                ${commissionButton(
                    "publish-rankings",
                    "انتشار رسمی رتبه‌بندی",
                    !canRunCommissionActions || !preliminaryApproved ||
                        !commission1Approved || !commission2Approved ||
                        rankingsPublished
                )}
            </div>

            ${!canRunCommissionActions
                ? `<p class="proposals-message">
                       عملیات کمیسیون پس از افشای رسمی مناقصه و قرارگرفتن
                       وضعیت آن روی «revealed» فعال می‌شود.
                   </p>`
                : rankingsPublished
                    ? `<p class="proposals-message">
                           رتبه‌بندی قبلاً منتشر شده است.
                       </p>`
                    : ""}
        </section>

        <section class="project-section proposals-section"
                 data-tender-panel="bids">
            <div class="proposals-header">
                <div>
                    <div class="proposals-kicker">BID REVIEW</div>
                    <h3>پیشنهادهای مناقصه</h3>
                    <p>${escapeText(stageMessage)}</p>
                </div>
                <span class="proposals-count">
                    ${money(bids.length)} پیشنهاد
                </span>
            </div>

            <div class="proposals-carousel">
                <div class="proposals-carousel-controls" aria-label="پیمایش پیشنهادها">
                    <button type="button" class="proposals-scroll-btn proposals-scroll-left"
                            aria-label="مشاهده پیشنهادهای بعدی به سمت چپ" title="پیشنهادهای سمت چپ">‹</button>
                    <button type="button" class="proposals-scroll-btn proposals-scroll-right"
                            aria-label="بازگشت به پیشنهادهای سمت راست" title="پیشنهادهای سمت راست">›</button>
                </div>
                <div class="proposals-grid">
                ${bidsMarkup}
            </div>
            </div>
        </section>
    `;

    // Switch tabs and preserve the selected tab across data reloads.
    const setTenderTab = (selected) => {
        content.dataset.activeTenderTab = selected;

        content.querySelectorAll("[data-tender-panel]").forEach(panel => {
            panel.hidden = panel.dataset.tenderPanel !== selected;
        });

        content.querySelectorAll("[data-tender-tab]").forEach(tab => {
            tab.setAttribute(
                "aria-selected",
                String(tab.dataset.tenderTab === selected)
            );
        });
    };

    setTenderTab(activeTenderTab);

    content.querySelectorAll("[data-tender-tab]").forEach(button => {
        button.addEventListener("click", () => {
            setTenderTab(button.dataset.tenderTab);
        });
    });

    // Reuse the existing backend endpoints.
    content.querySelectorAll("[data-commission-action]").forEach(button => {
        button.addEventListener("click", async () => {
            const action = button.dataset.commissionAction;
            const endpoints = {
                "preliminary-approve": "preliminary-approve",
                "commission-check-1": "commission-check-1",
                "commission-check-2": "commission-check-2",
                "publish-rankings": "publish-rankings"
            };

            if (!tender.id || !endpoints[action]) {
                window.alert("شناسه مناقصه یا عملیات معتبر نیست.");
                return;
            }

            const messages = {
                "preliminary-approve": "تأیید اولیه پیشنهادها ثبت شود؟",
                "commission-check-1": "تأیید کمیسیون اول ثبت شود؟",
                "commission-check-2": "تأیید کمیسیون دوم ثبت شود؟",
                "publish-rankings":
                    "رتبه‌بندی رسمی منتشر شود؟ پس از انتشار، تأییدها قابل تغییر نیستند."
            };

            if (!window.confirm(messages[action])) return;

            button.disabled = true;

            try {
                const response = await fetch(
                    `/api/tenders/${encodeURIComponent(tender.id)}/${endpoints[action]}/`,
                    {
                        method: "POST",
                        credentials: "same-origin",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "X-CSRFToken": getCSRFToken()
                        },
                        body: JSON.stringify({})
                    }
                );

                let result = {};
                try {
                    result = await response.json();
                } catch (_) {
                    result = {};
                }

                if (!response.ok) {
                    const message = result.detail || result.error ||
                        "عملیات انجام نشد؛ وضعیت مناقصه و مجوز دسترسی را بررسی کن.";
                    throw new Error(
                        typeof message === "string"
                            ? message
                            : JSON.stringify(message)
                    );
                }

                await loadConsultantProposals(Number(data.project_id));
            } catch (error) {
                console.error("Commission workflow action failed:", error);
                window.alert(error.message || "ثبت عملیات کمیسیون ناموفق بود.");
                button.disabled = false;
            }
        });
    });

    // Lock or unlock the customer's current bid selection.
    content.querySelectorAll("[data-selection-lock]").forEach(button => {
        button.addEventListener("click", async () => {
            const tenderId = button.dataset.selectionLock;
            const currentlyLocked = button.dataset.selectionLocked === "true";
            const nextLocked = !currentlyLocked;

            if (!tenderId) {
                window.alert("شناسه مناقصه معتبر نیست.");
                return;
            }

            const confirmation = nextLocked
                ? "انتخاب فعلی مشتری قفل شود؟ مشتری دیگر نمی‌تواند پیشنهاد دیگری انتخاب کند."
                : "قفل انتخاب مشتری باز شود؟ مشتری دوباره امکان تغییر انتخاب خواهد داشت.";

            if (!window.confirm(confirmation)) {
                return;
            }

            button.disabled = true;

            try {
                const response = await fetch(
                    `/api/tenders/${encodeURIComponent(tenderId)}/selection-lock/`,
                    {
                        method: "POST",
                        credentials: "same-origin",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "X-CSRFToken": getCSRFToken()
                        },
                        body: JSON.stringify({
                            locked: nextLocked
                        })
                    }
                );

                let result = {};
                try {
                    result = await response.json();
                } catch (_) {
                    result = {};
                }

                if (!response.ok) {
                    const message = result.detail || result.error || result.selection ||
                        result.locked || "تغییر وضعیت قفل انجام نشد.";
                    throw new Error(
                        typeof message === "string"
                            ? message
                            : JSON.stringify(message)
                    );
                }

                await loadConsultantProposals(Number(data.project_id));
            } catch (error) {
                console.error("Tender selection lock action failed:", error);
                window.alert(error.message || "تغییر وضعیت قفل ناموفق بود.");
                button.disabled = false;
            }
        });
    });

    // Connect technical approval/rejection to the existing API.
    content.querySelectorAll("[data-bid-review]").forEach(button => {
        button.addEventListener("click", async () => {
            const bidId = button.dataset.bidReview;
            const decision = button.dataset.reviewDecision;

            if (!bidId || !["approved", "rejected"].includes(decision)) {
                return;
            }

            let rejectionReason = "";

            if (decision === "rejected") {
                const answer = window.prompt(
                    "دلیل رد فنی پیشنهاد را وارد کنید:"
                );

                if (answer === null) {
                    return;
                }

                rejectionReason = answer.trim();

                if (!rejectionReason) {
                    window.alert("برای رد پیشنهاد، وارد کردن دلیل الزامی است.");
                    return;
                }
            }

            const card = button.closest(".proposal-card");
            const actionButtons = card
                ? card.querySelectorAll("[data-bid-review]")
                : [button];

            actionButtons.forEach(item => {
                item.disabled = true;
            });

            try {
                const response = await fetch(
                    `/api/tenders/bids/${encodeURIComponent(bidId)}/review/`,
                    {
                        method: "PATCH",
                        credentials: "same-origin",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "X-CSRFToken": getCSRFToken()
                        },
                        body: JSON.stringify({
                            decision,
                            rejection_reason: rejectionReason
                        })
                    }
                );

                let result = {};
                try {
                    result = await response.json();
                } catch (_) {
                    result = {};
                }

                if (!response.ok) {
                    const message =
                        result.detail ||
                        result.rejection_reason ||
                        result.decision ||
                        "ثبت بررسی فنی انجام نشد.";

                    throw new Error(
                        typeof message === "string"
                            ? message
                            : JSON.stringify(message)
                    );
                }

                await loadConsultantProposals(
                    Number(data.project_id)
                );
            } catch (error) {
                console.error("Bid technical review failed:", error);
                window.alert(
                    error.message ||
                    "خطا در ثبت بررسی فنی. دوباره تلاش کنید."
                );

                actionButtons.forEach(item => {
                    item.disabled = false;
                });
            }
        });
    });

    const proposalsCarousel = content.querySelector(".proposals-carousel");
    const proposalsGrid = content.querySelector(".proposals-grid");
    const scrollLeftButton = content.querySelector(".proposals-scroll-left");
    const scrollRightButton = content.querySelector(".proposals-scroll-right");

    if (proposalsCarousel && proposalsGrid && scrollLeftButton && scrollRightButton) {
        const updateProposalScrollControls = () => {
            const hasOverflow =
                proposalsGrid.scrollWidth > proposalsGrid.clientWidth + 2;

            proposalsCarousel.classList.toggle("has-overflow", hasOverflow);
            scrollLeftButton.disabled = !hasOverflow;
            scrollRightButton.disabled = !hasOverflow;
        };

        const scrollProposalCards = direction => {
            const firstCard = proposalsGrid.querySelector(".proposal-card");
            const gap = parseFloat(getComputedStyle(proposalsGrid).columnGap) || 14;
            const distance = firstCard ? firstCard.getBoundingClientRect().width + gap : 280;

            proposalsGrid.scrollBy({
                left: direction * distance,
                behavior: "smooth"
            });
        };

        scrollLeftButton.addEventListener("click", () => scrollProposalCards(-1));
        scrollRightButton.addEventListener("click", () => scrollProposalCards(1));

        updateProposalScrollControls();
        window.requestAnimationFrame(updateProposalScrollControls);
        window.addEventListener("resize", updateProposalScrollControls, { passive: true });
    }
}


/* ==================================================
   TENDER RENDER
================================================== */

function renderConsultantTender(
    data
){

    const content =
        document.getElementById(
            "consultant-project-content"
        );


    if(!content){
        return;
    }


    const tender =
        data.tender || null;


    /*
    --------------------------------------------------
    NO TENDER
    --------------------------------------------------
    */

    if(!tender){

        content.innerHTML = `

            <div class="project-section tender-control-section">

                <div class="tender-header">

                    <div>

                        <div class="tender-kicker">
                            PROJECT CONTROL
                        </div>

                        <h3>
                            🏆 کنترل مناقصه پروژه
                        </h3>

                        <p>
                            مناقصه هنوز ایجاد نشده است.
                        </p>

                    </div>

                    <div class="tender-status-badge draft">

                        <span class="tender-status-dot"></span>

                        آماده ایجاد

                    </div>

                </div>


                <div class="tender-empty-state">

                    <div class="tender-empty-icon">
                        🏆
                    </div>

                    <h4>
                        هنوز مناقصه‌ای برای این پروژه ایجاد نشده
                    </h4>

                    <p>
                        پس از تأیید استانداردسازی، تنظیمات مناقصه
                        از همین بخش مدیریت خواهد شد.
                    </p>

                </div>

            </div>

        `;

        return;
    }


    /*
    --------------------------------------------------
    DATA
    --------------------------------------------------
    */

    const standardizationStatus =
        tender.standardization_status ||
        data.standardization_status ||
        "pending";


    const tenderStatus =
        tender.status ||
        "draft";


    const deadline =
        tender.deadline ||
        null;


    const closedAt =
        tender.closed_at ||
        null;


    const rounds =
        Array.isArray(tender.rounds)
            ? tender.rounds
            : [];


    const activeRound =
        rounds.find(
            round =>
                round.status === "open"
        ) ||
        rounds[rounds.length - 1] ||
        null;


    const participants =
        Array.isArray(tender.participants)
            ? tender.participants
            : [];


    /*
    --------------------------------------------------
    STATUS LABELS
    --------------------------------------------------
    */

    const standardizationLabels = {

        draft:
            "پیش‌نویس",

        pending_customer:
            "در انتظار تأیید مشتری",

        approved:
            "تأیید شده",

        revision_requested:
            "نیازمند اصلاح"

    };


    const tenderLabels = {

        draft:
            "پیش‌نویس",

        open:
            "در حال برگزاری",

        closed:
            "بسته شده",

        revealed:
            "پیشنهادها آشکار شده",

        awarded:
            "برنده انتخاب شده",

        cancelled:
            "لغو شده"

    };


    const standardizationLabel =
        standardizationLabels[
            standardizationStatus
        ] ||
        standardizationStatus;


    const tenderLabel =
        tenderLabels[
            tenderStatus
        ] ||
        tenderStatus;


    /*
    --------------------------------------------------
    PARTICIPATION
    --------------------------------------------------
    */

    const participantCount =
        participants.length;

        /*
    --------------------------------------------------
    TENDER CONTROL
    --------------------------------------------------
    */

    const activeRoundStartedAt =
        activeRound &&
        activeRound.started_at
            ? activeRound.started_at
            : null;

    const hasTenderSchedule =
        !!tender.scheduled_start_at &&
        !!tender.scheduled_end_at &&
        !!tender.deadline;


    const hasValidRoundCount =
        Number.isInteger(
            Number(tender.round_count)
        ) &&
        Number(tender.round_count) >= 1;

    const scheduledStartAt =
        tender.scheduled_start_at ||
        null;


    const scheduledEndAt =
        tender.scheduled_end_at ||
        null;


    const timelineStart =
        tenderStatus === "draft"
            ? scheduledStartAt
            : activeRoundStartedAt;


    const timelineEnd =
        tenderStatus === "draft"
            ? scheduledEndAt
            : closedAt;

    const canStartTender =
        tenderStatus === "draft" &&
        standardizationStatus === "approved" &&
        participantCount > 0 &&
        hasTenderSchedule &&
        hasValidRoundCount;

    const canCloseTender =
        tenderStatus === "open";


    const revealTimeReached =
        Boolean(tender.reveal_at) &&
        Number.isFinite(new Date(tender.reveal_at).getTime()) &&
        new Date(tender.reveal_at).getTime() <= Date.now();

    let tenderActionHtml = "";


    if (tenderStatus === "draft") {

        tenderActionHtml = `

            <div class="tender-action-panel">

                <div class="tender-action-info">

                    <span class="tender-action-kicker">
                        TENDER ACTION
                    </span>

                    <strong>
                        شروع مناقصه
                    </strong>

                    <small>
                        پس از شروع، مناقصه برای کارگاه‌های انتخاب‌شده فعال می‌شود.
                    </small>

                </div>


                <button
                    type="button"
                    id="start-tender-button"
                    class="tender-action-button start"
                    ${canStartTender ? "" : "disabled"}
                    data-tender-id="${tender.id}"
                >
                    <span>▶</span>
                    شروع مناقصه
                </button>

            </div>

        `;

    }
    else if (tenderStatus === "open") {

        tenderActionHtml = `

            <div class="tender-action-panel">

                <div class="tender-action-info">

                    <span class="tender-action-kicker">
                        TENDER ACTION
                    </span>

                    <strong>
                        مناقصه در حال برگزاری است
                    </strong>

                    <small>
                        در صورت پایان مهلت دریافت پیشنهادها، مناقصه را ببندید.
                    </small>

                </div>


                <button
                    type="button"
                    id="close-tender-button"
                    class="tender-action-button close"
                    data-tender-id="${tender.id}"
                >
                    <span>■</span>
                    پایان مناقصه
                </button>

            </div>

        `;



    }


    else if (tenderStatus === "closed") {

        if (!tender.pre_reveal_approved_at) {
            tenderActionHtml = `
                <div class="tender-action-panel">
                    <div class="tender-action-info">
                        <span class="tender-action-kicker">TENDER ACTION</span>
                        <strong>تأیید نهایی پیش از افشا</strong>
                        <small>پس از تکمیل بررسی فنی، تأیید نهایی را ثبت کنید.</small>
                    </div>
                    <button
                        type="button"
                        id="pre-reveal-approve-button"
                        class="tender-action-button start"
                    >✓ تأیید نهایی</button>
                </div>
            `;
        } else {
            tenderActionHtml = `
                <div class="tender-action-panel">
                    <div class="tender-action-info">
                        <span class="tender-action-kicker">TENDER ACTION</span>
                        <strong>آماده بازگشایی پیشنهادها</strong>
                        <small>برای ادامه، پیشنهادها را بازگشایی کنید.</small>
                    </div>
                    <button
                        type="button"
                        id="reveal-tender-button"
                        class="tender-action-button start"
                    >↗ بازگشایی پیشنهادها</button>
                </div>
            `;
        }

    }


    /*
    --------------------------------------------------
    CONTROL ACTION HANDLERS
    --------------------------------------------------
    */

    function bindTenderControlActions(){

    const startButton =
        document.getElementById(
            "start-tender-button"
        );


    const closeButton =
        document.getElementById(
            "close-tender-button"
        );


    const settingsButton =
        document.getElementById(
            "tender-settings-button"
        );

    const preRevealApproveButton =
        document.getElementById("pre-reveal-approve-button");

    const revealTenderButton =
        document.getElementById("reveal-tender-button");


    /*
    ----------------------------------------------
    START TENDER
    ----------------------------------------------
    */

    if(startButton){

        startButton.addEventListener(
            "click",
            () => {

                startConsultantTender(
                    tender.id,
                    data.project_id
                );

            }
        );

    }


    /*
    ----------------------------------------------
    CLOSE TENDER
    ----------------------------------------------
    */

    if(closeButton){

        closeButton.addEventListener(
            "click",
            () => {

                closeConsultantTender(
                    tender.id,
                    data.project_id
                );

            }
        );

    }


    /*
    ----------------------------------------------
    FINAL APPROVAL BEFORE REVEAL
    ----------------------------------------------
    */

    if (preRevealApproveButton) {
        preRevealApproveButton.addEventListener("click", async () => {
            if (!confirm("تأیید نهایی پیش از افشا ثبت شود؟")) return;

            preRevealApproveButton.disabled = true;

            try {
                const response = await fetch(
                    `/api/tenders/${encodeURIComponent(tender.id)}/pre-reveal-approve/`,
                    {
                        method: "POST",
                        credentials: "same-origin",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "X-CSRFToken": getCSRFToken()
                        },
                        body: JSON.stringify({})
                    }
                );

                const result = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(
                        result.error || result.detail ||
                        (typeof result === "string" ? result : "ثبت تأیید نهایی ناموفق بود.")
                    );
                }

                alert("تأیید نهایی پیش از افشا ثبت شد.");
                await loadConsultantTender(Number(data.project_id));
            } catch (error) {
                alert(error.message || "ثبت تأیید نهایی ناموفق بود.");
                preRevealApproveButton.disabled = false;
            }
        });
    }

    /*
    ----------------------------------------------
    REVEAL TENDER
    ----------------------------------------------
    */

    if (revealTenderButton) {
        revealTenderButton.addEventListener("click", async () => {
            if (!confirm("پیشنهادها بازگشایی شوند؟")) return;

            revealTenderButton.disabled = true;

            try {
                const response = await fetch(
                    `/api/tenders/${encodeURIComponent(tender.id)}/reveal/`,
                    {
                        method: "POST",
                        credentials: "same-origin",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "X-CSRFToken": getCSRFToken()
                        },
                        body: JSON.stringify({})
                    }
                );

                const result = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(
                        result.error || result.detail ||
                        (typeof result === "string" ? result : "بازگشایی پیشنهادها ناموفق بود.")
                    );
                }

                alert("پیشنهادها بازگشایی شدند.");
                await loadConsultantTender(Number(data.project_id));
            } catch (error) {
                alert(error.message || "بازگشایی پیشنهادها ناموفق بود.");
                revealTenderButton.disabled = false;
            }
        });
    }


    /*
    ----------------------------------------------
    TENDER SETTINGS
    ----------------------------------------------
    */

    if(settingsButton){

        settingsButton.addEventListener(
            "click",
            () => {

                openTenderSettingsPanel(
                    tender,
                    data.project_id
                );

            }
        );

    }

}
    /*
    --------------------------------------------------
    RENDER
    --------------------------------------------------
    */

    content.innerHTML = `

        <div class="project-section tender-control-section">


            <!-- =====================================
                 HEADER
            ====================================== -->

            <div class="tender-header">


                <div class="tender-header-main">

                    <div class="tender-kicker">
                        PROJECT CONTROL
                    </div>

                    <h3>
                        🏆 کنترل مناقصه پروژه
                    </h3>

                    <p>
                        مدیریت وضعیت، زمان‌بندی و مشارکت کارگاه‌ها
                    </p>

                </div>


                <div class="tender-main-status ${tenderStatus}">

                    <span class="tender-status-dot"></span>

                    <span>
                        ${tenderLabel}
                    </span>

                </div>


            </div>



            ${tenderActionHtml}

            <!-- =====================================
                 STATUS CARDS
            ====================================== -->

            <div class="tender-overview-grid">


                <div class="tender-info-card standardization-card">

                    <div class="tender-card-top">

                        <span class="tender-card-icon">
                            ✓
                        </span>

                        <span class="tender-card-label">
                            استانداردسازی
                        </span>

                    </div>


                    <div class="tender-card-value">
                        ${standardizationLabel}
                    </div>


                    <div class="tender-card-footer">

                        <span
                            class="tender-mini-dot ${standardizationStatus}"
                        ></span>

                        وضعیت استانداردسازی

                    </div>

                </div>



                <div class="tender-info-card">

                    <div class="tender-card-top">

                        <span class="tender-card-icon">
                            ◉
                        </span>

                        <span class="tender-card-label">
                            وضعیت مناقصه
                        </span>

                    </div>


                    <div class="tender-card-value">
                        ${tenderLabel}
                    </div>


                    <div class="tender-card-footer">

                        Tender Status

                    </div>

                </div>



                <div class="tender-info-card">

                    <div class="tender-card-top">

                        <span class="tender-card-icon">
                            ↻
                        </span>

                        <span class="tender-card-label">
                            دور فعال
                        </span>

                    </div>


                    <div class="tender-card-value">

                        ${
                            activeRound
                                ? `Round ${activeRound.round_number || "-"}`
                                : "Round -"
                        }

                    </div>


                    <div class="tender-card-footer">

                        ${
                            activeRound &&
                            activeRound.status
                                ? activeRound.status
                                : "هنوز دوری فعال نیست"
                        }

                    </div>

                </div>



                <div class="tender-info-card">

                    <div class="tender-card-top">

                        <span class="tender-card-icon">
                            ◌
                        </span>

                        <span class="tender-card-label">
                            کارگاه‌ها
                        </span>

                    </div>


                    <div class="tender-card-value">
                        ${participantCount}
                    </div>


                    <div class="tender-card-footer">
                        کارگاه دعوت‌شده
                    </div>

                </div>


            </div>



            <!-- =====================================
                 TIMELINE
            ====================================== -->

            <div class="tender-panel">


                <div class="tender-panel-header">

                    <div>

                        <span class="tender-panel-kicker">
                            SCHEDULE
                        </span>

                        <h4>
                            زمان‌بندی مناقصه
                        </h4>

                    </div>

                    ${

                        tenderStatus === "draft"

                            ? `

                                <button

                                    type="button"

                                    id="tender-settings-button"
                                    class="tender-settings-button"

                                    data-tender-id="${tender.id}"

                                >

                                    ⚙ تنظیمات مناقصه

                              </button>

                            `

                            : ""

    }

                </div>


                <div class="tender-timeline">


                    <div class="tender-time-item">

                        <span class="tender-time-dot"></span>

                        <div>

                            <span class="tender-time-label">
                                شروع
                            </span>

                            <strong>
                                ${timelineStart || "-"}
                            </strong>

                        </div>

                    </div>



                    <div class="tender-time-line"></div>



                    <div class="tender-time-item">

                        <span class="tender-time-dot"></span>

                        <div>

                            <span class="tender-time-label">
                                مهلت
                            </span>

                            <strong>
                                ${deadline || "-"}
                            </strong>

                        </div>

                    </div>



                    <div class="tender-time-line"></div>



                    <div class="tender-time-item">

                        <span class="tender-time-dot"></span>

                        <div>

                            <span class="tender-time-label">
                                پایان
                            </span>

                            <strong>
                                ${timelineEnd || "-"}
                            </strong>

                        </div>

                    </div>


                </div>

            </div>


<!-- =====================================
     WORKSHOPS
====================================== -->

<div class="tender-panel">

    <div class="tender-panel-header">

        <div>

            <span class="tender-panel-kicker">
                PARTICIPANTS
            </span>

            <h4>
                کارگاه‌های مناقصه
            </h4>

            <p class="tender-panel-description">
                کارگاه‌هایی که برای دریافت درخواست مناقصه انتخاب می‌شوند.
            </p>

        </div>


        <div class="tender-workshop-header-actions">

            <div class="tender-count-badge">
                ${participantCount}
                کارگاه
            </div>


            ${
                tenderStatus === "draft"
                    ? `
                        <button
                            type="button"
                            id="select-tender-workshops-button"
                            class="tender-workshop-select-button"
                            data-tender-id="${tender.id}"
                        >
                            <span>＋</span>
                            انتخاب کارگاه‌ها
                        </button>
                    `
                    : ""
            }

        </div>

    </div>


    ${
        participantCount > 0
            ? `

                <div class="tender-selected-workshops">

                    ${

                        participants
                            .map(
                                participant => `

                                    <div
                                        class="tender-selected-workshop"
                                    >

                                        <span
                                            class="tender-selected-workshop-dot"
                                        ></span>

                                        <div>

                                            <strong>
                                                ${
                                                    participant.organization_name ||
                                                    "کارگاه"
                                                }
                                            </strong>

                                            <small>
                                                ${
                                                    tenderStatus === "draft"
                                                        ? "انتخاب‌شده برای مناقصه"
                                                        : "در فهرست مشارکت‌کنندگان"
                                                }
                                            </small>

                                        </div>

                                    </div>

                                `
                            )
                            .join("")

                    }

                </div>

            `
            : `

                <div class="tender-no-workshops">

                    <span class="tender-no-workshops-icon">
                        🏭
                    </span>

                    <div>

                        <strong>
                            هنوز کارگاهی انتخاب نشده
                        </strong>

                        <small>
                            برای ادامه، حداقل یک کارگاه انتخاب کنید.
                        </small>

                    </div>

                </div>

            `
    }

</div>


<!-- =====================================

                 CONTROL ACTION

====================================== -->









            <!-- =====================================
                 CONTROL FOOTER
            ====================================== -->

            <div class="tender-control-footer">

                <div>

                    <span class="tender-footer-title">
                        Tender Control Center
                    </span>

                    <span class="tender-footer-text">
                        تنظیمات و اقدامات مناقصه از این بخش کنترل می‌شود.
                    </span>

                </div>


                <div class="tender-control-state">

                    <span class="tender-status-dot"></span>

                    ${tenderLabel}

                </div>

            </div>


        </div>

    `;
    /*
    --------------------------------------------------
    TENDER CONTROL BINDINGS
    --------------------------------------------------
    */

    bindTenderControlActions();


    const workshopButton =
        document.getElementById(
            "select-tender-workshops-button"
        );


    if(workshopButton){

        workshopButton.addEventListener(
            "click",
            () => {

                openTenderWorkshopSelector(
                    tender.id,
                    data.project_id,
                    participants
                );

            }
        );

    }


    const settingsButton =
        document.getElementById(
            "tender-settings-button"
        );


    if(settingsButton){

        settingsButton.addEventListener(
            "click",
            () => {

                openTenderSettingsPanel(
                    tender,
                    data.project_id
                );

            }
        );

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

    const standardizationStatus =
        data.standardization_status || "pending";


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
<div class="standardization-global-status">

${
    standardizationStatus === "approved"

    ? `
    <div class="standardization-light approved">
        <span class="status-dot"></span>
        تایید مشتری
    </div>
    `

    :

    standardizationStatus === "revision_requested"

    ? `
    <div class="standardization-light revision">
        <span class="status-dot"></span>
        اصلاح مشتری
    </div>
    `

    :

    `
    <div class="standardization-light pending">
        <span class="status-dot"></span>
        انتظار مشتری
    </div>
    `
}

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
