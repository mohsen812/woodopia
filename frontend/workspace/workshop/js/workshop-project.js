(function () {

    "use strict";


    window.WorkshopProject = {


        currentProject: null,


        open: function (project) {


            if (!project) {

                console.error(
                    "WorkshopProject.open: project missing"
                );

                return;

            }


            this.currentProject = {
                ...project
            };


            console.log(
                "Workshop current project:",
                this.currentProject
            );


            const modal =
                document.getElementById(
                    "workshop-project-modal"
                );


            if (!modal) {

                console.error(
                    "workshop-project-modal not found"
                );

                return;

            }


            const title =
                document.getElementById(
                    "workshop-project-title"
                );


            const subtitle =
                document.getElementById(
                    "workshop-project-subtitle"
                );


            if (title) {

                title.textContent =
                    project.title ||
                    project.project_title ||
                    "پروژه";

            }


            if (subtitle) {

                subtitle.textContent =
                    project.tender_title
                    ? `مناقصه: ${project.tender_title}`
                    : "پروژه کارگاه";

            }


            this.renderSummary(
                this.currentProject
            );


            this.bindTabs();


            modal.classList.add(
                "open"
            );


            modal.setAttribute(
                "aria-hidden",
                "false"
            );


        },



        renderSummary: function (project) {


            const container =
                document.getElementById(
                    "workshop-project-summary"
                );


            if (!container) {
                return;
            }



            container.innerHTML = `

                <div class="summary-box">

                    <span>
                        پروژه
                    </span>

                    <strong>
                        ${this.escape(
                            project.title ||
                            project.project_title ||
                            "-"
                        )}
                    </strong>

                </div>


                <div class="summary-box">

                    <span>
                        مناقصه
                    </span>

                    <strong>
                        ${this.escape(
                            project.tender_title ||
                            "-"
                        )}
                    </strong>

                </div>


                <div class="summary-box">

                    <span>
                        Tender ID
                    </span>

                    <strong>
                        ${
                            project.tender_id ||
                            project.tender ||
                            "-"
                        }
                    </strong>

                </div>

            `;


        },



        bindTabs: function () {


            const modal =
                document.getElementById(
                    "workshop-project-modal"
                );


            if (!modal) {
                return;
            }



            const tabs =
                modal.querySelectorAll(
                    "[data-project-tab]"
                );


            const contents =
                modal.querySelectorAll(
                    "[data-project-content]"
                );



            tabs.forEach(
                tab => {


                    tab.onclick = () => {


                        const target =
                            tab.dataset.projectTab;



                        tabs.forEach(
                            item => {

                                item.classList.toggle(
                                    "active",
                                    item === tab
                                );

                            }
                        );



                        contents.forEach(
                            content => {

                                content.classList.toggle(
                                    "active",
                                    content.dataset.projectContent === target
                                );

                            }
                        );



                        console.log(
                            "Workshop project tab:",
                            target
                        );



                        if (target === "files") {
                            this.loadFiles();
                        }


                        if (
                            target === "proposal" &&
                            window.WorkshopTender
                        ) {


                            const tenderId =
                                this.currentProject.tender_id ||
                                this.currentProject.tender;
                            const bidId =
                                this.currentProject.bid_id ||
                                null;


                            console.log(
                                "Loading tender:",
                                    tenderId,
                            );



                            if (!tenderId) {


                                console.error(
                                    "Tender ID missing",
                                    this.currentProject
                                );


                                WorkshopTender.renderTenderMessage(
                                    "شناسه مناقصه برای پروژه موجود نیست."
                                );


                                return;

                            }



                            WorkshopTender.loadTender(
                                    tenderId,
								bidId
                            );


                        }


                    };


                }
            );


        },



        loadFiles: async function () {
            const container = document.getElementById(
                "workshop-project-files"
            );
            const uploadButton = document.getElementById(
                "workshop-upload-file-button"
            );

            if (!container) return;

            const projectId =
                this.currentProject &&
                (
                    this.currentProject.project_id ||
                    this.currentProject.projectId ||
                    this.currentProject.id
                );

            if (!projectId) {
                container.innerHTML =
                    '<div class="empty-state">شناسه پروژه مشخص نیست؛ امکان دریافت فایل‌ها وجود ندارد.</div>';
                return;
            }

            container.innerHTML =
                '<div class="empty-state">در حال دریافت فایل‌های پروژه...</div>';

            if (uploadButton) {
                uploadButton.onclick = () => {
                    let input = document.getElementById(
                        "workshop-project-file-input"
                    );

                    if (!input) {
                        input = document.createElement("input");
                        input.type = "file";
                        input.id = "workshop-project-file-input";
                        input.multiple = true;
                        input.hidden = true;
                        uploadButton.parentNode.appendChild(input);

                        input.addEventListener("change", async () => {
                            const selected = Array.from(input.files || []);
                            input.value = "";
                            if (selected.length) {
                                await this.uploadFiles(projectId, selected);
                            }
                        });
                    }

                    input.click();
                };
            }

            try {
                const response = await fetch(
                    `/api/projects/${encodeURIComponent(projectId)}/files/`,
                    {
                        method: "GET",
                        credentials: "same-origin",
                        headers: { "Accept": "application/json" }
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        response.status === 403
                            ? "شما به فایل‌های این پروژه دسترسی ندارید."
                            : `دریافت فایل‌ها ناموفق بود (HTTP ${response.status}).`
                    );
                }

                const data = await response.json();
                this.renderFiles(data);
            } catch (error) {
                console.error("Workshop File Center:", error);
                container.innerHTML =
                    `<div class="empty-state">${this.escape(
                        error.message || "خطا در دریافت فایل‌های پروژه."
                    )}</div>`;
            }
        },


        
renderFiles: function (data) {
    const container = document.getElementById("workshop-project-files");
    if (!container) return;

    const source = data && (
        data.files_by_role ||
        data.files ||
        data
    );

    const project = this.currentProject || {};
    const projectId = String(
        project.project_id || project.id || ""
    );

    const roles = [
        { key: "customer", title: "مشتری", icon: "👤", accent: "customer" },
        { key: "consultant", title: "مشاور", icon: "✦", accent: "consultant" },
        { key: "workshop", title: "کارگاه", icon: "🏭", accent: "workshop" },
        { key: "designer", title: "طراح", icon: "◆", accent: "designer" },
        { key: "company", title: "FEEMAAS", icon: "⚙", accent: "company" }
    ];

    const escapeHtml = value => this.escape(String(value ?? ""));

    const resolveWorkshopFileUrl = rawUrl => {
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

    const getKind = file => {
        const path = String(
            file.file || file.file_url || file.url || file.title || ""
        ).split(/[?#]/)[0];

        const extension = path.includes(".")
            ? path.split(".").pop().toLowerCase()
            : "";

        if (
            file.file_type === "image" ||
            ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(extension)
        ) return { kind: "image", extension };

        if (
            file.file_type === "design" ||
            ["dwg", "dxf", "step", "stp", "iges", "igs", "skp", "obj", "fbx"].includes(extension)
        ) return { kind: "design", extension };

        if (
            file.file_type === "document" ||
            ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"].includes(extension)
        ) return { kind: "document", extension };

        return { kind: "other", extension };
    };

    const fileGroups = {};
    let total = 0;

    roles.forEach(role => {
        fileGroups[role.key] = Array.isArray(source && source[role.key])
            ? source[role.key]
            : [];
        total += fileGroups[role.key].length;
    });

    const renderCard = (file, role, index) => {
        const title = file.title ||
            file.specification_title ||
            file.name ||
            file.original_name ||
            "بدون عنوان";

        const rawUrl = file.file_url || file.file || file.url || "";
        const url = resolveWorkshopFileUrl(rawUrl);
        const { kind, extension } = getKind(file);
        const label = extension ? extension.toUpperCase() : (
            kind === "image" ? "IMAGE" :
            kind === "document" ? "DOC" :
            kind === "design" ? "CAD" : "FILE"
        );

        const preview = kind === "image" && url
            ? `<img class="project-file-card-preview-image"
                    src="${escapeHtml(url)}"
                    alt="${escapeHtml(title)}"
                    loading="lazy">`
            : `<span class="project-file-card-type project-file-card-type-${kind}">
                    <span class="project-file-card-type-icon">${escapeHtml(label)}</span>
               </span>`;

        const sourceLabel = file.source === "standardization"
            ? "مشاور"
            : `نسخه ${file.version || 1}`;

        const fileId = file.id || "";
        const deleteButton = role.key === "workshop" && fileId
            ? `<button type="button"
                    class="workshop-file-delete"
                    aria-label="حذف فایل ${escapeHtml(title)}"
                    title="حذف فایل">×</button>`
            : "";

        return `
            <article class="project-file-card project-file-card-${kind}"
                data-file-id="${escapeHtml(fileId)}"
                data-project-id="${escapeHtml(projectId)}"
                data-role="${escapeHtml(role.key)}"
                data-file-url="${escapeHtml(url)}"
                data-file-title="${escapeHtml(title)}"
                data-file-kind="${kind}"
                data-file-extension="${escapeHtml(extension)}">

                <button type="button"
                    class="project-file-card-preview"
                    aria-label="مشاهده فایل ${escapeHtml(title)}"
                    ${url ? "" : "disabled"}>

                    <span class="project-file-card-visual">
                        ${preview}
                    </span>
                </button>

                ${deleteButton}

                <div class="project-file-card-body">
                    <div class="project-file-card-title"
                        title="${escapeHtml(title)}">
                        ${escapeHtml(title)}
                    </div>

                    <div class="project-file-card-meta">
                        <span>${escapeHtml(label)}</span>
                        <span class="project-file-card-dot">·</span>
                        <span>${escapeHtml(sourceLabel)}</span>
                    </div>
                </div>
            </article>
        `;
    };

    container.innerHTML = `
        <div class="project-files-center workshop-project-files-center"
            data-project-id="${escapeHtml(projectId)}">

            <div class="project-files-toolbar">
                <div class="project-files-search">
                    <span class="project-files-search-icon">⌕</span>
                    <input type="search"
                        class="project-files-search-input"
                        placeholder="جستجو در فایل‌ها..."
                        autocomplete="off">
                </div>

                <div class="project-files-filters" role="tablist">
                    <button type="button"
                        class="project-files-filter is-active"
                        data-file-filter="all">همه</button>
                    <button type="button"
                        class="project-files-filter"
                        data-file-filter="image">تصاویر</button>
                    <button type="button"
                        class="project-files-filter"
                        data-file-filter="document">اسناد</button>
                    <button type="button"
                        class="project-files-filter"
                        data-file-filter="design">طراحی</button>
                </div>
            </div>

            <div class="project-files-empty-search hidden">
                <span>⌕</span>
                <strong>فایلی پیدا نشد</strong>
                <small>عبارت جستجو یا فیلتر انتخابی را تغییر دهید.</small>
            </div>

            <div class="project-files-role-grid">
                ${roles.map(role => {
                    const files = fileGroups[role.key];

                    return `
                        <section class="project-file-role-card project-file-role-${role.accent}"
                            data-role-section="${role.key}">

                            <header class="project-file-role-header">
                                <div class="project-file-role-title">
                                    <span class="project-file-role-icon">${role.icon}</span>
                                    <div>
                                        <strong>${role.title}</strong>
                                        <small>${files.length
                                            ? `${files.length} فایل`
                                            : "فایلی ثبت نشده"}</small>
                                    </div>
                                </div>

                                <span class="project-file-role-count ${files.length ? "has-files" : ""}">
                                    ${String(files.length).padStart(2, "0")}
                                </span>
                            </header>

                            <div class="project-file-grid">
                                ${files.length
                                    ? files.map((file, index) =>
                                        renderCard(file, role, index)
                                    ).join("")
                                    : `<div class="project-file-empty">
                                            <span>+</span>
                                            <small>هنوز فایلی برای این بخش ثبت نشده</small>
                                       </div>`}
                            </div>
                        </section>
                    `;
                }).join("")}
            </div>
        </div>
    `;

    const searchInput = container.querySelector(".project-files-search-input");
    const filterButtons = Array.from(
        container.querySelectorAll(".project-files-filter")
    );
    const cards = Array.from(
        container.querySelectorAll(".project-file-card")
    );
    const emptySearch = container.querySelector(".project-files-empty-search");

    const totalElement = document.getElementById("workshop-files-total");
        if (totalElement) {
            totalElement.textContent = String(
                container.querySelectorAll(".project-file-card").length
            );
        }

        const applyFilters = () => {
        const query = (searchInput.value || "").trim().toLowerCase();
        const activeButton = filterButtons.find(
            button => button.classList.contains("is-active")
        );
        const activeFilter = activeButton
            ? activeButton.dataset.fileFilter
            : "all";

        let visibleCount = 0;

        cards.forEach(card => {
            const title = (card.dataset.fileTitle || "").toLowerCase();
            const extension = (card.dataset.fileExtension || "").toLowerCase();
            const kind = card.dataset.fileKind || "other";

            const visible =
                (!query || title.includes(query) || extension.includes(query)) &&
                (activeFilter === "all" || kind === activeFilter);

            card.classList.toggle("is-filtered-out", !visible);
            if (visible) visibleCount++;
        });

        container.querySelectorAll(".project-file-role-card").forEach(section => {
            const visibleCards = section.querySelectorAll(
                ".project-file-card:not(.is-filtered-out)"
            );

            section.classList.toggle("is-filter-empty", visibleCards.length === 0);
        });

        if (emptySearch) {
            emptySearch.classList.toggle("hidden", visibleCount !== 0);
        }
    };

    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            filterButtons.forEach(item => item.classList.remove("is-active"));
            button.classList.add("is-active");
            applyFilters();
        });
    });

    let previewModal = document.getElementById("workshop-file-preview-modal");

    if (!previewModal) {
        previewModal = document.createElement("div");
        previewModal.id = "workshop-file-preview-modal";
        previewModal.className = "workshop-file-preview-modal";
        previewModal.hidden = true;
        previewModal.innerHTML = `
            <div class="workshop-file-preview-backdrop" data-preview-close></div>
            <section class="workshop-file-preview-dialog"
                role="dialog" aria-modal="true"
                aria-labelledby="workshop-file-preview-title">
                <header class="workshop-file-preview-header">
                    <strong id="workshop-file-preview-title"></strong>
                    <button type="button" class="workshop-file-preview-close"
                        data-preview-close aria-label="Close preview">×</button>
                </header>
                <div class="workshop-file-preview-content"></div>
            </section>`;
        document.body.appendChild(previewModal);
    }

    const closePreview = () => {
        previewModal.hidden = true;
        previewModal.querySelector(".workshop-file-preview-content").innerHTML = "";
        document.body.classList.remove("workshop-file-preview-open");
    };

    previewModal.querySelectorAll("[data-preview-close]").forEach(button => {
        button.onclick = closePreview;
    });

    if (!previewModal.dataset.escapeBound) {
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && !previewModal.hidden) {
                closePreview();
            }
        });
        previewModal.dataset.escapeBound = "1";
    }

    container.onclick = async event => {
        const deleteButton = event.target.closest(".workshop-file-delete");

        if (deleteButton && container.contains(deleteButton)) {
            event.preventDefault();
            event.stopPropagation();

            const card = deleteButton.closest(".project-file-card");
            if (!card || card.dataset.role !== "workshop") return;

            const fileId = card.dataset.fileId;
            const cardProjectId = card.dataset.projectId;

            if (!fileId || !cardProjectId) return;
            if (!window.confirm("آیا از حذف این فایل مطمئن هستید؟")) return;

            const cookieMatch = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
            const csrfToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : "";

            deleteButton.disabled = true;

            try {
                const response = await fetch(
                    `/api/projects/${encodeURIComponent(cardProjectId)}/attachments/${encodeURIComponent(fileId)}/workshop-delete/`,
                    {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: {
                            "Accept": "application/json",
                            ...(csrfToken ? { "X-CSRFToken": csrfToken } : {})
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`Delete failed (HTTP ${response.status})`);
                }

                await this.loadFiles();
            } catch (error) {
                console.error("Workshop file delete:", error);
                window.alert("حذف فایل انجام نشد. دسترسی و اتصال را بررسی کنید.");
                deleteButton.disabled = false;
            }
            return;
        }

        const previewButton = event.target.closest(".project-file-card-preview");
        if (!previewButton || !container.contains(previewButton)) return;

        event.preventDefault();

        const card = previewButton.closest(".project-file-card");
        if (!card) return;

        const url = card.dataset.fileUrl;
        const title = card.dataset.fileTitle || "File preview";
        const kind = card.dataset.fileKind || "other";
        const extension = (card.dataset.fileExtension || "").toLowerCase();

        if (!url) return;

        previewModal.querySelector("#workshop-file-preview-title").textContent = title;

        const content = previewModal.querySelector(".workshop-file-preview-content");
        content.innerHTML = "";

        if (kind === "image") {
            const image = document.createElement("img");
            image.src = url;
            image.alt = title;
            content.appendChild(image);
        } else if (extension === "pdf") {
            const frame = document.createElement("iframe");
            frame.src = url;
            frame.title = title;
            frame.loading = "lazy";
            content.appendChild(frame);
        } else {
            const message = document.createElement("p");
            message.textContent = "پیش‌نمایش این نوع فایل در این پنجره پشتیبانی نمی‌شود.";
            const link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "باز کردن یا دریافت فایل";
            content.append(message, link);
        }

        previewModal.hidden = false;
        document.body.classList.add("workshop-file-preview-open");
    };

},
        uploadFiles: async function (projectId, files) {
            const container = document.getElementById(
                "workshop-project-files"
            );
            const button = document.getElementById(
                "workshop-upload-file-button"
            );

            const cookieMatch = document.cookie.match(
                /(?:^|;\s*)csrftoken=([^;]+)/
            );
            const csrfToken = cookieMatch
                ? decodeURIComponent(cookieMatch[1])
                : "";

            if (container) {
                container.insertAdjacentHTML(
                    "afterbegin",
                    '<div class="workshop-files-upload-status">در حال بارگذاری فایل‌ها...</div>'
                );
            }

            if (button) button.disabled = true;

            try {
                for (const file of files) {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("title", file.name);

                    const response = await fetch(
                        `/api/projects/${encodeURIComponent(projectId)}/attachments/`,
                        {
                            method: "POST",
                            credentials: "same-origin",
                            headers: csrfToken
                                ? { "X-CSRFToken": csrfToken }
                                : {},
                            body: formData
                        }
                    );

                    if (!response.ok) {
                        let message = `بارگذاری «${file.name}» ناموفق بود.`;
                        try {
                            const result = await response.json();
                            message = result.detail ||
                                result.error ||
                                JSON.stringify(result);
                        } catch (_) {}
                        throw new Error(message);
                    }
                }

                await this.loadFiles();
            } catch (error) {
                console.error("Workshop file upload:", error);
                if (container) {
                    const status = container.querySelector(
                        ".workshop-files-upload-status"
                    );
                    if (status) {
                        status.textContent =
                            error.message || "بارگذاری فایل ناموفق بود.";
                    } else {
                        container.insertAdjacentHTML(
                            "afterbegin",
                            `<div class="workshop-files-upload-status">${this.escape(
                                error.message || "بارگذاری فایل ناموفق بود."
                            )}</div>`
                        );
                    }
                }
            } finally {
                if (button) button.disabled = false;
            }
        },


        escape: function (value) {


            return String(
                value ?? ""
            )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );


        }


    };


})();