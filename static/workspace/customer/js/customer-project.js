let pendingProjectFiles = [];


// =====================================
// DOM READY
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const buttons = [
            document.getElementById(
                "create-project-button"
            ),
            document.getElementById(
                "dashboard-create-project-button"
            )
        ].filter(Boolean);


        buttons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    openCreateProjectModal
                );

            }
        );


        const saveButton =
            document.getElementById(
                "save-project-button"
            );


        if (saveButton) {

            saveButton.addEventListener(
                "click",
                createProject
            );

        }


        const addFileButton =
            document.getElementById(
                "project-add-file-button"
            );


        const fileInput =
            document.getElementById(
                "project-initial-file-input"
            );


        if (
            addFileButton &&
            fileInput
        ) {

            addFileButton.addEventListener(
                "click",
                () => {

                    fileInput.click();

                }
            );


            fileInput.addEventListener(
                "change",
                handleProjectFileSelection
            );

        }

    }
);


// =====================================
// OPEN CREATE PROJECT MODAL
// =====================================

function openCreateProjectModal() {

    const modal =
        document.getElementById(
            "create-project-modal"
        );


    if (!modal) {

        console.warn(
            "FEEMAAS: create-project-modal not found."
        );

        return;

    }


    modal.classList.remove(
        "hidden"
    );


    const titleInput =
        document.getElementById(
            "project-title"
        );


    if (titleInput) {

        titleInput.focus();

    }

}


// =====================================
// CLOSE CREATE PROJECT MODAL
// =====================================

function closeCreateProjectModal() {

    const modal =
        document.getElementById(
            "create-project-modal"
        );


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    // مهم:
    // فایل‌های انتخاب‌شده برای پروژه قبلی
    // نباید وارد پروژه بعدی شوند.

    pendingProjectFiles = [];

    renderPendingProjectFiles();

}


// =====================================
// FILE SELECTION
// =====================================

function handleProjectFileSelection(
    event
) {

    const files =
        Array.from(
            event.target.files || []
        );


    files.forEach(
        file => {

            pendingProjectFiles.push(
                file
            );

        }
    );


    renderPendingProjectFiles();


    // اجازه انتخاب دوباره همان فایل
    event.target.value = "";

}


// =====================================
// FILE ICON
// =====================================

function getInitialFileVisual(
    file
) {

    const type =
        file.type || "";


    if (
        type.startsWith(
            "image/"
        )
    ) {

        const imageUrl =
            URL.createObjectURL(
                file
            );


        return `
            <img
                class="initial-file-thumbnail"
                src="${imageUrl}"
                alt=""
            >
        `;

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const icons = {

        pdf: "PDF",

        doc: "DOC",
        docx: "DOC",

        xls: "XLS",
        xlsx: "XLS",

        dwg: "CAD",
        dxf: "CAD",

        zip: "ZIP",
        rar: "ZIP",

        txt: "TXT"

    };


    return `
        <div
            class="
                initial-file-type-icon
                initial-file-type-${extension}
            "
        >
            ${
                icons[extension] ||
                "FILE"
            }
        </div>
    `;

}


// =====================================
// RENDER SELECTED FILES
// =====================================

function renderPendingProjectFiles() {

    const container =
        document.getElementById(
            "project-initial-file-list"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    pendingProjectFiles.forEach(
        (
            file,
            index
        ) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "initial-file-card";


            card.dataset.fileIndex =
                index;


            card.innerHTML = `

                <div
                    class="initial-file-visual"
                >
                    ${getInitialFileVisual(file)}
                </div>


                <div
                    class="initial-file-info"
                >

                    <div
                        class="initial-file-name"
                        title="${escapeHtml(
                            file.name
                        )}"
                    >
                        ${escapeHtml(
                            file.name
                        )}
                    </div>


                    <div
                        class="initial-file-size"
                    >
                        ${formatFileSize(
                            file.size
                        )}
                    </div>


                    <div
                        class="initial-file-progress"
                    >
                        <span></span>
                    </div>


                    <div
                        class="initial-file-status"
                    >
                        آماده ارسال
                    </div>

                </div>


                <button
                    type="button"
                    class="initial-file-remove"
                    aria-label="حذف فایل"
                    title="حذف فایل"
                >
                    ×
                </button>

            `;


            const removeButton =
                card.querySelector(
                    ".initial-file-remove"
                );


            if (removeButton) {

                removeButton.addEventListener(
                    "click",
                    () => {

                        pendingProjectFiles.splice(
                            index,
                            1
                        );


                        renderPendingProjectFiles();

                    }
                );

            }


            container.appendChild(
                card
            );

        }
    );

}


// =====================================
// UPLOAD INITIAL PROJECT FILES
// =====================================

async function uploadInitialProjectFiles(
    projectId
) {

    if (
        pendingProjectFiles.length === 0
    ) {

        return {
            uploaded: 0,
            failed: 0
        };

    }


    let uploaded = 0;
    let failed = 0;


    const files =
        [...pendingProjectFiles];


    for (
        let index = 0;
        index < files.length;
        index++
    ) {

        const file =
            files[index];


        const card =
            document.querySelector(
                `.initial-file-card[data-file-index="${index}"]`
            );


        if (!card) {
            continue;
        }


        const bar =
            card.querySelector(
                ".initial-file-progress span"
            );


        const status =
            card.querySelector(
                ".initial-file-status"
            );


        const removeButton =
            card.querySelector(
                ".initial-file-remove"
            );


        if (removeButton) {

            removeButton.disabled =
                true;

        }


        if (status) {

            status.textContent =
                "در حال آپلود...";

        }


        try {

            await uploadProjectFileCenterFile(
                projectId,
                file,
                percent => {

                    if (bar) {

                        bar.style.width =
                            percent + "%";

                    }


                    if (status) {

                        status.textContent =
                            percent + "%";

                    }

                }
            );


            uploaded++;


            card.classList.add(
                "initial-file-uploaded"
            );


            if (bar) {

                bar.style.width =
                    "100%";

            }


            if (status) {

                status.textContent =
                    "✓ آپلود شد";

            }


            const successMark =
                document.createElement(
                    "div"
                );


            successMark.className =
                "initial-file-success";

            successMark.textContent =
                "✓";


            card.appendChild(
                successMark
            );


        }
        catch (error) {

            failed++;


            console.error(
                "FEEMAAS Initial File Upload Error:",
                file.name,
                error
            );


            card.classList.add(
                "initial-file-upload-failed"
            );


            if (status) {

                status.textContent =
                    "آپلود ناموفق";

            }


            if (removeButton) {

                removeButton.disabled =
                    false;

            }

        }

    }


    return {
        uploaded,
        failed
    };

}


// =====================================
// CREATE PROJECT
// =====================================

async function createProject() {

    const titleInput =
        document.getElementById(
            "project-title"
        );


    const descriptionInput =
        document.getElementById(
            "project-description"
        );


    const budgetInput =
        document.getElementById(
            "project-budget"
        );


    const daysInput =
        document.getElementById(
            "project-days"
        );


    const title =
        titleInput
            ? titleInput.value.trim()
            : "";


    const description =
        descriptionInput
            ? descriptionInput.value.trim()
            : "";


    const estimatedBudget =
        budgetInput
            ? budgetInput.value
            : "";


    const requiredDeliveryDays =
        daysInput
            ? daysInput.value
            : "";


    if (!title) {

        alert(
            "لطفاً عنوان پروژه را وارد کنید."
        );

        return;

    }


    const payload = {

        title: title,

        description: description,

        estimated_budget:
            estimatedBudget || null,

        required_delivery_days:
            requiredDeliveryDays || null

    };


    const saveButton =
        document.getElementById(
            "save-project-button"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "در حال ایجاد پروژه...";

    }


    try {

        // -----------------------------
        // 1. CREATE PROJECT
        // -----------------------------

        const project =
            await apiPost(
                "/projects/",
                payload
            );


        console.log(
            "FEEMAAS: Project created:",
            project
        );


        // -----------------------------
        // 2. UPLOAD INITIAL FILES
        // -----------------------------

        if (
            pendingProjectFiles.length > 0
        ) {

            if (saveButton) {

                saveButton.textContent =
                    "در حال آپلود فایل‌ها...";

            }


            const result =
                await uploadInitialProjectFiles(
                    project.id
                );


            console.log(
                "FEEMAAS Initial Files:",
                result
            );


            if (
                result.failed > 0
            ) {

                alert(
                    `پروژه ساخته شد.\n` +
                    `${result.uploaded} فایل با موفقیت آپلود شد و ` +
                    `${result.failed} فایل ناموفق بود.`
                );

            }

        }


        // -----------------------------
        // 3. REFRESH PROJECT UI
        // -----------------------------

        if (
            typeof loadCustomerProjects ===
            "function"
        ) {

            await loadCustomerProjects();

        }


        if (
            typeof loadCustomerDashboard ===
            "function"
        ) {

            await loadCustomerDashboard();

        }


        // -----------------------------
        // 4. RESET FORM
        // -----------------------------

        if (titleInput) {
            titleInput.value = "";
        }


        if (descriptionInput) {
            descriptionInput.value = "";
        }


        if (budgetInput) {
            budgetInput.value = "";
        }


        if (daysInput) {
            daysInput.value = "";
        }


        pendingProjectFiles = [];

        renderPendingProjectFiles();


        closeCreateProjectModal();


        alert(
            "پروژه با موفقیت ثبت شد."
        );


    }
    catch (error) {

        console.error(
            "FEEMAAS Create Project Error:",
            error
        );


        alert(
            error.message ||
            "خطا در ایجاد پروژه."
        );

    }
    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "ثبت پروژه";

        }

    }

}


// =====================================
// MODAL EVENTS
// =====================================

document.addEventListener(
    "click",
    event => {

        const closeButton =
            event.target.closest(
                "#close-create-project-modal"
            );


        if (closeButton) {

            closeCreateProjectModal();

            return;

        }


        const modal =
            document.getElementById(
                "create-project-modal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeCreateProjectModal();

        }

    }
);


// =====================================
// HELPERS
// =====================================

function formatFileSize(
    bytes
) {

    if (!bytes) {
        return "0 KB";
    }


    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    const value =
        bytes /
        Math.pow(
            1024,
            index
        );


    return (
        value.toFixed(
            index === 0
                ? 0
                : 1
        ) +
        " " +
        units[index]
    );

}


function escapeHtml(
    value
) {

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


// =====================================
// GLOBAL ACCESS
// =====================================

window.openCreateProjectModal =
    openCreateProjectModal;

window.closeCreateProjectModal =
    closeCreateProjectModal;

window.createProject =
    createProject;


console.log(
    "CUSTOMER PROJECT JS LOADED"
);