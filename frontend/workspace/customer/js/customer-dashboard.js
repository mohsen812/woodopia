document.addEventListener(
"DOMContentLoaded",
function(){

    loadCustomerProjects();

    loadCustomerDashboard();

}

);

// =====================================
// CUSTOMER PROJECTS
// =====================================

async function loadCustomerProjects(){

const container =
    document.getElementById(
        "projects-list"
    );


if(!container){
    return;
}


try{

    const projects =
        await apiGet(
            "/projects/"
        );


    console.log(
        "CUSTOMER PROJECTS:",
        projects
    );


    if(projects.length === 0){

        container.innerHTML =
        `
        <div class="card">
            هنوز پروژه‌ای ثبت نشده است
        </div>
        `;

        return;

    }


    container.innerHTML = "";


    projects.forEach(
        project => {

            const card =
                createProjectCard(
                    project
                );


            container.appendChild(
                card
            );

        }
    );

}
catch(error){

    console.error(
        error
    );


    container.innerHTML =
    `
    خطا در دریافت پروژه‌ها
    `;

}

}

// =====================================
// CUSTOMER DASHBOARD — RECENT PROJECTS
// =====================================

async function loadCustomerDashboard(){

const container =
    document.getElementById(
        "projects"
    );


if(!container){
    return;
}


try{

    const projects =
        await apiGet(
            "/projects/"
        );


    console.log(
        "CUSTOMER DASHBOARD PROJECTS:",
        projects
    );


    if(
        !projects ||
        projects.length === 0
    ){

        container.innerHTML =
        `
        <div class="card">
            هنوز پروژه‌ای ثبت نشده است
        </div>
        `;

        return;

    }


    const recentProjects =
        projects.slice(
            0,
            3
        );


    container.innerHTML = "";


    recentProjects.forEach(
        project => {

            const card =
                createProjectCard(
                    project
                );


            container.appendChild(
                card
            );

        }
    );


}
catch(error){

    console.error(
        "FEEMAAS: Dashboard projects failed",
        error
    );


    container.innerHTML =
    `
    <div class="card">
        خطا در دریافت پروژه‌های اخیر
    </div>
    `;

}

}

// =====================================
// CUSTOMER WORKSPACE NAVIGATION
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        const navItems =
            document.querySelectorAll(
                "[data-view]"
            );


        const views =
            document.querySelectorAll(
                ".workspace-view"
            );


        const pageTitle =
            document.querySelector(
                ".topbar h1"
            );


        navItems.forEach(
            item => {


                item.addEventListener(
                    "click",
                    function(){


                        const target =
                            this.dataset.view;


                        if(
                            !target
                        ){
                            return;
                        }


                        views.forEach(
                            view => {

                                view.classList.add(
                                    "hidden"
                                );

                            }
                        );


                        const targetView =
                            document.getElementById(
                                target + "-view"
                            );


                        if(targetView){

                            targetView.classList.remove(
                                "hidden"
                            );

                            const developingViews = [
                                "tenders",
                                "messages",
                                "contracts",
                                "payments",
                                "files",
                                "settings"
                            ];

                            if(
                                developingViews.includes(target) &&
                                !targetView.querySelector(".workspace-coming-soon")
                            ){
                                const notice = document.createElement("div");
                                notice.className = "workspace-coming-soon";
                                notice.innerHTML = `
                                    <strong>این بخش در حال توسعه است</strong>
                                    <p>زیرساخت این قسمت هنوز تکمیل نشده است. پس از آماده‌شدن قابلیت‌ها، امکانات آن در همین بخش نمایش داده می‌شود.</p>
                                `;
                                targetView.appendChild(notice);
                            }

                        }


                        navItems.forEach(
                            nav => {

                                nav.classList.remove(
                                    "active"
                                );

                            }
                        );


                        this.classList.add(
                            "active"
                        );


                        if(pageTitle){

                            const titles = {

                                dashboard:
                                    "پیشخوان",

                                projects:
                                    "پروژه‌های من",

                                tenders:
                                    "مناقصه‌ها",

                                messages:
                                    "پیام‌ها",

                                contracts:
                                    "قراردادها",

                                payments:
                                    "پرداخت‌ها",

                                files:
                                    "فایل‌ها",

                                settings:
                                    "تنظیمات",

                                profile:
                                    "حساب کاربری"

                            };


                            pageTitle.innerText =
                                titles[target] ||
                                "Workspace";

                        }


                    }
                );


            }
        );


    }
);



// COLLABORATION_REQUEST_JS_V1
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("collaboration-request-modal");
    const form = document.getElementById("collaboration-request-form");
    const message = document.getElementById("collaboration-form-message");
    const history = document.getElementById("collaboration-request-history");
    const submit = form ? form.querySelector('[type="submit"]') : null;

    if (!modal || !form || !message || !history || !submit) return;

    const typeLabels = {
        workshop: "کارگاه",
        designer: "طراح",
        consultant: "مشاور"
    };
    const statusLabels = {
        pending: "در انتظار بررسی",
        approved: "تأیید شده",
        rejected: "رد شده"
    };

    function showMessage(text, isError) {
        message.textContent = text || "";
        message.classList.toggle("is-error", !!isError);
        message.classList.toggle("is-success", !!text && !isError);
    }

    function openModal() {
        modal.classList.remove("hidden");
        document.body.classList.add("collaboration-modal-open");
        showMessage("", false);
        loadHistory();
    }

    function closeModal() {
        modal.classList.add("hidden");
        document.body.classList.remove("collaboration-modal-open");
    }

    async function loadHistory() {
        history.textContent = "در حال دریافت درخواست‌ها…";
        try {
            const result = await apiGet("/access/collaboration-requests/");
            const requests = Array.isArray(result.requests) ? result.requests : [];

            history.replaceChildren();

            if (!requests.length) {
                history.textContent = "هنوز درخواستی ثبت نکرده‌اید.";
                return;
            }

            requests.forEach(function (item) {
                const card = document.createElement("article");
                card.className = "collaboration-history-card";

                const title = document.createElement("strong");
                title.textContent =
                    item.organization_name || typeLabels[item.requested_type] || "درخواست همکاری";

                const details = document.createElement("div");
                details.className = "collaboration-history-meta";
                details.textContent =
                    (typeLabels[item.requested_type] || item.requested_type) +
                    " · " + (item.created_at || "");

                const status = document.createElement("span");
                status.className = "collaboration-status collaboration-status-" + item.status;
                status.textContent = statusLabels[item.status] || "وضعیت نامشخص";

                card.append(title, details, status);
                history.appendChild(card);
            });
        } catch (error) {
            history.textContent = "دریافت درخواست‌ها ناموفق بود. دوباره تلاش کنید.";
        }
    }

    document.querySelectorAll('[data-action="collaboration-request"]').forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            openModal();
        });
    });

    modal.querySelectorAll("[data-collaboration-close]").forEach(function (element) {
        element.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        showMessage("", false);

        const data = {
            requested_type: form.elements.requested_type.value,
            organization_name: form.elements.organization_name.value.trim(),
            message: form.elements.message.value.trim(),
            social_network: form.elements.social_network.value,
            social_profile: form.elements.social_profile.value.trim()
        };

        if (!data.requested_type || !data.organization_name) {
            showMessage("نوع همکاری و نام مجموعه الزامی است.", true);
            return;
        }

        submit.disabled = true;
        submit.textContent = "در حال ثبت…";

        try {
            const result = await apiPost("/access/collaboration-requests/create/", data);
            showMessage(result.message || "درخواست ثبت شد.", false);
            form.reset();
            await loadHistory();
        } catch (error) {
            const detail = String(error.message || "");
            const match = detail.match(/-\s*(\{.*\})\s*$/);
            let friendly = "ثبت درخواست ناموفق بود. لطفاً دوباره تلاش کنید.";

            if (match) {
                try {
                    const parsed = JSON.parse(match[1]);
                    if (parsed.error) friendly = parsed.error;
                } catch (ignored) {}
            } else if (detail.includes("409")) {
                friendly = "برای این نوع همکاری یک درخواست در انتظار بررسی دارید.";
            } else if (detail.includes("403")) {
                friendly = "نشست شما منقضی شده است؛ صفحه را تازه‌سازی و دوباره وارد شوید.";
            }

            showMessage(friendly, true);
            await loadHistory();
        } finally {
            submit.disabled = false;
            submit.textContent = "ثبت درخواست";
        }
    });
});
// /COLLABORATION_REQUEST_JS_V1

// CUSTOMER_NAV_FALLBACK_V1
