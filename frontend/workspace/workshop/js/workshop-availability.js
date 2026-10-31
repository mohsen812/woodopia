(function () {
    "use strict";

    function getCookie(name) {
        const prefix = name + "=";
        const cookies = document.cookie ? document.cookie.split(";") : [];

        for (const cookie of cookies) {
            const value = cookie.trim();
            if (value.startsWith(prefix)) {
                return decodeURIComponent(value.slice(prefix.length));
            }
        }

        return "";
    }

    document.addEventListener("DOMContentLoaded", function () {
        const control = document.getElementById("workshop-tender-availability");
        if (!control) return;

        const status = document.getElementById("workshop-tender-availability-status");
        const button = document.getElementById("workshop-tender-availability-toggle");
        const error = document.getElementById("workshop-tender-availability-error");

        let available = control.dataset.available === "true";

        function render() {
            control.dataset.available = String(available);

            if (status) {
                status.textContent = available
                    ? "آماده دریافت دعوت‌های جدید"
                    : "دریافت دعوت جدید غیرفعال";
            }

            if (button) {
                button.textContent = available
                    ? "غیرفعال‌کردن دریافت دعوت"
                    : "فعال‌کردن دریافت دعوت";
                button.setAttribute("aria-pressed", String(available));
            }
        }

        if (!button) {
            render();
            return;
        }

        button.addEventListener("click", async function () {
            if (button.disabled) return;

            const nextValue = !available;
            const csrfToken = getCookie("csrftoken");

            if (error) {
                error.hidden = true;
                error.textContent = "";
            }

            button.disabled = true;

            try {
                const response = await fetch(control.dataset.url, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-CSRFToken": csrfToken
                    },
                    body: JSON.stringify({
                        is_tender_available: nextValue
                    })
                });

                let data = {};
                try {
                    data = await response.json();
                } catch (_) {
                    data = {};
                }

                if (!response.ok || data.success !== true) {
                    throw new Error(
                        data.error || data.detail || "ذخیره وضعیت انجام نشد. دوباره تلاش کنید."
                    );
                }

                available = data.is_tender_available === true;
                render();
            } catch (err) {
                if (error) {
                    error.textContent = err.message || "خطا در ارتباط با سرور.";
                    error.hidden = false;
                }
            } finally {
                button.disabled = false;
            }
        });

        render();
    });
})();
