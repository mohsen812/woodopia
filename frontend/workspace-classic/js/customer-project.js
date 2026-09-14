/*
============================================================
 FEEMAAS CUSTOMER PROJECT CREATE
 Workspace Customer UI
============================================================
*/

(function () {

    "use strict";


    let createModal = null;


    document.addEventListener(
        "DOMContentLoaded",
        function () {

            const button =
                document.getElementById(
                    "create-project-button"
                );


            if (!button) {
                return;
            }


            button.addEventListener(
                "click",
                openCreateProjectModal
            );

        }
    );


    /*
    --------------------------------------------------------
    CSRF
    --------------------------------------------------------
    */

    function getCookie(name) {

        const cookies =
            document.cookie.split(";");


        for (let cookie of cookies) {

            cookie =
                cookie.trim();


            if (
                cookie.startsWith(
                    name + "="
                )
            ) {

                return decodeURIComponent(
                    cookie.substring(
                        name.length + 1
                    )
                );

            }

        }


        return null;

    }


    /*
    --------------------------------------------------------
    OPEN MODAL
    --------------------------------------------------------
    */

    function openCreateProjectModal() {

        if (createModal) {

            createModal.classList.remove(
                "workspace-create-project-hidden"
            );

            return;

        }


        createModal =
            document.createElement("div");


        createModal.id =
            "workspace-create-project-modal";


        createModal.className =
            "workspace-create-project-modal";


        createModal.innerHTML = `

            <div
                class="workspace-create-project-overlay"
                data-close-create-project
            ></div>


            <div
                class="workspace-create-project-box"
                role="dialog"
                aria-modal="true"
                aria-labelledby="workspace-create-project-title"
            >

                <button
                    type="button"
                    class="workspace-create-project-close"
                    id="workspace-create-project-close"
                    aria-label="بستن"
                >
                    ×
                </button>


                <div
                    class="workspace-create-project-header"
                >

                    <h2
                        id="workspace-create-project-title"
                    >
                        ایجاد پروژه جدید
                    </h2>

                    <p>
                        اطلاعات پروژه را وارد کنید
                        و در صورت نیاز فایل‌ها و نقشه‌ها
                        را اضافه کنید.
                    </p>

                </div>


                <form
                    id="workspace-create-project-form"
                    class="workspace-create-project-form"
                >

                    <div
                        class="workspace-create-project-field"
                    >

                        <label for="workspace-project-title">
                            عنوان پروژه
                        </label>

                        <input
                            id="workspace-project-title"
                            name="title"
                            type="text"
                            placeholder="مثلاً میز ناهارخوری سفارشی"
                            required
                        >

                    </div>


                    <div
                        class="workspace-create-project-field"
                    >

                        <label for="workspace-project-description">
                            توضیحات پروژه
                        </label>

                        <textarea
                            id="workspace-project-description"
                            name="description"
                            rows="5"
                            placeholder="توضیحات، نیازمندی‌ها و مشخصات پروژه..."
                        ></textarea>

                    </div>


                    <div
                        class="workspace-create-project-row"
                    >

                        <div
                            class="workspace-create-project-field"
                        >

                            <label for="workspace-project-budget">
                                بودجه تقریبی
                            </label>

                            <input
                                id="workspace-project-budget"
                                name="estimated_budget"
                                type="number"
                                min="0"
                                placeholder="مثلاً 150000000"
                            >

                        </div>


                        <div
                            class="workspace-create-project-field"
                        >

                            <label for="workspace-project-days">
                                زمان تحویل (روز)
                            </label>

                            <input
                                id="workspace-project-days"
                                name="required_delivery_days"
                                type="number"
                                min="1"
                                value="30"
                            >

                        </div>

                    </div>


                    <div
                        class="workspace-create-project-field"
                    >

                        <label for="workspace-project-files">
                            فایل‌ها و نقشه‌های پروژه
                        </label>

                        <input
                            id="workspace-project-files"
                            name="project_files"
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf,.dwg,.doc,.docx"
                        >

                        <div
                            id="workspace-project-files-preview"
                            class="workspace-project-files-preview"
                        >
                        </div>

                    </div>


                    <div
                        id="workspace-create-project-error"
                        class="workspace-create-project-error"
                    >
                    </div>


                    <div
                        class="workspace-create-project-actions"
                    >

                        <button
                            type="button"
                            class="workspace-create-project-cancel"
                            id="workspace-create-project-cancel"
                        >
                            انصراف
                        </button>


                        <button
                            type="submit"
                            class="workspace-create-project-submit"
                            id="workspace-create-project-submit"
                        >
                            ثبت پروژه
                        </button>

                    </div>

                </form>

            </div>

        `;


        document.body.appendChild(
            createModal
        );


        bindCreateProjectEvents();


        createModal.classList.remove(
            "workspace-create-project-hidden"
        );


        const titleInput =
            document.getElementById(
                "workspace-project-title"
            );


        if (titleInput) {

            setTimeout(
                function () {
                    titleInput.focus();
                },
                50
            );

        }

    }


    /*
    --------------------------------------------------------
    EVENTS
    --------------------------------------------------------
    */

    function bindCreateProjectEvents() {

        const form =
            document.getElementById(
                "workspace-create-project-form"
            );


        const closeButton =
            document.getElementById(
                "workspace-create-project-close"
            );


        const cancelButton =
            document.getElementById(
                "workspace-create-project-cancel"
            );


        const filesInput =
            document.getElementById(
                "workspace-project-files"
            );


        if (form) {

            form.addEventListener(
                "submit",
                createProject
            );

        }


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeCreateProjectModal
            );

        }


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                closeCreateProjectModal
            );

        }


        if (createModal) {

            createModal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target &&
                        event.target.hasAttribute(
                            "data-close-create-project"
                        )
                    ) {

                        closeCreateProjectModal();

                    }

                }
            );

        }


        if (filesInput) {

            filesInput.addEventListener(
                "change",
                updateFilesPreview
            );

        }


        document.addEventListener(
            "keydown",
            handleEscape
        );

    }


    function handleEscape(event) {

        if (
            event.key === "Escape" &&
            createModal &&
            !createModal.classList.contains(
                "workspace-create-project-hidden"
            )
        ) {

            closeCreateProjectModal();

        }

    }


    /*
    --------------------------------------------------------
    FILE PREVIEW
    --------------------------------------------------------
    */

    function updateFilesPreview() {

        const input =
            document.getElementById(
                "workspace-project-files"
            );


        const preview =
            document.getElementById(
                "workspace-project-files-preview"
            );


        if (!input || !preview) {
            return;
        }


        preview.innerHTML = "";


        if (!input.files.length) {
            return;
        }


        Array.from(
            input.files
        ).forEach(
            function (file) {

                const item =
                    document.createElement("div");


                item.className =
                    "workspace-project-file-item";


                const size =
                    formatFileSize(
                        file.size
                    );


                item.innerHTML = `

                    <span
                        class="workspace-project-file-name"
                    >
                        ${escapeHtml(file.name)}
                    </span>

                    <span
                        class="workspace-project-file-size"
                    >
                        ${size}
                    </span>

                `;


                preview.appendChild(
                    item
                );

            }
        );

    }


    function formatFileSize(bytes) {

        if (!bytes) {
            return "0 B";
        }


        if (bytes < 1024) {
            return bytes + " B";
        }


        if (bytes < 1024 * 1024) {

            return (
                (bytes / 1024).toFixed(1) +
                " KB"
            );

        }


        return (
            (bytes / (1024 * 1024)).toFixed(1) +
            " MB"
        );

    }


    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /*
    --------------------------------------------------------
    CREATE PROJECT
    --------------------------------------------------------
    */

    async function createProject(event) {

        event.preventDefault();


        const form =
            document.getElementById(
                "workspace-create-project-form"
            );


        const submitButton =
            document.getElementById(
                "workspace-create-project-submit"
            );


        const errorBox =
            document.getElementById(
                "workspace-create-project-error"
            );


        if (!form) {
            return;
        }


        if (errorBox) {

            errorBox.textContent = "";

        }


        const formData =
            new FormData();


        const title =
            document.getElementById(
                "workspace-project-title"
            ).value.trim();


        const description =
            document.getElementById(
                "workspace-project-description"
            ).value.trim();


        const budget =
            document.getElementById(
                "workspace-project-budget"
            ).value;


        const days =
            document.getElementById(
                "workspace-project-days"
            ).value;


        const filesInput =
            document.getElementById(
                "workspace-project-files"
            );


        if (!title) {

            showCreateError(
                "عنوان پروژه الزامی است."
            );

            return;

        }


        formData.append(
            "title",
            title
        );


        formData.append(
            "description",
            description
        );


        if (budget !== "") {

            formData.append(
                "estimated_budget",
                budget
            );

        }


        if (days !== "") {

            formData.append(
                "required_delivery_days",
                days
            );

        }


        /*
        IMPORTANT:
        Files are NOT appended here.
        They are uploaded after project creation
        through /projects/<id>/attachments/
        */


        try {

            if (submitButton) {

                submitButton.disabled = true;

                submitButton.textContent =
                    "در حال ایجاد پروژه...";

            }


            const response =
                await fetch(
                    "/projects/",
                    {
                        method: "POST",

                        credentials:
                            "same-origin",

                        headers: {

                            "Accept":
                                "application/json",

                            "X-CSRFToken":
                                getCookie(
                                    "csrftoken"
                                )

                        },

                        body:
                            formData
                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();


                console.error(
                    "CREATE PROJECT ERROR:",
                    response.status,
                    errorText
                );


                throw new Error(
                    "Create project failed"
                );

            }


            const project =
                await response.json();


            /*
            ------------------------------------------------
            UPLOAD ATTACHMENTS
            ------------------------------------------------
            */

            if (
                filesInput &&
                filesInput.files.length > 0
            ) {

                if (submitButton) {

                    submitButton.textContent =
                        "در حال آپلود فایل‌ها...";

                }


                await uploadProjectFiles(
                    project.id,
                    filesInput.files
                );

            }


            /*
            ------------------------------------------------
            CLOSE + REFRESH
            ------------------------------------------------
            */

            closeCreateProjectModal();


            form.reset();


            const preview =
                document.getElementById(
                    "workspace-project-files-preview"
                );


            if (preview) {
                preview.innerHTML = "";
            }


            if (
                typeof loadProjects ===
                "function"
            ) {

                await loadProjects();

            }


            /*
            If the existing Workspace project
            detail function exists, open it.
            */

            if (
                typeof openProjectDetail ===
                "function"
            ) {

                openProjectDetail(
                    project
                );

            }
            else if (
                typeof openProjectModal ===
                "function"
            ) {

                openProjectModal(
                    project.id
                );

            }


            alert(
                "پروژه با موفقیت ایجاد شد"
            );

        }
        catch (error) {

            console.error(
                "Create project error:",
                error
            );


            showCreateError(
                "خطا در ایجاد پروژه. لطفاً دوباره تلاش کنید."
            );

        }
        finally {

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.textContent =
                    "ثبت پروژه";

            }

        }

    }


    /*
    --------------------------------------------------------
    UPLOAD PROJECT FILES
    --------------------------------------------------------
    */

    async function uploadProjectFiles(
        projectId,
        files
    ) {

        if (
            !projectId ||
            !files ||
            !files.length
        ) {

            return;

        }


        for (
            const file of files
        ) {

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

                        method: "POST",

                        credentials:
                            "same-origin",

                        headers: {

                            "Accept":
                                "application/json",

                            "X-CSRFToken":
                                getCookie(
                                    "csrftoken"
                                )

                        },

                        body:
                            formData

                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();


                console.error(
                    "Attachment upload failed:",
                    response.status,
                    errorText
                );


                throw new Error(
                    "Attachment upload failed"
                );

            }

        }

    }


    /*
    --------------------------------------------------------
    ERROR
    --------------------------------------------------------
    */

    function showCreateError(
        message
    ) {

        const errorBox =
            document.getElementById(
                "workspace-create-project-error"
            );


        if (errorBox) {

            errorBox.textContent =
                message;

        }

    }


    /*
    --------------------------------------------------------
    CLOSE
    --------------------------------------------------------
    */

    function closeCreateProjectModal() {

        if (!createModal) {
            return;
        }


        createModal.classList.add(
            "workspace-create-project-hidden"
        );

    }


})();
