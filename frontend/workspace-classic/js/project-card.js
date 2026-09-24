/*
============================================================
 FEEMAAS PROJECT CARD
 Card -> Summary Modal -> Project Detail
============================================================
*/


/*
============================================================
 CREATE PROJECT CARD
============================================================
*/

function createProjectCard(project) {

    const div =
        document.createElement("div");


    div.className =
        "project-card";


    div.dataset.projectId =
        project.id;


    div.innerHTML = `

        <div class="project-card-header">

            <div class="project-card-title">

                <span class="eyebrow">
                    PROJECT #${project.id}
                </span>

                <h3>
                    ${escapeHtml(
                        project.title ||
                        "بدون عنوان"
                    )}
                </h3>

            </div>


            <span class="project-status">

                ${escapeHtml(
                    project.status ||
                    "نامشخص"
                )}

            </span>

        </div>


        <div class="project-description">

            ${escapeHtml(
                project.description ||
                "بدون توضیحات"
            )}

        </div>


        <div class="project-card-footer">

            <button
                type="button"
                class="project-details-button"
                data-project-id="${project.id}"
            >
                مشاهده جزئیات
            </button>

            <span class="project-arrow">
                ←
            </span>

        </div>

    `;


    /*
    --------------------------------------------------------
    CARD CLICK
    --------------------------------------------------------
    */

    div.addEventListener(
        "click",
        function(event) {

            if (
                event.target.closest(
                    ".project-details-button"
                )
            ) {

                return;

            }


            showProject(project);

        }
    );


    /*
    --------------------------------------------------------
    DETAILS BUTTON
    --------------------------------------------------------
    */

    const detailsButton =
        div.querySelector(
            ".project-details-button"
        );


    if (detailsButton) {

        detailsButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                event.stopPropagation();


                openProjectDetail(
                    project
                );

            }
        );

    }


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
                        project.status ||
                        "نامشخص"
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
                        وضعیت
                    </span>

                    <strong>
                        ${escapeHtml(
                            project.status ||
                            "—"
                        )}
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


            const confirmed =
                confirm(
                    "آیا پروژه برای مشاور ارسال شود؟"
                );


            if (!confirmed) {
                return;
            }


            try {

                await apiPost(
                    `/projects/${project.id}/send-to-consultant/`,
                    {}
                );


                alert(
                    "پروژه با موفقیت برای مشاور ارسال شد"
                );


                location.reload();


            }
            catch(error) {


                console.error(
                    error
                );


                alert(
                    "خطا در ارسال پروژه به مشاور"
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

    projectView.innerHTML = `

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

                    <span class="eyebrow">
                        PROJECT STATUS
                    </span>

                    <h3>
                        وضعیت پروژه
                    </h3>

                </div>


                <span class="project-status">

                    ${escapeHtml(
                        project.status ||
                        "نامشخص"
                    )}

                </span>

            </div>



            <div class="project-journey">

                <div class="project-journey-heading">

                    <span class="eyebrow">
                        PROJECT JOURNEY
                    </span>

                    <strong>
                        مسیر اجرای پروژه
                    </strong>

                </div>


                <div class="project-journey-track">

                    <div class="project-journey-step active">
                        <span class="project-journey-dot">01</span>
                        <span class="project-journey-label">پیش‌نویس</span>
                    </div>


                    <div class="project-journey-line"></div>


                    <div class="project-journey-step">
                        <span class="project-journey-dot">02</span>
                        <span class="project-journey-label">مشاور</span>
                    </div>


                    <div class="project-journey-line"></div>


                    <div class="project-journey-step">
                        <span class="project-journey-dot">03</span>
                        <span class="project-journey-label">استانداردسازی / مناقصه</span>
                    </div>


                    <div class="project-journey-line"></div>


                    <div class="project-journey-step">
                        <span class="project-journey-dot">04</span>
                        <span class="project-journey-label">تولید</span>
                    </div>


                    <div class="project-journey-line"></div>


                    <div class="project-journey-step">
                        <span class="project-journey-dot">05</span>
                        <span class="project-journey-label">تکمیل</span>
                    </div>

                </div>

            </div>



            <div class="project-detail-description">

                <div class="project-description-action">

                    <div>

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


                    ${
                        project.status === "draft"
                        ? `
                        <button
                            type="button"
                            class="project-consultant-action"
                            data-action="send-project-to-consultant"
                        >

                            <span class="project-consultant-action-pulse"></span>

                            <span>
                                ارسال برای مشاور
                            </span>

                        </button>
                        `
                        :
                        ""
                    }

                </div>

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
                        وضعیت
                    </span>

                    <strong>
                        ${escapeHtml(
                            project.status ||
                            "—"
                        )}
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
    data-project-tab-content="standardization"
>

    <div
        class="project-tab-panel"
        id="standardization-panel"
    >

        <div class="tender-loading">
            در حال دریافت استانداردسازی...
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
                data-project-tab-content="files"
            >

                <div class="project-tab-panel">

                    <span class="eyebrow">
                        FILES & DESIGN
                    </span>

                    <h3>
                        فایل‌ها و طراحی
                    </h3>

                    <p>
                        نقشه‌ها، فایل‌های طراحی، تصاویر،
                        مدارک فنی و سایر فایل‌های پروژه در این بخش قرار می‌گیرند.
                    </p>

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
 SEND PROJECT TO CONSULTANT
--------------------------------------------------------
*/

const consultantAction =
    projectView.querySelector(
        '[data-action="send-project-to-consultant"]'
    );

if (consultantAction) {

    consultantAction.addEventListener(
        "click",
        async function(event) {

            event.preventDefault();

            const confirmed =
                confirm(
                    "آیا پروژه برای مشاور ارسال شود؟"
                );

            if (!confirmed) {
                return;
            }

            try {

                consultantAction.disabled = true;

                consultantAction.classList.add(
                    "is-loading"
                );

                await apiPost(
                    `/projects/${project.id}/send-to-consultant/`,
                    {}
                );

                alert(
                    "پروژه با موفقیت برای مشاور ارسال شد"
                );

                location.reload();

            }
            catch(error) {

                console.error(
                    error
                );

                consultantAction.disabled = false;

                consultantAction.classList.remove(
                    "is-loading"
                );

                alert(
                    "خطا در ارسال پروژه به مشاور"
                );

            }

        }
    );

}

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

                    }
                );

            }
        );


    /*
    --------------------------------------------------------
    LOAD PROJECT ATTACHMENTS
    --------------------------------------------------------
    */

    loadProjectAttachments(
        project.id
    );


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
 LOAD PROJECT ATTACHMENTS
============================================================
*/

async function loadProjectAttachments(projectId) {

    try {

        const attachments =
            await apiGet(
                `/projects/${projectId}/attachments/`
            );


        const panel =
            document.querySelector(
                '[data-project-tab-content="files"] .project-tab-panel'
            );


        if (!panel) {
            return;
        }


        panel.innerHTML = `

            <span class="eyebrow">
                FILES & DESIGN
            </span>


            <h3>
                فایل‌ها و طراحی
            </h3>


            ${
                attachments.length

                ?

                attachments.map(
                    file => `

                    <div class="project-file-item">

                        <a
                            href="${file.file}"
                            target="_blank"
                        >
                            ${file.file.split("/").pop()}
                        </a>

                    </div>

                    `
                ).join("")

                :

                `
                <p>
                    فایلی برای این پروژه ثبت نشده است.
                </p>
                `

            }

        `;

    }
    catch(error) {

        console.error(
            "FEEMAAS: Load attachments failed",
            error
        );

    }

}


/*
============================================================
 LOAD PROJECT STANDARDIZATION
============================================================
*/

async function loadProjectStandardization(projectId){

    console.log(
        "CUSTOMER STANDARDIZATION LOAD:",
        projectId
    );


    try {

        const data =
            await apiGet(
                `/projects/${projectId}/standardization/view/`
            );


        console.log(
            "STANDARDIZATION DATA:",
            data
        );

       const standardizationStatus =
           data.standardization_status;


        const panel =
            document.getElementById(
                "standardization-panel"
            );


        if(!panel){
            console.warn(
                "STANDARDIZATION PANEL NOT FOUND"
            );
            return;
        }


        const items =
            data.items || [];

console.log(
    "STANDARDIZATION FULL ITEMS:",
    JSON.stringify(items, null, 2)
);

items.forEach(item => {

    console.log(
        "ITEM STATUS:",
        item.id,
        item.customer_review_status
    );

});

        panel.innerHTML = `


<span class="eyebrow">
    STANDARDIZATION
</span>


<div class="standardization-header">

    <div class="standardization-header-title">
        <span class="eyebrow">
            STANDARDIZATION
        </span>

        <h3>
            استانداردسازی مشاور
        </h3>
    </div>


    <div
        id="customer-review-timer"
        class="standardization-timer"
    >
        <span class="standardization-timer-label">
            زمان باقی‌مانده بررسی
        </span>

        <strong id="customer-review-timer-value">
            60:00
        </strong>
    </div>

</div>

<div class="standardization-table-wrapper">


<div class="standardization-table">


<div class="standardization-table-head">

    <div>ردیف</div>
    <div>نام آیتم</div>
    <div>تعداد</div>
    <div>ابعاد</div>
    <div>متریال</div>
    <div>مشخصات فنی</div>
    <div>وضعیت</div>    
    <div>فایل</div>
    <div>عملیات</div>


</div>



${
items.map(
(item,index)=>`

<div class="standardization-item">

<div class="standardization-row">


<div>
${index + 1}
</div>


<div>
${item.name || item.title || "-"}
</div>


<div>
${item.quantity || "-"}
</div>


<div>
${item.dimensions || "-"}
</div>


<div>
${item.material || "-"}
</div>


<div>
${item.technical_details || "-"}
</div>


<div class="standardization-status">

${
    item.customer_review_status === "approved"
    ?
    "✓"
    :
    item.customer_review_status === "revise"
    ?
    "↻"
    :
    "—"
}

</div>


<div class="standardization-file-cell">

${
    item.files && item.files.length
    ?
    `
    <button
        type="button"
        class="standardization-file-badge"
        data-standardization-files="${item.row_number}"
    >

        <span class="standardization-file-icon">
            📎
        </span>

        <span class="standardization-file-count">
            ${item.files.length}
        </span>

    </button>


    <div
        class="standardization-modal-data hidden"
        data-standardization-modal-data="${item.row_number}"
    >

        ${

            item.files.map(
                file => `

                <div class="standardization-modal-file">


                    ${
                        file.file.match(
                            /\.(jpg|jpeg|png|gif|webp)$/i
                        )

                        ?

                        `
                        <img
                            src="${file.file}"
                            alt="${file.title || "تصویر فایل"}"
                        >
                        `

                        :

                        `
                        <a
                            href="${file.file}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            📄
                            ${file.title || "مشاهده فایل"}
                        </a>
                        `

                    }


                </div>

                `
            ).join("")

        }

    </div>

    `
    :
    `
    <span class="standardization-no-file">
        —
    </span>
    `
}

</div>

<div class="standardization-row-actions">

${
    !item.customer_review_status ||

    item.customer_review_status === "pending" ||

    item.customer_review_status === "revise"

    ?

    `
    <button
        class="standardization-approve"
        data-specification-id="${item.id}"
        title="تایید استانداردسازی"
    >
        ✓
    </button>


    <button
        class="standardization-revise"
        data-specification-id="${item.id}"
        title="درخواست اصلاح"
    >
        ↻
    </button>
    `

    :

    `
    <span
        class="standardization-locked"
        title="تصمیم ثبت شده"
    >
        🔒
    </span>
    `
}

</div>

</div>

</div>

`
).join("")
}


</div>

</div>




<div class="standardization-actions">

${
    standardizationStatus === "approved"

    ?

    `
    <div class="standardization-status-approved">
        🟢 استانداردسازی تایید شده است
    </div>
    `

    :

    standardizationStatus === "revision_requested"

    ?

    `
    <div class="standardization-status-revision">
        🟠 نیاز به اصلاح دارد
    </div>
    `

    :

    `
    <button class="standardization-global-approve">
        ✓ تایید کل استانداردسازی
    </button>


    <button class="standardization-global-revise">
        ↻ درخواست اصلاح کلی
    </button>
    `
}

</div>


`;

panel.querySelectorAll(
    "[data-standardization-files]"
)
.forEach(
    button => {

        button.addEventListener(
            "click",
            function(){

                const rowNumber =
                    this.dataset.standardizationFiles;


                const data =
                    panel.querySelector(
                        `[data-standardization-modal-data="${rowNumber}"]`
                    );


                if(!data){
                    return;
                }


                openStandardizationFilesModal(
                    data.innerHTML
                );

            }
        );

    }
);

panel.querySelectorAll(
    ".standardization-approve"
).forEach(
    button => {

        button.addEventListener(
            "click",
            async function(){

                const specificationId =
                    this.dataset.specificationId;


                try {

                    const response =
                        await apiPost(
                            `/projects/specifications/${specificationId}/standardization/review/`,
                            {
                                status: "approved"
                            }
                        );


                    console.log(
                        "APPROVED:",
                        response
                    );


                    this.innerHTML =
                        "✓ تایید";
 
                    this
                    .closest(".standardization-row-actions")
                    .querySelector(".standardization-revise")
                    .disabled = true;
                    this.disabled = true;


                }
                catch(error){

                    console.error(
                        "APPROVE ERROR:",
                        error
                    );

                }



            }
        );

    }
);

panel.querySelectorAll(
    ".standardization-revise"
).forEach(
    button => {

        button.addEventListener(
            "click",
            async function(){

                const specificationId =
                    this.dataset.specificationId;


try {

    const response =
        await apiPost(
            `/projects/specifications/${specificationId}/standardization/review/`,
            {
                status: "revise",
                note: "نیاز به اصلاح دارد"
            }
        );


    console.log(
        "REVISE SAVED:",
        response
    );


    this.innerHTML =
        "↻ اصلاح شد";


    this.disabled = true;

    this
    .closest(".standardization-row-actions")
    .querySelector(".standardization-approve")
    .disabled = true;

    this
    .closest(".standardization-row-actions")
    .querySelector(".standardization-approve")
    .disabled = true;

}
catch(error){

    console.error(
        "REVISE ERROR:",
        error
    );

}


            }
        );

    }
);


panel.querySelector(
    ".standardization-global-approve"
)
.addEventListener(
    "click",
    async function(){

        try {

            const response =
                await apiPost(
                    `/projects/${projectId}/standardization/global-review/`,
                    {
                        status: "approved"
                    }
                );


            console.log(
                "GLOBAL STANDARDIZATION APPROVED:",
                response
            );


            this.innerHTML =
                "✓ تایید کل شد";


            this.disabled = true;


            panel.querySelector(
                ".standardization-global-revise"
            ).disabled = true;


        }
        catch(error){

            console.error(
                "GLOBAL APPROVE ERROR:",
                error
            );

        }

    }
);



panel.querySelector(
    ".standardization-global-revise"
)
.addEventListener(
    "click",
    async function(){

        try {

            const response =
                await apiPost(
                    `/projects/${projectId}/standardization/global-review/`,
                    {
                        status:
                            "revision_requested"
                    }
                );


            console.log(
                "GLOBAL REVISION REQUESTED:",
                response
            );


            this.innerHTML =
                "↻ اصلاح کلی درخواست شد";


            this.disabled = true;


            panel.querySelector(
                ".standardization-global-approve"
            ).disabled = true;


        }
        catch(error){

            console.error(
                "GLOBAL REVISE ERROR:",
                error
            );

        }

    }
);
        console.log(
            "STANDARDIZATION RENDER DONE",
            panel.innerHTML.length
        );


    }
    catch(error){

        console.error(
            "STANDARDIZATION LOAD ERROR",
            error
        );

    }

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

function openStandardizationFilesModal(content){


    let modal =
        document.getElementById(
            "standardization-files-modal"
        );


    if(!modal){

        modal =
            document.createElement(
                "div"
            );

        modal.id =
            "standardization-files-modal";


        document.body.appendChild(
            modal
        );

    }


    modal.innerHTML = `


<div class="standardization-modal-overlay">


    <div class="standardization-modal-box">


        <button
            class="standardization-modal-close"
        >
            ×
        </button>


        <h3>
            فایل‌های استانداردسازی
        </h3>


        <div class="standardization-modal-gallery">

            ${content}

        </div>


    </div>


</div>


`;


    modal
    .querySelector(
        ".standardization-modal-close"
    )
    .onclick =
    () => {

        modal.innerHTML="";

    };


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