/*
============================================================
 FEEMAAS PROJECT CARD
 Card -> Summary Modal -> Project Detail
============================================================
*/

/*
============================================================
 PROJECT PROGRESS HELPERS
============================================================
*/

function getProjectProgressStage(progress) {

    if (!progress || !Array.isArray(progress.stages)) {
        return null;
    }

    return progress.stages.find(
        stage => stage.key === progress.current_stage
    ) || null;
}


function getProjectProgressStateClass(state) {

    switch (state) {

        case "current":
            return "current";

        case "completed":
            return "completed";

        case "attention":
            return "attention";

        case "blocked":
            return "blocked";

        case "upcoming":
        default:
            return "pending";
    }
}


function getProjectProgressStateIcon(state) {

    switch (state) {

        case "completed":
            return "✓";

        case "current":
            return "●";

        case "attention":
            return "!";

        case "blocked":
            return "×";

        case "upcoming":
        default:
            return "";
    }
}


function renderProjectProgress(progress) {

    if (!progress || !Array.isArray(progress.stages)) {

        return `
            <div class="project-progress-empty">
                اطلاعات روند پروژه در دسترس نیست.
            </div>
        `;
    }


    const currentStage =
        getProjectProgressStage(progress);


    const currentStageLabel =
        currentStage
            ? currentStage.label
            : "وضعیت نامشخص";


    const stagesHtml =
        progress.stages.map(stage => {

            const stateClass =
                getProjectProgressStateClass(
                    stage.state
                );

            const stateIcon =
                getProjectProgressStateIcon(
                    stage.state
                );

            return `
                <div
                    class="project-progress-step ${stateClass}"
                    data-progress-stage="${escapeHtml(stage.key)}"
                >

                    <div class="project-progress-node">

                        <span>
                            ${stateIcon}
                        </span>

                    </div>

                    <div class="project-progress-label">

                        ${escapeHtml(
                            stage.label || ""
                        )}

                    </div>

                </div>
            `;

        }).join("");


    const nextAction =
        progress.next_action &&
        progress.next_action.required
            ? progress.next_action
            : null;


    const nextActionHtml =
        nextAction
            ? `
                <div class="project-progress-next-action">

                    <span class="eyebrow">
                        NEXT ACTION
                    </span>

                    <strong>
                        ${escapeHtml(
                            nextAction.title ||
                            "اقدام بعدی"
                        )}
                    </strong>

                </div>
            `
            : "";


    const timing =
        progress.timing || null;


    const timingHtml =
        timing && timing.value
            ? `
                <div class="project-progress-timing">

                    <span>
                        ${escapeHtml(
                            timing.label ||
                            "زمان"
                        )}
                    </span>

                    <strong>
                        ${escapeHtml(
                            timing.value
                        )}
                    </strong>

                </div>
            `
            : "";


    return `
        <div
            class="project-progress"
            data-current-stage="${escapeHtml(
                progress.current_stage || ""
            )}"
        >

            <div class="project-progress-header">

                <div>

                    <span class="eyebrow">
                        PROJECT PROGRESS
                    </span>

                    <h3>
                        ${escapeHtml(
                            currentStageLabel
                        )}
                    </h3>

                </div>

                <div class="project-progress-health">
                    ${escapeHtml(
                        progress.health || "on_track"
                    )}
                </div>

            </div>


            <div class="project-progress-track">

                ${stagesHtml}

            </div>


            <div class="project-progress-context">

                ${nextActionHtml}

                ${timingHtml}

            </div>

        </div>
    `;
}
/*
============================================================
 CREATE PROJECT CARD
============================================================
*/

function createProjectCard(project) {

    const div = document.createElement("div");

    div.className = "project-card";
    div.dataset.projectId = project.id;

    const itemsCount = Array.isArray(project.items)
        ? project.items.length
        : 0;

    const filesCount =
        (Array.isArray(project.attachments)
            ? project.attachments.length
            : 0)
        +
        (Array.isArray(project.specification_attachments)
            ? project.specification_attachments.length
            : 0);

    const currentProgressStage =
        getProjectProgressStage(
            project.progress
        );

    const statusLabel =
        currentProgressStage
            ? currentProgressStage.label
            : "وضعیت نامشخص";

    const budget = Number(project.estimated_budget || 0);

    const formattedBudget = budget > 0
        ? new Intl.NumberFormat("fa-IR").format(budget)
        : "تعیین نشده";

    let lastActivity = "اطلاعات موجود نیست";

    if (project.updated_at) {
        const updated = new Date(project.updated_at);

        if (!Number.isNaN(updated.getTime())) {
            lastActivity = updated.toLocaleDateString(
                "fa-IR",
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );
        }
    }

    div.innerHTML = `

        <div class="project-card-glow"></div>

        <div class="project-card-top">

            <div class="project-card-identity">

                <span class="project-status-light"></span>

                <span class="project-status-label">
                    ${escapeHtml(statusLabel)}
                </span>

            </div>

            <span class="project-number">
                #${project.id}
            </span>

        </div>


        <div class="project-card-main">

            <h3 class="project-card-title">
                ${escapeHtml(
                    project.title ||
                    "بدون عنوان"
                )}
            </h3>

            <p class="project-description">
                ${escapeHtml(
                    project.description ||
                    "برای این پروژه توضیحی ثبت نشده است."
                )}
            </p>

        </div>


        <div class="project-card-divider"></div>


        <div class="project-card-info-grid">

            <div class="project-info-box">

                <div class="metric-value">
                    ${itemsCount}
                </div>


                <span class="project-info-label">
                    آیتم‌ها
                </span>


            </div>


            <div class="project-info-box">

                <span class="project-info-label">
                    فایل‌ها
                </span>

                <div class="metric-value">
                    ${filesCount}
                </div>

            </div>


            <div class="project-info-box">

                <span class="project-info-label">
                    بودجه
                </span>

                <div class="metric-value project-budget">
                    ${escapeHtml(formattedBudget)}
                </div>

            </div>


            <div class="project-info-box">

                <span class="project-info-label">
                    تحویل
                </span>

                <div class="metric-value">
                    ${
                        project.required_delivery_days
                        ? `${project.required_delivery_days}`
                        : "—"
                    }
                </div>

            </div>

        </div>


        <div class="project-card-bottom">

            <span class="project-last-update">
                آخرین تغییر: ${escapeHtml(lastActivity)}
            </span>

        </div>

    `;


    /*
    --------------------------------------------------------
    CARD INTERACTION
    --------------------------------------------------------
    */

    div.addEventListener("click", function() {

        console.log(
            "CARD CLICKED",
            project.id
        );

        showProject(project);

    });


    return div;
}

/*
============================================================
 PROJECT SUMMARY MODAL
============================================================
*/

function showProject(project) {

    const modal =
        document.getElementById(
            "project-modal"
        );


    const detail =
        document.getElementById(
            "project-detail"
        );


    if (!modal || !detail) {

        console.warn(
            "FEEMAAS: Project modal elements not found."
        );

        return;

    }

    const summaryProgressStage =
        getProjectProgressStage(
            project.progress
        );

    const summaryStatusLabel =
        summaryProgressStage
            ? summaryProgressStage.label
            : "وضعیت نامشخص";
    detail.innerHTML = `

        <div class="project-summary">

            <div class="eyebrow">
                PROJECT #${project.id}
            </div>


            <h2>
                ${escapeHtml(
                    project.title ||
                    "بدون عنوان"
                )}
            </h2>


            <div class="project-summary-status">

                <span>
                    وضعیت پروژه
                </span>

                <strong>
                    ${escapeHtml(
                       summaryStatusLabel
                    )}
                </strong>

            </div>


            <div class="project-summary-description">

                <span class="eyebrow">
                    DESCRIPTION
                </span>

                <p>
                    ${escapeHtml(
                        project.description ||
                        "توضیحی برای این پروژه ثبت نشده است."
                    )}
                </p>

            </div>


            <div class="project-meta">

                <div class="project-meta-item">

                    <span>
                        شناسه پروژه
                    </span>

                    <strong>
                        #${project.id}
                    </strong>

                </div>


                <div class="project-meta-item">

                    <span>
                        تعداد
                    </span>

                    <strong>
                        ${project.quantity ?? "—"}
                    </strong>

                </div>


                <div class="project-meta-item">

                    <span>
                        بودجه
                    </span>

                    <strong>
                        ${project.budget ?? "—"}
                    </strong>

                </div>

            </div>


            <div class="project-actions">

                <button
                    type="button"
                    class="project-action primary"
                    data-action="open-project"
                >
                    مشاهده پروژه
                </button>


                <button
                    type="button"
                    class="project-action"
                    data-action="messages"
                >
                    پیام‌ها
                </button>


                <button
                    type="button"
                    class="project-action"
                    data-action="contracts"
                >
                    قراردادها
                </button>


                ${
                    project.status === "draft"
                    ? `
                        <button
                            type="button"
                            class="project-action"
                            data-action="consultant"
                        >
                            ارسال برای مشاور
                        </button>
                    `
                    : ""
                }

            </div>

        </div>

    `;


    /*
    --------------------------------------------------------
    OPEN MODAL
    --------------------------------------------------------
    */

    modal.classList.remove(
        "hidden"
    );

    modal.classList.add(
        "active"
    );


    /*
    --------------------------------------------------------
    OPEN PROJECT
    --------------------------------------------------------
    */

    const openButton =
        detail.querySelector(
            '[data-action="open-project"]'
        );


    if (openButton) {

        openButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();


                closeProjectModal();


                openProjectDetail(
                    project
                );

            }
        );

    }


    /*
    --------------------------------------------------------
    MESSAGES
    --------------------------------------------------------
    */

    const messagesButton =
        detail.querySelector(
            '[data-action="messages"]'
        );


    if (messagesButton) {

        messagesButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();


                /*
                فعلاً فقط View اصلی پیام‌ها.
                بعداً آن را به Project Detail Tab
                تبدیل می‌کنیم.
                */

                closeProjectModal();


                if (
                    typeof showView ===
                    "function"
                ) {

                    showView(
                        "messages"
                    );

                }

            }
        );

    }


    /*
    --------------------------------------------------------
    CONTRACTS
    --------------------------------------------------------
    */

    const contractsButton =
        detail.querySelector(
            '[data-action="contracts"]'
        );


    if (contractsButton) {

        contractsButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();


                closeProjectModal();


                if (
                    typeof showView ===
                    "function"
                ) {

                    showView(
                        "contracts"
                    );

                }

            }
        );

    }


    /*
    --------------------------------------------------------
    CONSULTANT
    --------------------------------------------------------
    */

    const consultantButton =
        detail.querySelector(
            '[data-action="consultant"]'
        );


    if (consultantButton) {

        consultantButton.addEventListener(
            "click",
            async function(event) {

                event.preventDefault();

                if (
                    !project ||
                    project.status !== "draft"
                ) {
                    return;
                }

                const confirmed =
                    window.confirm(
                        "آیا می‌خواهید این پروژه برای مشاور ارسال شود؟"
                    );

                if (!confirmed) {
                    return;
                }

                consultantButton.disabled = true;

                const originalText =
                    consultantButton.textContent;

                consultantButton.textContent =
                    "در حال ارسال...";

                try {

                    const csrfToken =
                        typeof getCookie === "function"
                            ? getCookie("csrftoken")
                            : null;

                    const response =
                        await fetch(
                            `/api/projects/${project.id}/send-to-consultant/`,
                            {
                                method: "POST",
                                credentials: "same-origin",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    ...(csrfToken
                                        ? {
                                            "X-CSRFToken":
                                                csrfToken
                                        }
                                        : {})
                                },

                                body:
                                    JSON.stringify({})
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.error ||
                            data.detail ||
                            "ارسال پروژه برای مشاور انجام نشد."
                        );
                    }

                    project.status =
                        data.status ||
                        "consulting";


                    const statusElement =
                        detail.querySelector(
                            ".project-summary-status strong"
                        );


                    if(statusElement){

                        statusElement.textContent =
                            "consulting";

                    }


                    consultantButton.remove();

                    if (
                        typeof loadCustomerProjects ===
                        "function"
                    ) {
                        await loadCustomerProjects();
                    }

                    alert(
                        "پروژه با موفقیت برای مشاور ارسال شد."
                    );

                } catch(error) {

                    console.error(
                        "FEEMAAS: Summary send project failed",
                        error
                    );

                    consultantButton.disabled = false;

                    consultantButton.textContent =
                        originalText;

                    alert(
                         error.message ||
                         "خطا در ارسال پروژه برای مشاور."
                    );

                }

            }
       );

    }

}


/*
============================================================
 FULL PROJECT DETAIL
============================================================
*/

function openProjectDetail(project) {

    let projectView =
        document.getElementById(
            "project-detail-view"
        );


    /*
    --------------------------------------------------------
    CREATE VIEW IF NECESSARY
    --------------------------------------------------------
    */

    if (!projectView) {

        projectView =
            createProjectDetailView();

    }


    if (!projectView) {

        console.warn(
            "FEEMAAS: Could not create project detail view."
        );

        return;

    }


    /*
    --------------------------------------------------------
    PROJECT DETAIL CONTENT
    --------------------------------------------------------
    */
const projectProgressHtml =
    renderProjectProgress(
        project.progress
    );

    projectView.innerHTML = `

        <button
            type="button"
            class="project-view-close"
            id="project-view-close"
            aria-label="بستن پروژه"
            title="بستن"
        >
            ×
        </button>

        <div class="page-heading">

            <span class="eyebrow">
                PROJECT #${project.id}
            </span>


            <h2>
                ${escapeHtml(
                    project.title ||
                    "بدون عنوان"
                )}
            </h2>


            <p>
                مدیریت کامل پروژه
            </p>

        </div>


        <div class="project-detail-card">


            <div class="project-detail-header">

                <div>

                    <div class="project-progress-section">

                        ${projectProgressHtml}

                    </div>


                ${
                    project.status === "draft"
                ? `
                    <div class="project-consultant-action">

                        <div class="project-consultant-action-content">

                            <span class="eyebrow">
                                NEXT STEP
                            </span>

                            <strong>
                                پروژه آماده ارسال برای مشاور است
                            </strong>

                            <span>
                                پس از ارسال، پروژه وارد مرحله مشاوره خواهد شد.
                            </span>

                        </div>

                        <button
                            type="button"
                            class="project-consultant-action-button"
                            id="project-send-to-consultant"
                        >
                            ✦ ارسال پروژه به مشاور
                        </button>

                    </div>
                `
                : ""
        }


        <div class="project-detail-description">

                <span class="eyebrow">
                    DESCRIPTION
                </span>

                <p>

                    ${escapeHtml(
                        project.description ||
                        "توضیحی برای این پروژه ثبت نشده است."
                    )}

                </p>

            </div>


            <div class="project-meta">


                <div class="project-meta-item">

                    <span>
                        شناسه پروژه
                    </span>

                    <strong>
                        #${project.id}
                    </strong>

                </div>


                <div class="project-meta-item">

                    <span>
                        تعداد
                    </span>

                    <strong>
                        ${project.quantity ?? "—"}
                    </strong>

                </div>


                <div class="project-meta-item">

                    <span>
                        بودجه
                    </span>

                    <strong>
                        ${project.budget ?? "—"}
                    </strong>

                </div>


            </div>


            <!--
            ==================================================
             PROJECT TABS
            ==================================================
            -->

            <div class="project-detail-tabs">

                <button
                    type="button"
                    class="project-detail-tab active"
                    data-project-tab="overview"
                >
                    خلاصه پروژه
                </button>


                <button
                    type="button"
                    class="project-detail-tab"
                    data-project-tab="tender"
                >
                    مناقصه
                </button>


                <button
                    type="button"
                    class="project-detail-tab"
                    data-project-tab="messages"
                >
                    پیام‌ها
                </button>


                <button
                    type="button"
                    class="project-detail-tab"
                    data-project-tab="contracts"
                >
                    قراردادها
                </button>

                <button
                    type="button"
                    class="project-detail-tab"
                    data-project-tab="standardization"
                >
                    استانداردسازی
                </button>
                <button
                    type="button"
                    class="project-detail-tab"
                    data-project-tab="files"
                >
                    فایل‌ها و طراحی
                </button>


                <button
                    type="button"
                    class="project-detail-tab"
                    data-project-tab="reports"
                >
                    گزارش‌ها
                </button>

            </div>


            <!--
            ==================================================
             PROJECT TAB CONTENT
            ==================================================
            -->

            <div
                class="project-detail-tab-content"
                data-project-tab-content="overview"
            >

                <div class="project-tab-panel">

                    <span class="eyebrow">
                        PROJECT OVERVIEW
                    </span>

                    <h3>
                        خلاصه پروژه
                    </h3>

                    <p>
                        اطلاعات اصلی، وضعیت فعلی و
                        مسیر اجرای پروژه در این بخش نمایش داده می‌شود.
                    </p>

                </div>

            </div>


           <div
    class="project-detail-tab-content hidden"
    data-project-tab-content="tender"
>

    <div
        class="project-tab-panel"
        id="tender-dashboard"
    >

        <div class="tender-loading">

            در حال دریافت اطلاعات مناقصه...

        </div>

    </div>

</div>


            <div
                class="project-detail-tab-content hidden"
                data-project-tab-content="messages"
            >

                <div class="project-tab-panel">

                    <span class="eyebrow">
                        PROJECT MESSAGES
                    </span>

                    <h3>
                        پیام‌های پروژه
                    </h3>

                    <p>
                        ارتباطات مشتری، مشاور، کارگاه،
                        طراح و سایر عوامل پروژه در این بخش نمایش داده خواهد شد.
                    </p>

                </div>

            </div>


            <div
                class="project-detail-tab-content hidden"
                data-project-tab-content="contracts"
            >

                <div class="project-tab-panel">

                    <span class="eyebrow">
                        CONTRACTS
                    </span>

                    <h3>
                        قراردادهای پروژه
                    </h3>

                    <p>
                        قراردادها و اسناد حقوقی مرتبط با همین پروژه
                        در این تب مدیریت خواهند شد.
                    </p>

                </div>

            </div>

            <div
                class="project-detail-tab-content hidden"
                data-project-tab-content="standardization"
            >

                <div
                    class="project-tab-panel"
                    id="project-standardization-panel"
                >

                    در حال دریافت استانداردسازی...

                </div>

            </div>
            <div
	            class="project-detail-tab-content hidden"
                data-project-tab-content="files"
			>

			    <div
			        class="project-tab-panel"
                    id="project-files-panel"
                >

                    در حال دریافت فایل‌ها...

                </div>

            </div>

            </div>


            <div
                class="project-detail-tab-content hidden"
                data-project-tab-content="reports"
            >

                <div class="project-tab-panel">

                    <span class="eyebrow">
                        PROJECT REPORTS
                    </span>

                    <h3>
                        گزارش‌های پروژه
                    </h3>

                    <p>
                        گزارش مشتری، گزارش کارگاه‌ها و
                        گزارش کامل FEEMAAS در این بخش قرار خواهند گرفت.
                    </p>

                </div>

            </div>


        </div>

    `;


    /*
    --------------------------------------------------------
    HIDE OTHER WORKSPACE VIEWS
    --------------------------------------------------------
    */

    document
        .querySelectorAll(
            ".workspace-view"
        )
        .forEach(
            view => {

                view.classList.add(
                    "hidden"
                );

            }
        );


    /*
    --------------------------------------------------------
    SHOW PROJECT DETAIL
    --------------------------------------------------------
    */

    projectView.classList.remove(
        "hidden"
    );


    /*
    --------------------------------------------------------
    REMOVE ACTIVE NAV
    --------------------------------------------------------
    */

    document
        .querySelectorAll(
            ".nav-item[data-view]"
        )
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );

            }
        );


    /*
    --------------------------------------------------------
    PROJECT TAB HANDLERS
    --------------------------------------------------------
    */

    projectView
        .querySelectorAll(
            ".project-detail-tab"
        )
        .forEach(
            tab => {

                tab.addEventListener(
                    "click",
                    function() {

                        const target =
                            tab.dataset.projectTab;


                        /*
                        Active tab
                        */

                        projectView
                            .querySelectorAll(
                                ".project-detail-tab"
                            )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        tab.classList.add(
                            "active"
                        );


                        /*
                        Hide all panels
                        */

                        projectView
                            .querySelectorAll(
                                ".project-detail-tab-content"
                            )
                            .forEach(
                                panel => {

                                    panel.classList.add(
                                        "hidden"
                                    );

                                }
                            );


                        /*
                        Show selected panel
                        */

                        const targetPanel =
                            projectView.querySelector(
                                `[data-project-tab-content="${target}"]`
                            );


                        if (targetPanel) {

                            targetPanel.classList.remove(
                                "hidden"
                            );

                        }
if (
    target === "tender"
) {

    loadTenderDashboard(
        project.id
    );

}
if (
    target === "standardization"
) {

    loadProjectStandardization(
        project.id
    );

}
if (
    target === "files"
) {

    loadProjectFiles(
        project.id
    );

}
                    }
                );

            }
        );

/*
--------------------------------------------------------
SEND PROJECT TO CONSULTANT
--------------------------------------------------------
*/

const sendToConsultantButton =
    document.getElementById(
        "project-send-to-consultant"
    );

if (sendToConsultantButton) {

    sendToConsultantButton.addEventListener(
        "click",
        async function(event) {

            event.preventDefault();

            if (
                !project ||
                project.status !== "draft"
            ) {
                return;
            }


            /*
            ------------------------------------------------
            CONFIRM ACTION
            ------------------------------------------------
            */

            const confirmed =
                window.confirm(
                    "آیا می‌خواهید این پروژه برای مشاور ارسال شود؟"
                );

            if (!confirmed) {
                return;
            }


            /*
            ------------------------------------------------
            LOADING STATE
            ------------------------------------------------
            */

            sendToConsultantButton.disabled =
                true;

            sendToConsultantButton.dataset.originalText =
                sendToConsultantButton.textContent;

            sendToConsultantButton.textContent =
                "در حال ارسال...";


            try {

                /*
                ------------------------------------------------
                SEND TO BACKEND
                ------------------------------------------------
                */

                const response =
                    await fetch(
                        `/api/projects/${project.id}/send-to-consultant/`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                ...(typeof getCookie === "function" && getCookie("csrftoken")
                                    ? {
                                        "X-CSRFToken": getCookie("csrftoken")
                                    }
                                    : {})
                            },
                            credentials: "same-origin",
                            body: JSON.stringify({})
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "ارسال پروژه برای مشاور انجام نشد."
                    );

                }


                /*
                ------------------------------------------------
                UPDATE LOCAL PROJECT STATE
                ------------------------------------------------
                */

                project.status =
                    data.status ||
                    "consulting";


                /*
                ------------------------------------------------
                RE-RENDER PROJECT VIEW
                ------------------------------------------------
                */

                openProjectDetail(
                    project
                );


                /*
                ------------------------------------------------
                USER FEEDBACK
                ------------------------------------------------
                */

                setTimeout(
                    function() {

                        alert(
                            "پروژه با موفقیت برای مشاور ارسال شد."
                        );

                    },
                    100
                );


            } catch(error) {

                console.error(
                    "FEEMAAS: Send project to consultant failed",
                    error
                );


                sendToConsultantButton.disabled =
                    false;

                sendToConsultantButton.textContent =
                    sendToConsultantButton.dataset.originalText ||
                    "✦ ارسال پروژه به مشاور";


                alert(
                    error.message ||
                    "خطا در ارسال پروژه برای مشاور."
                );

            }

        }
    );

}
	/*
    --------------------------------------------------------
    PROJECT VIEW CLOSE
    --------------------------------------------------------
    */

    const closeProjectViewButton =
        document.getElementById("project-view-close");

    if (closeProjectViewButton) {

        closeProjectViewButton.addEventListener(
	        "click",
            function () {

                projectView.classList.add("hidden");

                const projectsView =
                    document.getElementById("projects-view");

                if (projectsView) {
                    projectsView.classList.remove("hidden");
                }

            }
        );

    }
    /*
    --------------------------------------------------------
    SCROLL TOP
    --------------------------------------------------------
    */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/*
============================================================
 LOAD TENDER DASHBOARD
============================================================
*/

async function loadTenderDashboard(projectId) {

    const container =
        document.getElementById(
            "tender-dashboard"
        );


    if (!container) {

        console.warn(
            "FEEMAAS: Tender dashboard container not found."
        );

        return;

    }


    /*
    --------------------------------------------------------
    LOADING STATE
    --------------------------------------------------------
    */

    container.innerHTML = `

        <div class="tender-loading">

            در حال دریافت اطلاعات مناقصه...

        </div>

    `;


    try {

        const data =
            await apiGet(
                `/projects/${projectId}/tender/`
            );


        renderTenderDashboard(
            container,
            data,
            projectId
        );


    } catch (error) {

        console.error(
            "FEEMAAS: Tender dashboard load failed.",
            error
        );


        container.innerHTML = `

            <div class="tender-error">

                <span class="eyebrow">
                    TENDER ERROR
                </span>

                <h3>
                    دریافت اطلاعات مناقصه ناموفق بود
                </h3>

                <p>
                    اطلاعات مناقصه این پروژه در حال حاضر
                    قابل دریافت نیست.
                </p>

            </div>

        `;

    }

}


/*
============================================================
 RENDER TENDER DASHBOARD
============================================================
*/

function renderTenderDashboard(
    container,
    data,
    projectId
) {

    const tender =
        data.tender;


    const evaluation =
        data.evaluation;


    if (!tender) {

        container.innerHTML = `

            <div class="tender-empty">

                <span class="eyebrow">
                    TENDER
                </span>

                <h3>
                    مناقصه‌ای برای این پروژه وجود ندارد
                </h3>

                <p>
                    هنوز مناقصه‌ای برای این پروژه ایجاد نشده است.
                </p>

            </div>

        `;

        return;

    }


    const summary =
        evaluation?.summary || {};


    const recommendation =
        evaluation?.recommendation || {};


    const results =
        evaluation?.results || [];


    container.innerHTML = `

        <div class="tender-dashboard">


            <!-- =========================================
                 TENDER HEADER
            ========================================== -->

            <div class="tender-dashboard-header">

                <div>

                    <span class="eyebrow">
                        TENDER
                    </span>

                    <h3>
                        ${escapeHtml(
                            tender.title ||
                            "مناقصه پروژه"
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            tender.description ||
                            "بدون توضیحات"
                        )}
                    </p>

                </div>


                <div class="tender-status">

                    ${escapeHtml(
                        tender.status ||
                        "نامشخص"
                    )}

                </div>

            </div>


            <!-- =========================================
                 SUMMARY
            ========================================== -->

            <div class="tender-summary-grid">


                <div class="tender-stat">

                    <span>
                        شرکت‌کنندگان
                    </span>

                    <strong>
                        ${
                            tender.participants?.length ??
                            0
                        }
                    </strong>

                </div>


                <div class="tender-stat">

                    <span>
                        پیشنهادها
                    </span>

                    <strong>
                        ${
                            tender.rounds?.reduce(
                                (total, round) =>
                                    total + (round.bids?.length ?? 0),
                                0
                            ) ?? 0
                        }
                    </strong>

                </div>


                <div class="tender-stat">

                    <span>
                        رتبه اول
                    </span>

                    <strong>
                        ${
                            summary.winner ||
                            "—"
                        }
                    </strong>

                </div>


                <div class="tender-stat">

                    <span>
                        امتیاز برنده
                    </span>

                    <strong>
                        ${
                            summary.winner_score ??
                            "—"
                        }
                    </strong>

                </div>


            </div>


            <!-- =========================================
                 RECOMMENDATION
            ========================================== -->

            <div class="tender-recommendation">

                <span class="eyebrow">
                    FEEMAAS RECOMMENDATION
                </span>


                <h4>
                    ${
                        recommendation.type ||
                        "Recommendation"
                    }
                </h4>


                <p>
                    ${
                        recommendation.message ||
                        "پیشنهاد سیستم در دسترس نیست."
                    }
                </p>

            </div>


            <!-- =========================================
                 RANKING
            ========================================== -->

            <div class="tender-ranking">

                <div class="tender-section-heading">

                    <span class="eyebrow">
                        BID RANKING
                    </span>

                    <h4>
                        رتبه‌بندی پیشنهادها
                    </h4>

                </div>


                ${
                    results.length
                        ? results.map(
                            bid => renderTenderBid(
                                bid,
                                tender
                            )
                        ).join("")
                        : `
                            <div class="tender-empty">

                                هنوز پیشنهادی ثبت نشده است.

                            </div>
                        `
                }

            </div>


        </div>

    `;
    container
        .querySelectorAll(
            ".tender-award-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async function() {

                        console.log(
                            "CLICKED BUTTON DATA:",
                            button.outerHTML,
                            button.dataset.bidId
                      );

                      console.log(
                          "CLICKED BUTTON DATA:",
                          button.outerHTML,
                          button.dataset.bidId
                      );


                      const bidId =
                         button.dataset.bidId;


                      try {

    if (
        !confirm(
            "آیا این کارگاه را برای اجرای پروژه انتخاب می‌کنید؟"
        )
    ) {
        return;
    }
console.log(
    "TENDER SELECT REQUEST",
    {
        tender_id: tender.id,
        bid_id: bidId
    }
);
console.log(
    "SELECT BID:",
    bidId,
    "TENDER:",
    tender.id
);

await apiPost(
    `/tenders/${tender.id}/select/`,
    {
        bid_id: Number(bidId)
    }
);

    alert(
        "کارگاه منتخب با موفقیت ثبت شد و برای ادامه فرآیند ارسال می‌شود."
    );

    await loadTenderDashboard(
        projectId
    );

} catch(error) {

    console.error(
        "FEEMAAS: Award failed",
        error
    );

    alert(
        error.message ||
        "خطا در انتخاب برنده."
    );

}

                    }
                );

            }
        );
}


/*
============================================================
 RENDER SINGLE TENDER BID
============================================================
*/

function renderTenderBid(
    bid,
    tender
) {

    console.log(
        "RENDER BID:",
        bid
    );

    return `
<div
            class="tender-bid
                ${
                    bid.rank === 1
                        ? "tender-bid-winner"
                        : ""
                }"
        >


            <div class="tender-bid-rank">

                <span>
                    رتبه
                </span>

                <strong>
                    #${bid.rank}
                </strong>

            </div>


            <div class="tender-bid-main">

                <span class="eyebrow">
                    WORKSHOP
                </span>

                <h4>
                    ${escapeHtml(
                        bid.workshop_name ||
                        "کارگاه نامشخص"
                    )}
                </h4>


                <div class="tender-bid-values">

                    <div>

                        <span>
                            قیمت
                        </span>

                        <strong>
                            ${formatTenderAmount(
                                bid.amount
                            )}
                        </strong>

                        <small>
                            تومان
                        </small>

                    </div>


                    <div>

                        <span>
                            تولید
                        </span>

                        <strong>
                            ${bid.production_days ?? "—"}
                        </strong>

                        <small>
                            روز
                        </small>

                    </div>


                    <div>

                        <span>
                            تحویل
                        </span>

                        <strong>
                            ${bid.delivery_days ?? "—"}
                        </strong>

                        <small>
                            روز
                        </small>

                    </div>


                    <div>

                        <span>
                            گارانتی
                        </span>

                        <strong>
                            ${bid.warranty_months ?? "—"}
                        </strong>

                        <small>
                            ماه
                        </small>

                    </div>


                    <div>

                        <span>
                            امتیاز
                        </span>

                        <strong>
                            ${bid.total_score ?? "—"}
                        </strong>

                        <small>
                            / 100
                        </small>

                    </div>

                </div>


                ${
                    bid.technical_notes
                        ? `
                            <p class="tender-bid-notes">

                                ${escapeHtml(
                                    bid.technical_notes
                                )}

                            </p>
                        `
                        : ""
                }
                ${
                              bid.rank <= 3 &&
                              (
                              tender.status === "revealed" ||
                              tender.status === "awarded"
                              )
                        ? `
                            <button
                                class="tender-award-button"
                                data-bid-id="${bid.bid_id}"
                            >
                               انتخاب این کارگاه 
                            </button>
                        `
                        : ""
                }

            </div>


        </div>

    `;

}


/*
============================================================
 FORMAT TENDER AMOUNT
============================================================
*/

function formatTenderAmount(
    amount
) {

    if (
        amount === null ||
        amount === undefined ||
        amount === ""
    ) {

        return "—";

    }


    const number =
        Number(amount);


    if (
        Number.isNaN(number)
    ) {

        return escapeHtml(
            amount
        );

    }


    return number.toLocaleString(
        "fa-IR"
    );

}
/*
============================================================
 CREATE PROJECT DETAIL VIEW
============================================================
*/

function createProjectDetailView() {

    const content =
        document.querySelector(
            ".content"
        );


    if (!content) {

        console.warn(
            "FEEMAAS: Main content element not found."
        );

        return null;

    }


    const view =
        document.createElement(
            "section"
        );


    view.id =
        "project-detail-view";


    view.className =
        "workspace-view hidden";


    content.appendChild(
        view
    );


    return view;

}


/*
============================================================
 CLOSE PROJECT MODAL
============================================================
*/

function closeProjectModal() {

    const modal =
        document.getElementById(
            "project-modal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "hidden"
    );

}


/*
============================================================
 HTML ESCAPE
============================================================
*/

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}

/*
============================================================
 LOAD PROJECT STANDARDIZATION
============================================================
*/

async function loadProjectStandardization(projectId){

    console.log(
        "PROJECT STANDARDIZATION LOAD:",
        projectId
    );


    try {

        const data =
            await apiGet(
                `/projects/${projectId}/standardization/view/`
            );


        const panel =
            document.getElementById(
                "project-standardization-panel"
            );


        if (!panel) {
            return;
        }


        const items =
            Array.isArray(data.items)
                ? data.items
                : [];


        const globalStatus =
            data.standardization_status || "pending";


        const globalStatusText =
            globalStatus === "approved"
                ? "تایید شده"
                : globalStatus === "revision_requested"
                ? "نیازمند اصلاح"
                : "در انتظار بررسی";


        const globalStatusClass =
            globalStatus === "approved"
                ? "approved"
                : globalStatus === "revision_requested"
                ? "revision"
                : "pending";


        panel.innerHTML = `

            <div class="standardization-customer-header">

                <div>

                    <span class="eyebrow">
                        STANDARDIZATION
                    </span>

                    <h3>
                        استانداردسازی مشاور
                    </h3>

                    <p class="standardization-customer-subtitle">
                        مشخصات فنی و آیتم‌های استانداردشده پروژه
                    </p>

                </div>


                <div class="standardization-customer-status">

                    <span
                        class="
                            standardization-status-dot
                            ${globalStatusClass}
                        "
                    ></span>

                    ${globalStatusText}

                </div>

            </div>


            <div class="standardization-customer-review-timer">

                <span class="timer-icon">
                    ◷
                </span>

                <span>
                    زمان بررسی مشتری:
                </span>

                <strong>
                    60 دقیقه
                </strong>

            </div>


            ${
                items.length

                ?

                `

                <div class="standardization-customer-table-wrapper">

                    <div class="standardization-customer-table">

                        <div class="standardization-customer-head">

                            <div>
                                #
                            </div>

                            <div>
                                نام آیتم
                            </div>

                            <div>
                                تعداد
                            </div>

                            <div>
                                ابعاد
                            </div>

                            <div>
                                متریال
                            </div>

                            <div>
                                مشخصات فنی
                            </div>

                            <div>
                                فایل
                            </div>

                            <div>
                                وضعیت
                            </div>

                            <div>
                                بررسی
                            </div>

                        </div>


                        <div class="standardization-customer-body">

                            ${
                                items.map(
                                    (item, index) => {

                                        const name =
                                            item.name ||
                                            item.title ||
                                            "-";


                                        const quantity =
                                            item.quantity ??
                                            "-";


                                        const dimensions =
                                            item.dimensions ||
                                            "-";


                                        const material =
                                            item.material ||
                                            "-";


                                        const technicalDetails =
                                            item.technical_details ||
                                            item.description ||
                                            "-";


                                        const files =
                                            Array.isArray(
                                                item.files
                                            )
                                                ? item.files
                                                : [];


                                        const reviewStatus =
                                            item.customer_review_status ||
                                            "pending";


                                        let statusText =
                                            "در انتظار";


                                        let statusClass =
                                            "pending";


                                        if (
                                            reviewStatus ===
                                            "approved"
                                        ) {

                                            statusText =
                                                "تایید مشتری";

                                            statusClass =
                                                "approved";

                                        }
                                        else if (
                                            reviewStatus ===
                                            "revise"
                                        ) {

                                            statusText =
                                                "نیاز به اصلاح";

                                            statusClass =
                                                "revision";

                                        }


                                        return `

                                            <div
                                                class="standardization-customer-row"
                                                data-standardization-row="${item.id}"
                                            >

                                                <div
                                                    class="standardization-customer-number"
                                                >
                                                    ${String(
                                                        index + 1
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </div>


                                                <div
                                                    class="standardization-customer-name"
                                                >
                                                    ${escapeHtml(
                                                        String(name)
                                                    )}
                                                </div>


                                                <div>
                                                    ${escapeHtml(
                                                        String(quantity)
                                                    )}
                                                </div>


                                                <div>
                                                    ${escapeHtml(
                                                        String(dimensions)
                                                    )}
                                                </div>


                                                <div>
                                                    ${escapeHtml(
                                                        String(material)
                                                    )}
                                                </div>


                                                <div
                                                    class="standardization-customer-technical"
                                                >
                                                    ${escapeHtml(
                                                        String(technicalDetails)
                                                    )}
                                                </div>


                                                <div
                                                    class="standardization-customer-files"
                                                >

                                                    ${
                                                        files.length

                                                        ?

                                                        `

                                                        <button
                                                            type="button"
                                                            class="standardization-customer-file-button"
                                                            title="مشاهده فایل‌ها"
                                                            data-standardization-files
                                                            data-files='${escapeHtml(
                                                                JSON.stringify(
                                                                    files
                                                                )
                                                            )}'
                                                        >
                                                            📎
                                                            <span>
                                                                ${files.length}
                                                            </span>
                                                        </button>

                                                        `

                                                        :

                                                        `

                                                        <span class="standardization-customer-no-file">
                                                            —
                                                        </span>

                                                        `
                                                    }

                                                </div>


                                                <div>

                                                    <span
                                                        class="
                                                            standardization-customer-status-badge
                                                            ${statusClass}
                                                        "
                                                    >
                                                        ${statusText}
                                                    </span>

                                                </div>


                                                <div
                                                    class="standardization-customer-review-actions"
                                                >

                                                    <button
                                                        type="button"
                                                        class="standardization-row-review-button approve"
                                                        data-specification-review="approved"
                                                        data-specification-id="${item.id}"
                                                    >
                                                        ✓ تایید
                                                    </button>


                                                    <button
                                                        type="button"
                                                        class="standardization-row-review-button revise"
                                                        data-specification-review="revise"
                                                        data-specification-id="${item.id}"
                                                    >
                                                        ↻ درخواست اصلاح
                                                    </button>

                                                </div>

                                            </div>

                                        `;

                                    }
                                ).join("")
                            }

                        </div>

                    </div>

                </div>


                <div class="standardization-customer-global-review">

                    <div class="standardization-customer-global-review-header">

                        <div>

                            <span class="eyebrow">
                                GLOBAL REVIEW
                            </span>

                            <h4>
                                بررسی کلی استانداردسازی
                            </h4>

                            <p>
                                این بخش مربوط به تایید یا درخواست اصلاح
                                کل استانداردسازی پروژه است.
                            </p>

                        </div>


                        <span
                            class="
                                standardization-customer-global-status
                                ${globalStatusClass}
                            "
                        >
                            ${globalStatusText}
                        </span>

                    </div>


                    <div class="standardization-customer-global-actions">

                        <button
                            type="button"
                            class="approve-standardization"
                            data-project-standardization-action="approve"
                        >
                            ✓ تایید کل استانداردسازی
                        </button>


                        <button
                            type="button"
                            class="edit-standardization"
                            data-project-standardization-action="revise"
                        >
                            ↻ درخواست اصلاح کل استانداردسازی
                        </button>

                    </div>

                </div>

                `

                :

                `

                <div class="standardization-customer-empty">

                    <div class="standardization-empty-icon">
                        ◌
                    </div>

                    <h4>
                        هنوز استانداردسازی ثبت نشده است
                    </h4>

                    <p>
                        پس از ارسال استانداردسازی توسط مشاور،
                        مشخصات اینجا نمایش داده می‌شود.
                    </p>

                </div>

                `

            }

        `;


        /*
        ----------------------------------------------------
        CUSTOMER STANDARDIZATION ROW REVIEW
        ----------------------------------------------------
        */

        panel
            .querySelectorAll(
                "[data-specification-review]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async function(){

                            const specificationId =
                                this.dataset.specificationId;


                            const status =
                                this.dataset.specificationReview;


                            if (!specificationId || !status) {
                                return;
                            }


                            const buttons =
                                panel.querySelectorAll(
                                    `[data-specification-id="${specificationId}"]`
                                );


                            buttons.forEach(
                                actionButton => {
                                    actionButton.disabled = true;
                                }
                            );


                            try {

                                await apiPost(
                                    `/projects/specifications/${specificationId}/standardization/review/`,
                                    {
                                        status: status
                                    }
                                );


                                await loadProjectStandardization(
                                    projectId
                                );

                            }
                            catch(error){

                                console.error(
                                    "STANDARDIZATION ROW REVIEW ERROR",
                                    error
                                );

                                buttons.forEach(
                                    actionButton => {
                                        actionButton.disabled = false;
                                    }
                                );

                            }

                        }
                    );

                }
            );


        /*
        ----------------------------------------------------
        CUSTOMER STANDARDIZATION GLOBAL REVIEW
        ----------------------------------------------------
        */

        panel
            .querySelectorAll(
                "[data-project-standardization-action]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async function(){

                            const action =
                                this.dataset
                                    .projectStandardizationAction;


                            const status =
                                action === "approve"
                                    ? "approved"
                                    : "revision_requested";


                            const actionButtons =
                                panel.querySelectorAll(
                                    "[data-project-standardization-action]"
                                );


                            actionButtons.forEach(
                                actionButton => {
                                    actionButton.disabled = true;
                                }
                            );


                            try {

                                await apiPost(
                                    `/projects/${projectId}/standardization/global-review/`,
                                    {
                                        status: status
                                    }
                                );


                                await loadProjectStandardization(
                                    projectId
                                );

                            }
                            catch(error){

                                console.error(
                                    "STANDARDIZATION GLOBAL REVIEW ERROR",
                                    error
                                );

                                actionButtons.forEach(
                                    actionButton => {
                                        actionButton.disabled = false;
                                    }
                                );

                            }

                        }
                    );

                }
            );


        /*
        ----------------------------------------------------
        CUSTOMER STANDARDIZATION FILE BUTTONS
        ----------------------------------------------------
        */

        panel
            .querySelectorAll(
                "[data-standardization-files]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function(){

                            let files = [];


                            try {

                                files =
                                    JSON.parse(
                                        this.dataset.files
                                    );

                            }
                            catch(error){

                                console.error(
                                    "STANDARDIZATION FILE DATA ERROR",
                                    error
                                );

                            }


                            if (!files.length) {
                                return;
                            }


                            const firstFile =
                                files[0];


                            const fileUrl =
                                firstFile.file ||
                                firstFile.url ||
                                "";


                            if (fileUrl) {

                                window.open(
                                    fileUrl,
                                    "_blank"
                                );

                            }

                        }
                    );

                }
            );

    }
    catch(error){

        console.error(
            "STANDARDIZATION LOAD ERROR",
            error
        );


        const panel =
            document.getElementById(
                "project-standardization-panel"
            );


        if (panel) {

            panel.innerHTML = `

                <div class="standardization-customer-error">

                    خطا در دریافت استانداردسازی پروژه.

                </div>

            `;

        }

    }

}
/* =========================================================
   FILE CENTER — UPLOAD
========================================================= */

function uploadProjectFileCenterFile(
    projectId,
    file,
    onProgress
){

    return new Promise(
        function(resolve, reject){

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


            const xhr =
                new XMLHttpRequest();


            xhr.open(
                "POST",
                `/api/projects/${projectId}/attachments/`,
                true
            );


            xhr.withCredentials =
                true;


            const csrfToken =
                getCookie(
                    "csrftoken"
                );


            if(csrfToken){

                xhr.setRequestHeader(
                    "X-CSRFToken",
                    csrfToken
                );

            }


            xhr.upload.addEventListener(
                "progress",
                function(event){

                    if(
                        !event.lengthComputable
                    ){
                        return;
                    }


                    const percent =
                        Math.round(
                            (
                                event.loaded /
                                event.total
                            ) * 100
                        );


                    if(
                        typeof onProgress ===
                        "function"
                    ){

                        onProgress(
                            percent
                        );

                    }

                }
            );


            xhr.addEventListener(
                "load",
                function(){

                    if(
                        xhr.status >= 200 &&
                        xhr.status < 300
                    ){

                        let responseData = {};


                        try{

                            responseData =
                                xhr.responseText
                                    ? JSON.parse(
                                        xhr.responseText
                                    )
                                    : {};

                        }
                        catch(error){

                            responseData = {};

                        }


                        resolve(
                            responseData
                        );

                        return;

                    }


                    let detail =
                        "خطا در آپلود فایل.";


                    try{

                        const response =
                            JSON.parse(
                                xhr.responseText
                            );


                        detail =
                            response.detail ||
                            response.error ||
                            detail;

                    }
                    catch(error){

                        /* Ignore invalid JSON */

                    }


                    reject(
                        new Error(
                            detail
                        )
                    );

                }
            );


            xhr.addEventListener(
                "error",
                function(){

                    reject(
                        new Error(
                            "ارتباط با سرور هنگام آپلود فایل قطع شد."
                        )
                    );

                }
            );


            xhr.addEventListener(
                "abort",
                function(){

                    reject(
                        new Error(
                            "آپلود فایل لغو شد."
                        )
                    );

                }
            );


            xhr.send(
                formData
            );

        }
    );

}
/*
============================================================
 LOAD PROJECT FILE CENTER
============================================================
*/

async function loadProjectFiles(projectId){

    console.log("FEEMAAS FILE CENTER: loadProjectFiles START", projectId);

    const container =
        document.getElementById(
            "project-files-panel"
        );


    if(!container){

        console.warn(
            "FEEMAAS: Project files panel not found."
        );

        return;

    }


    container.innerHTML = `

        <div class="tender-loading">

            در حال دریافت فایل‌ها...

        </div>

    `;


    try {

        const data =
            await apiGet(
                `/projects/${projectId}/files/`
            );


        console.log("FEEMAAS FILE CENTER: API DATA", data);

        renderProjectFileCenter(
            container,
            data,
            projectId
        );

        console.log("FEEMAAS FILE CENTER: RENDER COMPLETE");


    } catch(error){

        console.error(
            "FEEMAAS FILE CENTER ERROR",
            error
        );


        container.innerHTML = `

            <div class="project-tab-panel">

                خطا در دریافت فایل‌ها

            </div>

        `;

    }

}
function renderProjectFileCenter(
    container,
    files,
    projectId
){

    const roles = [

        {
            key: "customer",
            title: "مشتری",
            icon: "👤",
            accent: "customer"
        },

        {
            key: "consultant",
            title: "مشاور",
            icon: "✦",
            accent: "consultant"
        },

        {
            key: "workshop",
            title: "کارگاه",
            icon: "🏭",
            accent: "workshop"
        },

        {
            key: "designer",
            title: "طراح",
            icon: "◆",
            accent: "designer"
        },

        {
            key: "company",
            title: "FEEMAAS",
            icon: "⚙",
            accent: "company"
        }

    ];


    const allFiles = roles.flatMap(
        role => files[role.key] || []
    );


    function getExtension(file){

        const source =
            file.file ||
            file.title ||
            "";

        const clean =
            source
                .split("?")[0]
                .split("#")[0];

        const parts =
            clean
                .split(".")
                .filter(Boolean);

        return parts.length
            ? parts.pop().toLowerCase()
            : "";

    }


    function getFileKind(file){

        const extension =
            getExtension(file);


        if(
            file.file_type === "image" ||
            [
                "jpg",
                "jpeg",
                "png",
                "gif",
                "webp",
                "bmp",
                "svg"
            ].includes(extension)
        ){

            return "image";

        }


        if(
            extension === "pdf" ||
            file.file_type === "document"
        ){

            return "document";

        }


        if(
            [
                "dwg",
                "dxf",
                "step",
                "stp",
                "iges",
                "igs",
                "skp",
                "obj",
                "fbx"
            ].includes(extension) ||
            file.file_type === "design"
        ){

            return "design";

        }


        if(
            [
                "doc",
                "docx",
                "xls",
                "xlsx",
                "ppt",
                "pptx",
                "txt",
                "csv"
            ].includes(extension)
        ){

            return "document";

        }


        return "other";

    }


    function getKindLabel(kind, extension){

        if(kind === "image"){
            return extension
                ? extension.toUpperCase()
                : "IMAGE";
        }


        if(kind === "document"){

            return extension === "pdf"
                ? "PDF"
                : extension
                    ? extension.toUpperCase()
                    : "DOC";

        }


        if(kind === "design"){

            return extension
                ? extension.toUpperCase()
                : "CAD";

        }


        return extension
            ? extension.toUpperCase()
            : "FILE";

    }


    function getKindIcon(kind){

        if(kind === "image"){
            return "▧";
        }


        if(kind === "document"){
            return "▤";
        }


        if(kind === "design"){
            return "◇";
        }


        return "◆";

    }


    function escapeHtml(value){

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    function getFileTitle(file){

        return (
            file.title ||
            file.specification_title ||
            "بدون عنوان"
        );

    }


    function getFileMeta(file){

        const extension =
            getExtension(file);

        const kind =
            getFileKind(file);

        const label =
            getKindLabel(
                kind,
                extension
            );


        const source =
            file.source === "standardization"
                ? "استانداردسازی مشاور"
                : `نسخه ${file.version || 1}`;


        return `${label} · ${source}`;

    }


    function renderFileCard(
        file,
        role,
        index
    ){

        const kind =
            getFileKind(file);

        const extension =
            getExtension(file);

        const title =
            getFileTitle(file);

        const label =
            getKindLabel(
                kind,
                extension
            );

        const fileUrl =
            file.file || "";

        const isImage =
            kind === "image";

        const source =
            file.source === "standardization"
                ? "مشاور"
                : `نسخه ${file.version || 1}`;


        const previewMarkup =
            isImage && fileUrl

                ? `

                    <img
                        class="project-file-card-preview-image"
                        src="${escapeHtml(fileUrl)}"
                        alt="${escapeHtml(title)}"
                        loading="lazy"
                    >

                    <span
                        class="project-file-card-preview-overlay"
                        aria-hidden="true"
                    >
                        <span
                            class="project-file-card-preview-eye"
                        >
                            <span
                                class="project-file-card-preview-pupil"
                            ></span>
                        </span>
                    </span>

                `

                : `

                    <span
                        class="
                            project-file-card-type
                            project-file-card-type-${kind}
                        "
                    >

                        <span
                            class="project-file-card-type-icon"
                        >
                            ${escapeHtml(label)}
                        </span>

                    </span>

                `;


        return `

            <article
                class="
                    project-file-card
                    project-file-card-${kind}
                "
                data-file-id="${escapeHtml(file.id)}"
                data-project-id="${escapeHtml(projectId)}"
                data-role="${escapeHtml(role.key)}"
                data-file-url="${escapeHtml(fileUrl)}"
                data-file-title="${escapeHtml(title)}"
                data-file-kind="${escapeHtml(kind)}"
                data-file-extension="${escapeHtml(extension)}"
            >

                <button
                    type="button"
                    class="project-file-card-delete"
                    title="حذف فایل"
                    aria-label="حذف فایل"
                >
                    ×
                </button>


                <button
                    type="button"
                    class="project-file-card-preview"
                    title="مشاهده فایل"
                    aria-label="مشاهده فایل"
                >

                    <span
                        class="project-file-card-visual"
                    >

                        ${previewMarkup}

                    </span>

                </button>


                <div
                    class="project-file-card-body"
                >

                    <div
                        class="project-file-card-title"
                        title="${escapeHtml(title)}"
                    >
                        ${escapeHtml(title)}
                    </div>


                    <div
                        class="project-file-card-meta"
                    >

                        <span>
                            ${escapeHtml(label)}
                        </span>

                        <span
                            class="project-file-card-dot"
                        >
                            ·
                        </span>

                        <span>
                            ${escapeHtml(source)}
                        </span>

                    </div>

                </div>

            </article>

        `;

    }


    container.innerHTML = `

        <div
            class="project-files-center"
            data-project-id="${escapeHtml(projectId)}"
        >

            <header
                class="project-files-center-head"
            >

                <div
                    class="project-files-center-heading"
                >

                    <span
                        class="project-files-eyebrow"
                    >
                        PROJECT FILE CENTER
                    </span>


                    <h3>
                        فایل‌های پروژه
                        <span
                            class="project-files-total"
                        >
                            ${allFiles.length}
                        </span>
                    </h3>


                    <p>
                        فایل‌های پروژه در فضای اختصاصی هر نقش نگهداری می‌شوند.
                    </p>

                </div>


                <button
                    type="button"
                    class="project-files-add-button"
                    title="افزودن فایل"
                >

                    <span>
                        +
                    </span>

                    افزودن فایل

                </button>

            </header>


            <div
                class="project-files-toolbar"
            >

                <div
                    class="project-files-search"
                >

                    <span
                        class="project-files-search-icon"
                    >
                        ⌕
                    </span>

                    <input
                        type="search"
                        class="project-files-search-input"
                        placeholder="جستجو در فایل‌ها..."
                        autocomplete="off"
                    >

                </div>


                <div
                    class="project-files-filters"
                    role="tablist"
                >

                    <button
                        type="button"
                        class="
                            project-files-filter
                            is-active
                        "
                        data-file-filter="all"
                    >
                        همه
                    </button>


                    <button
                        type="button"
                        class="project-files-filter"
                        data-file-filter="image"
                    >
                        تصاویر
                    </button>


                    <button
                        type="button"
                        class="project-files-filter"
                        data-file-filter="document"
                    >
                        اسناد
                    </button>


                    <button
                        type="button"
                        class="project-files-filter"
                        data-file-filter="design"
                    >
                        طراحی
                    </button>

                </div>

            </div>


            <div
                class="project-files-empty-search hidden"
            >

                <span>
                    ⌕
                </span>

                <strong>
                    فایلی پیدا نشد
                </strong>

                <small>
                    عبارت جستجو یا فیلتر انتخابی را تغییر دهید.
                </small>

            </div>


            <div
                class="project-files-role-grid"
            >

                ${roles.map(role => {

                    const items =
                        files[role.key] || [];


                    return `

                        <section
                            class="
                                project-file-role-card
                                project-file-role-${role.accent}
                            "
                            data-role-section="${escapeHtml(role.key)}"
                        >

                            <header
                                class="project-file-role-header"
                            >

                                <div
                                    class="project-file-role-title"
                                >

                                    <span
                                        class="project-file-role-icon"
                                    >
                                        ${role.icon}
                                    </span>


                                    <div>

                                        <strong>
                                            ${role.title}
                                        </strong>

                                        <small>
                                            ${items.length
                                                ? `${items.length} فایل`
                                                : "فایلی ثبت نشده"}
                                        </small>

                                    </div>

                                </div>


                                <span
                                    class="
                                        project-file-role-count
                                        ${items.length
                                            ? "has-files"
                                            : ""}
                                    "
                                >
                                    ${String(items.length).padStart(2, "0")}
                                </span>

                            </header>


                            <div
                                class="project-file-grid"
                            >

                                ${
                                    items.length

                                    ?

                                    items.map(
                                        (file, index) =>
                                            renderFileCard(
                                                file,
                                                role,
                                                index
                                            )
                                    ).join("")

                                    :

                                    `

                                        <div
                                            class="project-file-empty"
                                        >

                                            <span>
                                                +
                                            </span>

                                            <small>
                                                هنوز فایلی برای این بخش ثبت نشده
                                            </small>

                                        </div>

                                    `
                                }

                            </div>

                        </section>

                    `;

                }).join("")}

            </div>

        </div>

    `;


    /*
    ---------------------------------------------------------
    FILE CENTER — SEARCH
    ---------------------------------------------------------
    */

    const searchInput =
        container.querySelector(
            ".project-files-search-input"
        );


    const filterButtons =
        container.querySelectorAll(
            ".project-files-filter"
        );


    const emptySearch =
        container.querySelector(
            ".project-files-empty-search"
        );


    const fileCards =
        Array.from(
            container.querySelectorAll(
                ".project-file-card"
            )
        );


    function applyFileFilters(){

        const query =
            (
                searchInput
                    ? searchInput.value
                    : ""
            )
                .trim()
                .toLowerCase();


        const activeFilterButton =
            container.querySelector(
                ".project-files-filter.is-active"
            );


        const activeFilter =
            activeFilterButton
                ? activeFilterButton.dataset.fileFilter
                : "all";


        let visibleCount = 0;


        fileCards.forEach(card => {

            const title =
                (
                    card.dataset.fileTitle || ""
                ).toLowerCase();


            const extension =
                (
                    card.dataset.fileExtension || ""
                ).toLowerCase();


            const kind =
                card.dataset.fileKind || "other";


            const matchesSearch =
                !query ||
                title.includes(query) ||
                extension.includes(query);


            const matchesFilter =
                activeFilter === "all" ||
                kind === activeFilter;


            const visible =
                matchesSearch &&
                matchesFilter;


            card.classList.toggle(
                "is-filtered-out",
                !visible
            );


            if(visible){
                visibleCount++;
            }

        });


        container
            .querySelectorAll(
                ".project-file-role-card"
            )
            .forEach(section => {

                const visibleCards =
                    section.querySelectorAll(
                        ".project-file-card:not(.is-filtered-out)"
                    );


                const emptyState =
                    section.querySelector(
                        ".project-file-empty"
                    );


                if(
                    emptyState &&
                    fileCards.length
                ){
                    emptyState.classList.add(
                        "is-filter-context"
                    );
                }


                section.classList.toggle(
                    "is-filter-empty",
                    visibleCards.length === 0
                );

            });


        if(emptySearch){

            emptySearch.classList.toggle(
                "hidden",
                visibleCount !== 0
            );

        }

    }


    if(searchInput){

        searchInput.addEventListener(
            "input",
            applyFileFilters
        );

    }


    filterButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                function(){

                    filterButtons.forEach(
                        item =>
                            item.classList.remove(
                                "is-active"
                            )
                    );


                    this.classList.add(
                        "is-active"
                    );


                    applyFileFilters();

                }
            );

        }
    );


    /*
    ---------------------------------------------------------
    FILE CENTER — PREVIEW + DELETE HOOK
    ---------------------------------------------------------
    */

    container
        .querySelectorAll(
            ".project-file-card-preview"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function(event){

                        event.preventDefault();
                        event.stopPropagation();

                        const card =
                            this.closest(
                                ".project-file-card"
                            );

                        if(!card){
                            return;
                        }

                        openProjectFileCenterPreview({
                            url: card.dataset.fileUrl || "",
                            title: card.dataset.fileTitle || "فایل",
                            kind: card.dataset.fileKind || "other",
                            extension: card.dataset.fileExtension || "",
                            projectId: card.dataset.projectId || "",
                            fileId: card.dataset.fileId || ""
                        });

                    }
                );

            }
        );


    container
        .querySelectorAll(
            ".project-file-card-delete"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async function(event){

                        event.preventDefault();
                        event.stopPropagation();

                        const card =
                            this.closest(
                                ".project-file-card"
                            );

                        if(!card){
                            return;
                        }

                        const fileId =
                            card.dataset.fileId || "";

                        const projectId =
                            card.dataset.projectId || "";

                        const title =
                            card.dataset.fileTitle || "این فایل";

                        if(!fileId || !projectId){
                            return;
                        }

                        const confirmed =
                            window.confirm(
                                `آیا از حذف «${title}» مطمئن هستید؟`
                            );

                        if(!confirmed){
                            return;
                        }

                        button.disabled = true;
                        button.classList.add("is-deleting");

                        try {

                            const csrfToken =
                                typeof getCookie === "function"
                                    ? getCookie("csrftoken")
                                    : null;

                            const response =
							    await fetch(
						            `/api/projects/${projectId}/attachments/${fileId}/delete/`,
					                {
						                method: "DELETE",
					                    credentials: "include",

						                headers: csrfToken
						                    ? {
						                        "X-CSRFToken":
						                            csrfToken
					                        }
				                            : {}
					               	}
			                    );

                            if(!response.ok){

                                let detail = "";

                                try {
                                    const data =
                                        await response.json();

                                    detail =
                                        data.detail ||
                                        data.error ||
                                        "";
                                } catch(e) {}

                                if(response.status === 403){
                                    throw new Error(
                                        "شما اجازه حذف این فایل را ندارید."
                                    );
                                }

                                if(response.status === 404){
                                    throw new Error(
                                        "فایل پیدا نشد یا قبلاً حذف شده است."
                                    );
                                }

                                throw new Error(
                                    detail ||
                                    `حذف فایل ناموفق بود. (${response.status})`
                                );

                            }

                            const projectFilesContainer =
                                container;

                            await loadProjectFiles(
                                projectId
                            );

                            console.info(
                                "FEEMAAS: File deleted successfully.",
                                fileId
                            );

                        } catch(error){

                            console.error(
                                "FEEMAAS FILE DELETE ERROR",
                                error
                            );

                            alert(
                                error.message ||
                                "حذف فایل انجام نشد."
                            );

                            button.disabled = false;
                            button.classList.remove(
                                "is-deleting"
                            );

                        }

                    }
                );

            }
        );

/*
---------------------------------------------------------
FILE CENTER — ADD FILE HOOK
---------------------------------------------------------
*/

const addButton =
    container.querySelector(
        ".project-files-add-button"
    );


if(addButton){

    addButton.addEventListener(
        "click",
        function(){

            let fileInput =
                document.getElementById(
                    "project-file-center-input"
                );


            if(!fileInput){

                fileInput =
                    document.createElement(
                        "input"
                    );

                fileInput.type =
                    "file";

                fileInput.id =
                    "project-file-center-input";

                fileInput.multiple =
                    true;

                fileInput.hidden =
                    true;

                document.body.appendChild(
                    fileInput
                );

            }


            if(
                !fileInput.dataset.bound
            ){

                fileInput.dataset.bound =
                    "true";


                fileInput.addEventListener(
                    "change",
                    async function(event){

                        const files =
                            Array.from(
                                event.target.files || []
                            );


                        if(!files.length){

                            return;

                        }


                        event.target.value =
                            "";


                        for(
                            const file of files
                        ){
                          const uploadId =
    "upload-" + Date.now();


const uploadBox =
    document.createElement("div");


uploadBox.id =
    uploadId;


uploadBox.className =
    "project-file-upload-progress";


uploadBox.innerHTML = `

    <div class="project-file-upload-name">
        ${file.name}
    </div>

    <div class="project-file-upload-bar">
        <span></span>
    </div>

    <div class="project-file-upload-percent">
        0%
    </div>

`;

container.prepend(
    uploadBox
);


try {

    await uploadProjectFileCenterFile(
        projectId,
        file,
        function(percent){

            const box =
                document.getElementById(
                    uploadId
                );


            if(!box){
                return;
            }


            const bar =
                box.querySelector(
                    ".project-file-upload-bar span"
                );


            const text =
                box.querySelector(
                    ".project-file-upload-percent"
                );


            if(bar){

                bar.style.width =
                    percent + "%";

            }


            if(text){

                text.textContent =
                    percent + "%";

            }

        }
    );


    const box =
        document.getElementById(
            uploadId
        );


    if(box){

        box.classList.add(
            "upload-complete"
        );


        const percent =
            box.querySelector(
                ".project-file-upload-percent"
            );


        if(percent){

            percent.textContent =
                "✓";

        }


        setTimeout(
            function(){

                box.remove();

            },
            800
        );

    }


}
catch(error){

    console.error(
        "FEEMAAS FILE CENTER UPLOAD ERROR",
        error
    );


    const box =
        document.getElementById(
            uploadId
        );


    if(box){

        box.classList.add(
            "upload-error"
        );

    }


    alert(
        `خطا در آپلود «${file.name}»:\n${error.message}`
    );

}
                        
                        }


                        await loadProjectFiles(
                            projectId
                        );

                    }
                );

            }


            fileInput.click();

        }
    );

}

}
/*
============================================================
 PROJECT FILE CENTER PREVIEW MODAL
============================================================
*/

function openProjectFileCenterPreview(file){

    if(!file || !file.url){
        return;
    }

    closeProjectFileCenterPreview();

    const extension =
        (file.extension || "")
            .toLowerCase();

    const isImage =
        file.kind === "image" ||
        [
            "jpg",
            "jpeg",
            "png",
            "gif",
            "webp",
            "bmp",
            "svg"
        ].includes(extension);

    const isPdf =
        extension === "pdf";

    const isText =
        [
            "txt",
            "csv",
            "rtf"
        ].includes(extension);

    let content = "";

    if(isImage){

        content = `
            <div class="project-file-center-preview-image-wrap">
                <img
                    src="${escapeHtml(file.url)}"
                    alt="${escapeHtml(file.title)}"
                    class="project-file-center-preview-image"
                >
            </div>
        `;

    } else if(isPdf){

        content = `
            <iframe
                class="project-file-center-preview-frame"
                src="${escapeHtml(file.url)}"
                title="${escapeHtml(file.title)}"
            ></iframe>
        `;

    } else if(isText){

        content = `
            <div
                class="project-file-center-preview-text"
                data-preview-text-url="${escapeHtml(file.url)}"
            >
                در حال دریافت محتوای فایل...
            </div>
        `;

    } else {

        content = `
            <div class="project-file-center-preview-generic">

                <div class="project-file-center-preview-generic-icon">
                    ${getFileCenterPreviewIcon(extension)}
                </div>

                <strong>
                    ${escapeHtml(file.title)}
                </strong>

                <span>
                    ${escapeHtml(
                        extension
                            ? extension.toUpperCase()
                            : "FILE"
                    )}
                </span>

                <a
                    class="project-file-center-preview-download"
                    href="${escapeHtml(file.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                >
                    دانلود فایل
                </a>

            </div>
        `;

    }

    const modal =
        document.createElement("div");

    modal.id =
        "project-file-center-preview-modal";

    modal.className =
        "project-file-center-preview-modal";

    modal.innerHTML = `

        <div
            class="project-file-center-preview-backdrop"
            data-preview-close="true"
        ></div>

        <section
            class="project-file-center-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="پیش‌نمایش فایل"
        >

            <header
                class="project-file-center-preview-header"
            >

                <div
                    class="project-file-center-preview-heading"
                >

                    <span>
                        FILE PREVIEW
                    </span>

                    <strong
                        title="${escapeHtml(file.title)}"
                    >
                        ${escapeHtml(file.title)}
                    </strong>

                </div>

                <button
                    type="button"
                    class="project-file-center-preview-close"
                    aria-label="بستن"
                    title="بستن"
                >
                    ×
                </button>

            </header>

            <div
                class="project-file-center-preview-content"
            >
                ${content}
            </div>

        </section>

    `;

    document.body.appendChild(modal);

    const closeButton =
        modal.querySelector(
            ".project-file-center-preview-close"
        );

    if(closeButton){

        closeButton.addEventListener(
            "click",
            closeProjectFileCenterPreview
        );

    }

    modal.addEventListener(
        "click",
        function(event){

            if(
                event.target.dataset.previewClose === "true"
            ){
                closeProjectFileCenterPreview();
            }

        }
    );

    document.addEventListener(
        "keydown",
        projectFileCenterPreviewEscapeHandler
    );

    document.body.classList.add(
        "project-file-center-preview-open"
    );

    requestAnimationFrame(
        function(){
            modal.classList.add("is-open");
        }
    );


    if(isText){

        const textContainer =
            modal.querySelector(
                ".project-file-center-preview-text"
            );

        if(textContainer){

            fetch(
                file.url,
                {
                    credentials: "include"
                }
            )
                .then(
                    response => {

                        if(!response.ok){
                            throw new Error(
                                "Unable to read file."
                            );
                        }

                        return response.text();

                    }
                )
                .then(
                    text => {

                        textContainer.textContent =
                            text;

                    }
                )
                .catch(
                    function(){

                        textContainer.textContent =
                            "امکان نمایش محتوای این فایل وجود ندارد.";

                    }
                );

        }

    }

}


function closeProjectFileCenterPreview(){

    const modal =
        document.getElementById(
            "project-file-center-preview-modal"
        );

    if(!modal){
        return;
    }

    modal.classList.remove("is-open");

    setTimeout(
        function(){

            if(modal.parentNode){
                modal.parentNode.removeChild(modal);
            }

        },
        160
    );

    document.body.classList.remove(
        "project-file-center-preview-open"
    );

    document.removeEventListener(
        "keydown",
        projectFileCenterPreviewEscapeHandler
    );

}


function projectFileCenterPreviewEscapeHandler(event){

    if(event.key === "Escape"){

        closeProjectFileCenterPreview();

    }

}


function getFileCenterPreviewIcon(extension){

    const icons = {
        pdf: "PDF",
        doc: "DOC",
        docx: "DOC",
        xls: "XLS",
        xlsx: "XLS",
        csv: "CSV",
        dwg: "CAD",
        dxf: "CAD",
        step: "3D",
        stp: "3D",
        skp: "3D",
        zip: "ZIP",
        rar: "RAR"
    };

    return icons[extension] || "FILE";

}


/*
============================================================
 PROJECT SUMMARY MODAL CLOSE
============================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const modal =
            document.getElementById(
                "project-modal"
            );

        const closeButton =
            document.getElementById(
                "close-project-modal"
            );


        if (!modal || !closeButton) {
            return;
        }


        function closeProjectSummary() {

            modal.classList.remove(
                "active"
            );

            modal.classList.add(
                "hidden"
            );

        }


        closeButton.addEventListener(
            "click",
            closeProjectSummary
        );


        const backdrop =
            modal.querySelector(
                ".modal-backdrop"
            );


        if (backdrop) {

            backdrop.addEventListener(
                "click",
                closeProjectSummary
            );

        }


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape" &&
                    !modal.classList.contains("hidden")
                ) {

                    closeProjectSummary();

                }

            }
        );

    }
);
