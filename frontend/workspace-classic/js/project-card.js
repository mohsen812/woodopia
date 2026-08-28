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

                <div class="project-tab-panel">

                    <span class="eyebrow">
                        TENDER
                    </span>

                    <h3>
                        مناقصه
                    </h3>

                    <p>
                        پیشنهادهای کارگاه‌ها،
                        رتبه‌بندی و وضعیت مناقصه در این بخش قرار خواهد گرفت.
                    </p>

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

                    }
                );

            }
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