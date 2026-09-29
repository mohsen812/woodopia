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

            <span class="eyebrow">
                PROJECT #${project.id}
            </span>

            <span class="project-status">
                ${escapeHtml(project.status || "—")}
            </span>

        </div>


        <h3>
            ${escapeHtml(project.title || "بدون عنوان")}
        </h3>


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
            function(event) {

                event.preventDefault();


                console.log(
                    "FEEMAAS: Send project to consultant",
                    project
                );

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

    const projectProgressStages = [
        { key: "draft", label: "ایجاد پروژه" },
        { key: "consulting", label: "مشاوره" },
        { key: "tender", label: "مناقصه" },
        { key: "production", label: "تولید" },
        { key: "completed", label: "تکمیل" }
    ];

    const projectCurrentStatus = project.status || "draft";
    const projectCurrentIndex =
        projectProgressStages.findIndex(
            stage => stage.key === projectCurrentStatus
        );

    const projectProgressHtml =
        projectProgressStages.map((stage, index) => {
            const isCompleted =
                projectCurrentIndex >= 0 &&
                index < projectCurrentIndex;

            const isCurrent =
                projectCurrentIndex === index;

            const stateClass =
                isCurrent
                    ? "current"
                    : (isCompleted ? "completed" : "pending");

            return `
                <div class="project-progress-step ${stateClass}">
                    <div class="project-progress-node">
                        <span>${isCompleted ? "✓" : (isCurrent ? "●" : "")}</span>
                    </div>
                    <div class="project-progress-label">
                        ${stage.label}
                    </div>
                </div>
            `;
        }).join("");

    const projectProgressCancelledHtml =
        projectCurrentStatus === "cancelled"
            ? `
                <div class="project-progress-cancelled">
                    <span class="project-progress-cancelled-dot"></span>
                    پروژه لغو شده
                </div>
              `
            : "";

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


            <div class="project-progress-section">
    <div class="project-progress-header">
        <div>
            <span class="eyebrow">PROJECT PROGRESS</span>
            <h3>روند اجرای پروژه</h3>
        </div>

        <div class="project-progress-status">
            ${escapeHtml(projectCurrentStatus)}
        </div>
    </div>

    <div class="project-progress-track">
        ${projectProgressHtml}
    </div>

    ${projectProgressCancelledHtml}
</div>

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
/*
============================================================
 LOAD PROJECT FILE CENTER
============================================================
*/

async function loadProjectFiles(projectId){

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


        renderProjectFiles(
            container,
            data,
            projectId
        );


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
function renderProjectFiles(
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


    container.innerHTML = `

        <div class="project-files-center">

            <div class="project-files-center-head">

                <div>

                    <span class="project-files-eyebrow">
                        PROJECT FILE CENTER
                    </span>

                    <h3>
                        فایل‌های پروژه
                    </h3>

                    <p>
                        فایل‌های پروژه بر اساس نقش مالک فایل تفکیک شده‌اند.
                    </p>

                </div>

            </div>


            <div class="project-files-role-grid">

                ${roles.map(role => {

                    const items =
                        files[role.key] || [];


                    return `

                        <section
                            class="
                                project-file-role-card
                                project-file-role-${role.accent}
                            "
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
                                            فایل‌های این نقش
                                        </small>

                                    </div>

                                </div>


                                <span
                                    class="project-file-role-count
                                           ${items.length ? "has-files" : ""}"
                                >
                                    ${String(items.length).padStart(2, "0")}
                                </span>

                            </header>


                            <div class="project-file-list">

                                ${
                                    items.length

                                    ?

                                    items.map((file, index) => `

                                        <article
                                            class="project-file-item"
                                        >

                                            <span
                                                class="project-file-number"
                                            >
                                                ${String(index + 1).padStart(2, "0")}
                                            </span>


                                            <div
                                                class="project-file-icon"
                                            >
                                                ${
                                                    file.file_type === "image"
                                                        ? "▧"
                                                        :
                                                    file.file_type === "design"
                                                        ? "◇"
                                                        :
                                                    "▤"
                                                }
                                            </div>


                                            <div
                                                class="project-file-info"
                                            >

                                                <strong>
                                                    ${
                                                        file.title ||
                                                        file.specification_title ||
                                                        "بدون عنوان"
                                                    }
                                                </strong>

                                                <small>

                                                    ${
                                                        file.source === "standardization"
                                                            ? "استانداردسازی مشاور"
                                                            : "نسخه " + (file.version || 1)
                                                    }

                                                </small>

                                            </div>


                                            <a
                                                class="project-file-view"
                                                href="${file.file}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="مشاهده فایل"
                                            >
                                                ↗
                                            </a>

                                        </article>

                                    `).join("")

                                    :

                                    `

                                        <div
                                            class="project-file-empty"
                                        >

                                            <span>
                                                —
                                            </span>

                                            <small>
                                                فایلی ثبت نشده
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

}
