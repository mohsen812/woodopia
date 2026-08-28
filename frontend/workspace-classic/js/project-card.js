function createProjectCard(project) {

    const div = document.createElement("div");

    div.className = "project-card";

    div.innerHTML = `

        <h3>
            ${escapeHtml(project.title)}
        </h3>

        <div class="project-description">
            ${escapeHtml(project.description || "بدون توضیحات")}
        </div>

        <span class="project-status">
            وضعیت: ${escapeHtml(project.status)}
        </span>

    `;

    div.addEventListener("click", function () {

        showProject(project);

    });

    return div;
}


function showProject(project) {

    const modal =
        document.getElementById("project-modal");

    const detail =
        document.getElementById("project-detail");

    detail.innerHTML = `

        <div class="eyebrow">
            PROJECT #${project.id}
        </div>

        <h2>
            ${escapeHtml(project.title)}
        </h2>

        <p>
            ${escapeHtml(
                project.description ||
                "توضیحی برای این پروژه ثبت نشده است."
            )}
        </p>

        <p>
            وضعیت پروژه:
            <strong>
                ${escapeHtml(project.status)}
            </strong>
        </p>

        <div class="project-actions">

            <button class="project-action primary">
                مشاهده پروژه
            </button>

            <button class="project-action">
                پیام‌ها
            </button>

            <button class="project-action">
                قراردادها
            </button>

            ${
                project.status === "draft"
                ? `
                    <button class="project-action">
                        ارسال برای مشاور
                    </button>
                `
                : ""
            }

        </div>
    `;

    modal.classList.remove("hidden");
}


function closeProjectModal() {

    const modal =
        document.getElementById("project-modal");

    modal.classList.add("hidden");
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}
