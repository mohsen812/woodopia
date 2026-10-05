(function () {

    "use strict";


    window.WorkshopTender = {

        currentTender: null,

        currentBidId: null,

        currentBid: null,

        specifications: [],


        renderDashboard: function (invitations) {

            const container =
                document.getElementById("dashboard-invitations");

            if (!container) {
                return;
            }

            const items =
                (invitations || []).slice(0, 4);

            if (!items.length) {

                container.innerHTML = `
                    <div class="empty-state">
                        در حال حاضر دعوت مناقصه‌ای وجود ندارد.
                    </div>
                `;

                return;
            }

            container.innerHTML =
                items
                    .map(item => this.invitationHTML(item))
                    .join("");

        },


        renderInvitations: function (invitations) {

            const container =
                document.getElementById("workshop-tender-list");

            if (!container) {
                return;
            }

            if (!invitations.length) {

                container.innerHTML = `
                    <div class="empty-state">
                        در حال حاضر دعوت مناقصه‌ای وجود ندارد.
                    </div>
                `;

                return;
            }

            container.innerHTML =
                invitations
                    .map(item => this.invitationHTML(item))
                    .join("");

        },


        invitationHTML: function (item) {

            const status =
                item.response_status || "pending";

            let statusText =
                "در انتظار پاسخ";

            if (status === "accepted") {
                statusText = "پذیرفته شده";
            }

            if (status === "declined") {
                statusText = "عدم شرکت";
            }

            return `

                <div
                    class="invitation-item"
                    data-tender-id="${item.tender}">

                    <div class="invitation-main">

                        <h4>
                            ${this.escape(
                                item.tender_title || "مناقصه"
                            )}
                        </h4>

                        <p>
                            پروژه:
                            ${this.escape(
                                item.project_title || "-"
                            )}
                        </p>

                        <div class="invitation-meta">

                            <span class="meta-chip">
                                وضعیت: ${statusText}
                            </span>

                            ${
                                item.invited_at
                                ? `
                                <span class="meta-chip">
                                    دعوت:
                                    ${this.formatDate(
                                        item.invited_at
                                    )}
                                </span>
                                `
                                : ""
                            }

                        </div>

                    </div>

                    <div class="invitation-actions">

                        <button
                            type="button"
                            class="secondary-button"
                            data-view-tender
                            data-tender-id="${item.tender}">

                            مشاهده

                        </button>

                        ${
                            status === "pending"
                            ? `

                                <button
                                    type="button"
                                    class="accept-button"
                                    data-respond-tender="accepted"
                                    data-participant-id="${item.id}">

                                    قبول شرکت

                                </button>

                                <button
                                    type="button"
                                    class="decline-button"
                                    data-respond-tender="declined"
                                    data-participant-id="${item.id}">

                                    عدم شرکت

                                </button>

                            `
                            : ""
                        }

                    </div>

                </div>

            `;

        },


        open: async function (tender) {

            if (!tender) {
                return;
            }

            const tenderId =
                tender.tender ||
                tender.tender_id;

            if (!tenderId) {

                console.error(
                    "Workshop Tender: Tender ID not found.",
                    tender
                );

                this.renderTenderMessage(
                    "شناسه مناقصه برای این دعوت مشخص نیست."
                );

                return;
            }

            const project = {

                title:
                    tender.project_title ||
                    "پروژه",

                tender_title:
                    tender.tender_title ||
                    "مناقصه",

                tender_id:
                    tenderId,

                participant_id:
                    tender.id || null,

                bid_id:
                    tender.bid_id || null

            };

            console.log(
                "Workshop Tender Open:",
                {
                    participantId: tender.id,
                    tenderId: tenderId,
                    bidId: tender.bid_id || null,
                    project: project
                }
            );

            if (!window.WorkshopProject) {
                return;
            }

            WorkshopProject.open(project);

            const tenderTab =
                document.querySelector(
                    '[data-project-tab="proposal"]'
                );

            if (tenderTab) {
                tenderTab.click();
            }

        },


        loadForProject: async function (project) {

            const tenderId =
                project &&
                (
                    project.tender_id ||
                    project.tender
                );

            if (!tenderId) {

                this.renderTenderMessage(
                    "شناسه مناقصه برای این پروژه مشخص نیست."
                );

                return;
            }

            this.currentBidId =
                project.bid_id ||
                this.currentBidId ||
                null;

            await this.loadTender(
                tenderId,
                this.currentBidId
            );

        },


        loadTender: async function (
            tenderId,
            bidId
        ) {

            const container =
                document.getElementById(
                    "workshop-tender-view"
                );

            if (!container) {
                return;
            }

            container.innerHTML = `
                <div class="empty-state">
                    در حال دریافت اطلاعات مناقصه...
                </div>
            `;

            try {

                const response =
                    await fetch(
                        `/api/tenders/${tenderId}/workshop-specifications/`,
                        {
                            credentials: "same-origin",
                            headers: {
                                "Accept": "application/json"
                            }
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}`
                    );
                }

                const data =
                    await response.json();

                this.specifications =
                    Array.isArray(data)
                        ? data
                        : (
                            data.results || []
                        );

                this.currentTender =
                    tenderId;

                this.currentBidId =
                    bidId || this.currentBidId;

                console.log(
                    "Workshop Tender Loaded:",
                    {
                        tenderId: tenderId,
                        bidId: this.currentBidId,
                        specifications:
                            this.specifications
                    }
                );

                if (!this.currentBidId) {

                    this.renderTenderMessage(
                        "شناسه پیشنهاد کارگاه برای این مناقصه مشخص نیست."
                    );

                    return;
                }

                await this.loadBid(
                    this.currentBidId
                );

            }
            catch (error) {

                console.error(
                    "Tender specification error:",
                    error
                );

                this.renderTenderMessage(
                    "دریافت اطلاعات مناقصه انجام نشد."
                );

            }

        },


        loadBid: async function (bidId) {

            try {

                const response =
                    await fetch(
                        `/api/tenders/bids/${bidId}/`,
                        {
                            credentials: "same-origin",
                            headers: {
                                "Accept": "application/json"
                            }
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}`
                    );
                }

                this.currentBid =
                    await response.json();

                console.log(
                    "Workshop Bid Loaded:",
                    this.currentBid
                );

                this.renderTender(
                    this.specifications
                );

            }
            catch (error) {

                console.error(
                    "Bid loading error:",
                    error
                );

                this.renderTenderMessage(
                    "دریافت پیشنهاد کارگاه انجام نشد."
                );

            }

        },


        renderTender: function (specifications) {

            const container =
                document.getElementById(
                    "workshop-tender-view"
                );

            if (!container) {
                return;
            }

            if (!specifications.length) {

                this.renderTenderMessage(
                    "برای این مناقصه هنوز ردیف استانداردسازی وجود ندارد."
                );

                return;
            }

            const bid =
                this.currentBid || {};

            const submitted =
                bid.status &&
                bid.status !== "draft";

            container.innerHTML = `

                <div class="tender-header">

                    <div>

                        <h3>
                            جدول پیشنهاد کارگاه
                        </h3>

                        <p>
                            قیمت، شرایط تولید و برنامه پرداخت پیشنهاد خود را تکمیل کنید.
                        </p>

                        ${
                            submitted
                            ? `
                                <div class="meta-chip">
                                    وضعیت پیشنهاد:
                                    ${this.escape(
                                        this.bidStatusText(
                                            bid.status
                                        )
                                    )}
                                </div>
                            `
                            : ""
                        }

                    </div>

                    <button
                        type="button"
                        class="primary-button"
                        data-submit-workshop-bid
                        ${submitted ? "disabled" : ""}>

                        ${
                            submitted
                            ? "پیشنهاد ارسال شده"
                            : "ارسال پیشنهاد"
                        }

                    </button>

                </div>


                <div class="spec-table-wrapper">

                    <table class="spec-table">

                        <thead>

                            <tr>

                                <th>ردیف</th>

                                <th>عنوان</th>

                                <th>تعداد</th>

                                <th>ابعاد</th>

                                <th>متریال</th>

                                <th>مشخصات فنی</th>

                                <th>فایل</th>

                                <th>قیمت واحد</th>

                                <th>مبلغ کل</th>

                                <th>قابلیت ساخت</th>

                                <th>توضیحات کارگاه</th>

                            </tr>

                        </thead>

                        <tbody>

                            ${specifications
                                .map(
                                    item =>
                                        this.rowHTML(item)
                                )
                                .join("")}

                        </tbody>

                    </table>

                </div>


                <div class="bid-total-box">

                    <div class="bid-total">

                        <span>
                            جمع کل پیشنهاد
                        </span>

                        <strong
                            id="workshop-bid-total">

                            0

                        </strong>

                    </div>


                    <div class="bid-form-grid">

                        <div class="bid-field">

                            <label>
                                درصد تخفیف
                            </label>

                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                class="spec-input"
                                data-discount
                                value="${this.escapeAttribute(
                                    bid.discount_percentage || 0
                                )}"
                                ${submitted ? "disabled" : ""}
                            >

                        </div>


                        <div class="bid-field">

                            <label>
                                مبلغ کل / معیار قیمت
                            </label>

                            <div
                                class="calculated-field"
                                data-final-amount>

                                0

                            </div>

                        </div>


                        <div class="bid-field">

                            <label>
                                مدت تولید / ساخت (روز)
                            </label>

                            <input
                                type="number"
                                min="1"
                                step="1"
                                class="spec-input"
                                data-production-days
                                value="${this.escapeAttribute(
                                    bid.production_days || ""
                                )}"
                                ${submitted ? "disabled" : ""}
                            >

                        </div>


                        <div class="bid-field">

                            <label>
                                مدت تحویل (روز)
                            </label>

                            <input
                                type="number"
                                min="1"
                                step="1"
                                class="spec-input"
                                data-delivery-days
                                value="${this.escapeAttribute(
                                    bid.delivery_days || ""
                                )}"
                                ${submitted ? "disabled" : ""}
                            >

                        </div>


                        <div class="bid-field">

                            <label>
                                گارانتی (ماه)
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="1"
                                class="spec-input"
                                data-warranty-months
                                value="${this.escapeAttribute(
                                    bid.warranty_months || ""
                                )}"
                                ${submitted ? "disabled" : ""}
                            >

                        </div>


                        <div class="bid-field bid-field-wide">

                            <label>
                                توضیحات فنی پیشنهاد
                            </label>

                            <textarea
                                class="spec-input"
                                data-bid-technical-notes
                                rows="3"
                                placeholder="توضیحات کلی کارگاه درباره پیشنهاد"
                                ${submitted ? "disabled" : ""}
                            >${this.escape(
                                bid.technical_notes || ""
                            )}</textarea>

                        </div>

                    </div>


                    <div class="payment-section">

                        <div class="payment-section-header">

                            <div>

                                <h4>
                                    برنامه پرداخت
                                </h4>

                                <p>
                                    تعداد مراحل و درصد هر مرحله را مشخص کنید.
                                </p>

                            </div>


                            <div class="bid-field">

                                <label>
                                    تعداد مراحل
                                </label>

                                <select
                                    class="spec-input"
                                    data-payment-stage-count
                                    ${submitted ? "disabled" : ""}>

                                    <option value="1">۱ مرحله</option>
                                    <option value="2">۲ مرحله</option>
                                    <option value="3">۳ مرحله</option>
                                    <option value="4">۴ مرحله</option>
                                    <option value="5">۵ مرحله</option>
                                    <option value="6">۶ مرحله</option>

                                </select>

                            </div>

                        </div>


                        <div
                            class="payment-stage-list"
                            data-payment-stage-list>
                        </div>


                        <div class="payment-summary">

                            <span>
                                مجموع درصد پرداخت
                            </span>

                            <strong
                                data-payment-percentage-total>
                                ۰٪
                            </strong>

                            <span>
                                مجموع مبلغ مراحل
                            </span>

                            <strong
                                data-payment-amount-total>
                                ۰
                            </strong>

                        </div>

                    </div>

                </div>

            `;

            this.bindSpecificationEvents();

            this.initializePaymentStages();

            this.updateTotals();

            this.updateFinalAmount();

            this.setFormLocked(
                submitted
            );

        },


        rowHTML: function (item) {

            const id =
                item.id;

		    const quantity =
                Number(
                    item.quantity || 0
                );

            const projectItemId =
                item.project_item ||
                item.project_item_id ||
                "";

            const existingItem =
                this.findExistingBidItem(
                    projectItemId
                );

            const unitPrice =
                existingItem
                    ? existingItem.unit_price
                    : "";

            const availability =
                existingItem
                    ? existingItem.availability
                    : "";

            const technicalNotes =
                existingItem
                    ? existingItem.technical_notes
                    : "";

            return `

                <tr
                    data-specification-id="${id}"
                    data-project-item-id="${this.escapeAttribute(
                        projectItemId
                    )}">

                <td class="spec-row-number">

                    ${this.escape(
                        item.row_number || "-"
                    )}

                </td>


                <td>

                    ${this.escape(
                        item.title || "-"
                    )}

                </td>


                <td>

                    ${this.escape(
                        quantity
                    )}

                </td>


                <td>

                    ${this.escape(
                        item.dimensions || "-"
                    )}

                </td>


                <td>

                    ${this.escape(
                        item.material || "-"
                    )}

                </td>


                <td>

                    ${this.escape(
                        item.technical_details ||
                        item.description ||
                        "-"
                    )}

                </td>


                <td>

                    <button
                        type="button"
                        class="file-count-button"
                        data-specification-files
                        data-specification-id="${id}"
                        data-specification-title="${this.escapeAttribute(
                            item.title || "ردیف"
                        )}">

                        📎 فایل‌ها

                    </button>

                </td>


                <td>

                    <input
                        type="number"
                        min="0"
                        step="1"
                        class="spec-input"
                        data-unit-price
                        placeholder="قیمت"
                        value="${this.escapeAttribute(
                            unitPrice
                        )}"
                        ${this.isBidSubmitted() ? "disabled" : ""}
                    >

                </td>


                <td>

                    <div
                        class="line-total-field"
                        data-line-total>

                        0

                    </div>

                </td>


                <td>

                    <select
                        class="spec-input"
                        data-availability
                        ${this.isBidSubmitted() ? "disabled" : ""}>

                        <option value="">
                            انتخاب
                        </option>

                        <option
                            value="available"
                            ${availability === "available" ? "selected" : ""}>
                            قابل ساخت
                        </option>

                        <option
                            value="conditional"
                            ${availability === "conditional" ? "selected" : ""}>
                            قابل ساخت مشروط
                        </option>

                        <option
                            value="unavailable"
                            ${availability === "unavailable" ? "selected" : ""}>
                            غیرقابل ساخت
                        </option>

                    </select>

                </td>


                <td>

                    <input
                        type="text"
                        class="spec-input"
                        data-technical-notes
                        placeholder="توضیح کارگاه"
                        value="${this.escapeAttribute(
                            technicalNotes
                        )}"
                        ${this.isBidSubmitted() ? "disabled" : ""}
                    >

                </td>

            </tr>

        `;

    },


        bindSpecificationEvents: function () {

            document
                .querySelectorAll("[data-unit-price]")
                .forEach((input) => {

                    input.addEventListener(
                        "input",
                        () => {

                            this.updateTotals();
                            this.updateFinalAmount();
                            this.updatePaymentAmounts();

                        }
                    );

                });


            const discount =
                document.querySelector(
                    "[data-discount]"
                );

            if (discount) {

                discount.addEventListener(
                    "input",
                    () => {

                        this.updateFinalAmount();
                        this.updatePaymentAmounts();

                    }
                );

            }


            document
                .querySelectorAll(
                    "[data-specification-files]"
                )
                .forEach((button) => {

                    button.addEventListener(
                        "click",
                        () => {

                            this.openFiles(
                                button.dataset.specificationId,
                                button.dataset.specificationTitle
                            );

                        }
                    );

                });


            const stageCount =
                document.querySelector(
                    "[data-payment-stage-count]"
                );

            if (stageCount) {

                stageCount.addEventListener(
                    "change",
                    () => {

                        this.renderPaymentStages(
                            Number(stageCount.value) || 1
                        );

                    }
                );

            }


            const submit =
                document.querySelector(
                    "[data-submit-workshop-bid]"
                );

            if (submit) {

                submit.addEventListener(
                    "click",
                    () => {

                        this.submitBid();

                    }
                );

            }

        },


        updateTotals: function () {

            let grandTotal = 0;

            document
                .querySelectorAll(
                    ".spec-table tbody tr"
                )
                .forEach((row) => {

                    const quantityCell =
                        row.children[2];

                    const quantity =
                        Number(
                            quantityCell &&
                            quantityCell.textContent
                                .trim()
                                .replace(/,/g, "")
                        ) || 0;

                    const priceInput =
                        row.querySelector(
                            "[data-unit-price]"
                        );

                    const lineTotal =
                        row.querySelector(
                            "[data-line-total]"
                        );

                    const unitPrice =
                        Number(
                            priceInput &&
                            priceInput.value
                        ) || 0;

                    const total =
                        quantity *
                        unitPrice;

                    grandTotal += total;

                    if (lineTotal) {

                        lineTotal.textContent =
                            this.formatMoney(
                                total
                            );

                    }

                });


            const totalElement =
                document.getElementById(
                    "workshop-bid-total"
                );

            if (totalElement) {

                totalElement.textContent =
                    this.formatMoney(
                        grandTotal
                    );

            }

            return grandTotal;

        },


        getGrandTotal: function () {

            let total = 0;

            document
                .querySelectorAll(
                    ".spec-table tbody tr"
                )
                .forEach((row) => {

                    const quantityCell =
                        row.children[2];

                    const quantity =
                        Number(
                            quantityCell &&
                            quantityCell.textContent
                                .trim()
                                .replace(/,/g, "")
                        ) || 0;

                    const input =
                        row.querySelector(
                            "[data-unit-price]"
                        );

                    const unitPrice =
                        Number(
                            input &&
                            input.value
                        ) || 0;

                    total +=
                        quantity *
                        unitPrice;

                });

            return total;

        },

        updateFinalAmount: function () {

            const total =
                this.getGrandTotal();

            const discountInput =
                document.querySelector(
                    "[data-discount]"
                );

            const discount =
                Math.min(
                    100,
                    Math.max(
                        0,
                        Number(
                            discountInput &&
                            discountInput.value
                        ) || 0
                    )
                );

            const discountAmount =
                total *
                discount /
                100;

            const finalAmount =
                total -
                discountAmount;

            const element =
                document.querySelector(
                    "[data-final-amount]"
                );

            if (element) {

                element.textContent =
                    this.formatMoney(
                        finalAmount
                    );

            }

            return finalAmount;

        },


        initializePaymentStages: function () {

            const select =
                document.querySelector(
                    "[data-payment-stage-count]"
                );

            if (!select) {
                return;
            }

            const existing =
                (
                    this.currentBid &&
                    Array.isArray(
                        this.currentBid.payment_schedules
                    )
                )
                ? this.currentBid.payment_schedules
                : [];

            const count =
                existing.length
                    ? existing.length
                    : 1;

            select.value =
                String(count);

            this.renderPaymentStages(
                count,
                existing
            );

        },


        renderPaymentStages: function (
            count,
            existingSchedules
        ) {

            const container =
                document.querySelector(
                    "[data-payment-stage-list]"
                );

            if (!container) {
                return;
            }

            const existing =
                existingSchedules ||
                this.getCurrentPaymentSchedules();

            let values = [];

            if (existing.length) {

                values =
                    existing.map(
                        item =>
                            Number(
                                item.percentage
                            ) || 0
                    );

            }
            else {

                const equal =
                    100 / count;

                values =
                    Array.from(
                        { length: count },
                        () => Number(
                            equal.toFixed(2)
                        )
                    );

                let difference =
                    100 -
                    values.reduce(
                        (sum, value) =>
                            sum + value,
                        0
                    );

                if (values.length) {

                    values[values.length - 1] =
                        Number(
                            (
                                values[values.length - 1] +
                                difference
                            ).toFixed(2)
                        );

                }

            }

            while (values.length < count) {
                values.push(0);
            }

            values =
                values.slice(0, count);

            container.innerHTML =
                values
                    .map(
                        (percentage, index) => `
                            <div
                                class="payment-stage-row"
                                data-payment-stage
                                data-stage-order="${index + 1}">

                                <div class="payment-stage-number">
                                    مرحله ${this.toPersianNumber(
                                        index + 1
                                    )}
                                </div>

                                <input
                                    type="text"
                                    class="spec-input"
                                    data-payment-title
                                    value="${this.escapeAttribute(
                                        existing[index]
                                            ? existing[index].title
                                            : `مرحله ${index + 1}`
                                    )}"
                                    placeholder="عنوان مرحله"
                                    ${this.isBidSubmitted() ? "disabled" : ""}
                                >

                                <input
                                    type="number"
                                    min="0.01"
                                    max="100"
                                    step="0.01"
                                    class="spec-input"
                                    data-payment-percentage
                                    value="${this.escapeAttribute(
                                        percentage
                                    )}"
                                    ${this.isBidSubmitted() ? "disabled" : ""}
                                >

                                <div
                                    class="calculated-field"
                                    data-payment-amount>

                                    0

                                </div>

                            </div>
                        `
                    )
                    .join("");

            container
                .querySelectorAll(
                    "[data-payment-percentage]"
                )
                .forEach((input) => {

                    input.addEventListener(
                        "input",
                        () => {

                            this.updatePaymentAmounts();

                        }
                    );

                });

            this.updatePaymentAmounts();

        },


        updatePaymentAmounts: function () {

            const finalAmount =
                this.updateFinalAmount();

            let percentageTotal = 0;

            let amountTotal = 0;

            document
                .querySelectorAll(
                    "[data-payment-stage]"
                )
                .forEach((stage) => {

                    const percentageInput =
                        stage.querySelector(
                            "[data-payment-percentage]"
                        );

                    const amountElement =
                        stage.querySelector(
                            "[data-payment-amount]"
                        );

                    const percentage =
                        Number(
                            percentageInput &&
                            percentageInput.value
                        ) || 0;

                    const amount =
                        finalAmount *
                        percentage /
                        100;

                    percentageTotal +=
                        percentage;

                    amountTotal +=
                        amount;

                    if (amountElement) {

                        amountElement.textContent =
                            this.formatMoney(
                                amount
                            );

                    }

                });

            const percentageElement =
                document.querySelector(
                    "[data-payment-percentage-total]"
                );

            const amountElement =
                document.querySelector(
                    "[data-payment-amount-total]"
                );

            if (percentageElement) {

                percentageElement.textContent =
                    `${this.formatMoney(
                        percentageTotal
                    )}٪`;

            }

            if (amountElement) {

                amountElement.textContent =
                    this.formatMoney(
                        amountTotal
                    );

            }

            return {
                percentageTotal:
                    percentageTotal,

                amountTotal:
                    amountTotal

            };

        },


        getCurrentPaymentSchedules: function () {

            const schedules =
                this.currentBid &&
                Array.isArray(
                    this.currentBid.payment_schedules
                )
                ? this.currentBid.payment_schedules
                : [];

            return schedules;

        },


        collectPaymentStages: function () {

            const stages = [];

            document
                .querySelectorAll(
                    "[data-payment-stage]"
                )
                .forEach((stage, index) => {

                    const titleInput =
                        stage.querySelector(
                            "[data-payment-title]"
                        );

                    const percentageInput =
                        stage.querySelector(
                            "[data-payment-percentage]"
                        );

                    stages.push({

                        stage_order:
                            index + 1,

                        title:
                            (
                                titleInput &&
                                titleInput.value.trim()
                            ) ||
                            `مرحله ${index + 1}`,

                        percentage:
                            Number(
                                percentageInput &&
                                percentageInput.value
                            ) || 0

                    });

                });

            return stages;

        },


        collectBidItems: function () {

            const items = [];

            document
                .querySelectorAll(
                    ".spec-table tbody tr"
                )
                .forEach((row) => {

                    const projectItemId =
                        row.dataset.projectItemId;

                    const quantity =
                        Number(
                            row
                                .children[2]
                                .textContent
                                .trim()
                                .replace(/,/g, "")
                        ) || 0;

                    const unitPriceInput =
                        row.querySelector(
                            "[data-unit-price]"
                        );

                    const availabilityInput =
                        row.querySelector(
                            "[data-availability]"
                        );

                    const notesInput =
                        row.querySelector(
                            "[data-technical-notes]"
                        );

                    if (!projectItemId) {
                        return;
                    }

                    items.push({

                        project_item:
                            Number(
                                projectItemId
                            ),

                        quantity:
                            quantity,

                        unit_price:
                            Number(
                                unitPriceInput &&
                                unitPriceInput.value
                            ) || 0,

                        availability:
                            (
                                availabilityInput &&
                                availabilityInput.value
                            ) || "available",

                        technical_notes:
                            (
                                notesInput &&
                                notesInput.value.trim()
                            ) || ""

                    });

                });

            return items;

        },


        submitBid: async function () {

            if (!this.currentBidId) {

                this.showMessage(
                    "پیشنهاد کارگاه پیدا نشد."
                );

                return;

            }

            if (
                this.currentBid &&
                this.currentBid.status !== "draft"
            ) {

                this.showMessage(
                    "این پیشنهاد قبلاً ارسال شده و قابل ویرایش نیست."
                );

                return;

            }

            const items =
                this.collectBidItems();

            if (!items.length) {

                this.showMessage(
                    "حداقل یک ردیف برای پیشنهاد ثبت کنید."
                );

                return;

            }

            const paymentStages =
                this.collectPaymentStages();

            const percentageTotal =
                paymentStages.reduce(
                    (sum, stage) =>
                        sum + stage.percentage,
                    0
                );

            if (
                Math.abs(
                    percentageTotal - 100
                ) > 0.01
            ) {

                this.showMessage(
                    "مجموع درصد مراحل پرداخت باید دقیقاً ۱۰۰٪ باشد."
                );

                return;

            }

            const invalidPaymentStage =
                paymentStages.some(
                    stage =>
                        stage.percentage <= 0
                );

            if (invalidPaymentStage) {

                this.showMessage(
                    "درصد هر مرحله پرداخت باید بیشتر از صفر باشد."
                );

                return;

            }

            const invalidProjectItem =
                items.some(
                    item =>
                        !item.project_item
                );

            if (invalidProjectItem) {

                this.showMessage(
                    "یکی از ردیف‌های پیشنهاد شناسه آیتم پروژه ندارد."
                );

                return;

            }

            const conditionalAvailability =
                items.some(
                    item =>
                        item.availability === "conditional"
                );

            if (conditionalAvailability) {

                this.showMessage(
                    "گزینه «مشروط» فعلاً در Backend قابل ثبت نیست. برای ارسال نهایی «آماده» یا «غیرقابل انجام» را انتخاب کنید."
                );

                return;

            }

            const grandTotal =
                this.getGrandTotal();

            if (grandTotal <= 0) {

                this.showMessage(
                    "جمع مبلغ پیشنهاد باید بیشتر از صفر باشد."
                );

                return;

            }

            const discountInput =
                document.querySelector(
                    "[data-discount]"
                );

            const discountPercentage =
                Number(
                    discountInput &&
                    discountInput.value
                ) || 0;

            const productionDays =
                this.getNumberValue(
                    "[data-production-days]"
                );

            const deliveryDays =
                this.getNumberValue(
                    "[data-delivery-days]"
                );

            const warrantyMonths =
                this.getNumberValue(
                    "[data-warranty-months]"
                );

            const technicalNotesElement =
                document.querySelector(
                    "[data-bid-technical-notes]"
                );

            const technicalNotes =
                technicalNotesElement
                    ? technicalNotesElement.value.trim()
                    : "";

            const confirmed =
                await this.showSubmitConfirmation();

            if (!confirmed) {
                return;
            }

            const submitButton =
                document.querySelector(
                    "[data-submit-workshop-bid]"
                );

            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "در حال ثبت پیشنهاد...";

            }

            try {

                /*
                 * ------------------------------------------
                 * STEP 1
                 * UPDATE BID BASIC INFORMATION
                 * ------------------------------------------
                 */

                await this.updateBid({

                    production_days:
                        productionDays,

                    delivery_days:
                        deliveryDays,

                    warranty_months:
                        warrantyMonths,

                    technical_notes:
                        technicalNotes

                });


                /*
                 * ------------------------------------------
                 * STEP 2
                 * UPDATE DISCOUNT
                 * ------------------------------------------
                 */

                await this.updateDiscount(
                    discountPercentage
                );


                /*
                 * ------------------------------------------
                 * STEP 3
                 * CREATE BID ITEMS
                 * ------------------------------------------
                 */

                const existingItems =
                    (
                        this.currentBid &&
                        Array.isArray(
                            this.currentBid.items
                        )
                    )
                    ? this.currentBid.items
                    : [];

                if (existingItems.length) {

                    throw new Error(
                        "این پیشنهاد قبلاً دارای ردیف‌های ثبت‌شده است. برای جلوگیری از ثبت تکراری، ارسال متوقف شد."
                    );

                }

                for (
                    const item of items
                ) {

                    await this.createBidItem(
                        item
                    );

                }


                /*
                 * ------------------------------------------
                 * STEP 4
                 * CREATE PAYMENT SCHEDULES
                 * ------------------------------------------
                 */

                const existingSchedules =
                    (
                        this.currentBid &&
                        Array.isArray(
                            this.currentBid.payment_schedules
                        )
                    )
                    ? this.currentBid.payment_schedules
                    : [];

                if (existingSchedules.length) {

                    throw new Error(
                        "این پیشنهاد قبلاً دارای مراحل پرداخت ثبت‌شده است. برای جلوگیری از ثبت تکراری، ارسال متوقف شد."
                    );

                }

                for (
                    const stage of paymentStages
                ) {

                    await this.createPaymentSchedule(
                        stage
                    );

                }


                /*
                 * ------------------------------------------
                 * STEP 5
                 * FINAL SUBMIT
                 * ------------------------------------------
                 */

                const submitResponse =
                    await fetch(
                        `/api/tenders/bids/${this.currentBidId}/submit/`,
                        {
                            method: "POST",

                            credentials: "same-origin",

                            headers: {
                                "Accept":
                                    "application/json",

                                "X-CSRFToken":
                                    this.getCSRFToken()
                            }
                        }
                    );

                const submitData =
                    await this.readJSON(
                        submitResponse
                    );

                if (!submitResponse.ok) {

                    throw new Error(
                        submitData.detail ||
                        submitData.error ||
                        "ارسال نهایی پیشنهاد انجام نشد."
                    );

                }

                this.currentBid =
                    {
                        ...this.currentBid,

                        ...submitData,

                        status:
                            submitData.bid_status ||
                            "submitted"

                    };

                this.setFormLocked(
                    true
                );

                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "پیشنهاد ارسال شد";

                }

                this.showMessage(
                    "پیشنهاد شما با موفقیت ثبت و نهایی شد."
                );

                console.log(
                    "Workshop Bid Submitted:",
                    submitData
                );

            }
            catch (error) {

                console.error(
                    "Workshop Bid submission error:",
                    error
                );

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "ارسال پیشنهاد";

                }

                this.showMessage(
                    error.message ||
                    "ثبت پیشنهاد انجام نشد."
                );

            }

        },


        updateBid: async function (payload) {

            const response =
                await fetch(
                    `/api/tenders/bids/${this.currentBidId}/update/`,
                    {
                        method: "PATCH",

                        credentials: "same-origin",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json",

                            "X-CSRFToken":
                                this.getCSRFToken()
                        },

                        body:
                            JSON.stringify(
                                payload
                            )

                    }
                );

            const data =
                await this.readJSON(
                    response
                );

            if (!response.ok) {

                throw new Error(
                    this.extractError(
                        data,
                        "ذخیره اطلاعات پیشنهاد انجام نشد."
                    )
                );

            }

            this.currentBid =
                {
                    ...this.currentBid,
                    ...data
                };

            return data;

        },


        updateDiscount: async function (
            discountPercentage
        ) {

            const response =
                await fetch(
                    `/api/tenders/bids/${this.currentBidId}/discount/`,
                    {
                        method: "PATCH",

                        credentials: "same-origin",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json",

                            "X-CSRFToken":
                                this.getCSRFToken()
                        },

                        body:
                            JSON.stringify({
                                discount_percentage:
                                    discountPercentage
                            })

                    }
                );

            const data =
                await this.readJSON(
                    response
                );

            if (!response.ok) {

                throw new Error(
                    this.extractError(
                        data,
                        "ذخیره تخفیف انجام نشد."
                    )
                );

            }

            this.currentBid =
                {
                    ...this.currentBid,
                    ...data
                };

            return data;

        },


        createBidItem: async function (
            item
        ) {

            const response =
                await fetch(
                    `/api/tenders/bids/${this.currentBidId}/items/`,
                    {
                        method: "POST",

                        credentials: "same-origin",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json",

                            "X-CSRFToken":
                                this.getCSRFToken()
                        },

                        body:
                            JSON.stringify(
                                item
                            )

                    }
                );

            const data =
                await this.readJSON(
                    response
                );

            if (!response.ok) {

                throw new Error(
                    this.extractError(
                        data,
                        "ثبت یکی از ردیف‌های پیشنهاد انجام نشد."
                    )
                );

            }

            return data;

        },


        createPaymentSchedule: async function (
            stage
        ) {

            const response =
                await fetch(
                    `/api/tenders/bids/${this.currentBidId}/payment-schedules/`,
                    {
                        method: "POST",

                        credentials: "same-origin",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json",

                            "X-CSRFToken":
                                this.getCSRFToken()
                        },

                        body:
                            JSON.stringify({
                                title:
                                    stage.title,

                                percentage:
                                    stage.percentage

                            })

                    }
                );

            const data =
                await this.readJSON(
                    response
                );

            if (!response.ok) {

                throw new Error(
                    this.extractError(
                        data,
                        "ثبت یکی از مراحل پرداخت انجام نشد."
                    )
                );

            }

            return data;

        },


        findExistingBidItem: function (
            projectItemId
        ) {

            if (
                !this.currentBid ||
                !Array.isArray(
                    this.currentBid.items
                )
            ) {

                return null;

            }

            return (
                this.currentBid.items.find(
                    item =>
                        String(
                            item.project_item
                        ) ===
                        String(
                            projectItemId
                        )
                ) ||
                null
            );

        },


        getNumberValue: function (
            selector
        ) {

            const element =
                document.querySelector(
                    selector
                );

            if (!element) {
                return null;
            }

            if (
                element.value === "" ||
                element.value === null
            ) {

                return null;

            }

            const value =
                Number(
                    element.value
                );

            return Number.isFinite(value)
                ? value
                : null;

        },


        openFiles: async function (
            specificationId,
            title
        ) {

            const modal =
                document.getElementById(
                    "workshop-file-modal"
                );

            const titleElement =
                document.getElementById(
                    "workshop-file-modal-title"
                );

            const list =
                document.getElementById(
                    "workshop-file-list"
                );

            if (!modal || !list) {
                return;
            }

            if (titleElement) {

                titleElement.textContent =
                    `فایل‌های ${title || "ردیف"}`;

            }

            modal.classList.add("open");

            modal.setAttribute(
                "aria-hidden",
                "false"
            );

            list.innerHTML = `
                <div class="empty-state">
                    در حال دریافت فایل‌ها...
                </div>
            `;

            try {

                const response =
                    await fetch(
                        `/api/tenders/specifications/${specificationId}/attachments/`,
                        {
                            credentials: "same-origin",
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );

                if (!response.ok) {

                    throw new Error(
                        `HTTP ${response.status}`
                    );

                }

                const data =
                    await response.json();

                const files =
                    Array.isArray(data)
                        ? data
                        : (
                            data.results || []
                        );

                if (!files.length) {

                    list.innerHTML = `
                        <div class="empty-state">
                            برای این ردیف فایلی ثبت نشده است.
                        </div>
                    `;

                    return;
                }

                list.innerHTML =
                    files
                        .map(
                            file =>
                                `
                                <div class="row-file-item">

                                    <div>

                                        <div class="row-file-name">
                                            ${this.escape(
                                                file.title ||
                                                this.fileName(
                                                    file.file
                                                )
                                            )}
                                        </div>

                                        <div class="row-file-meta">
                                            ${this.escape(
                                                file.uploaded_by_name ||
                                                ""
                                            )}
                                        </div>

                                    </div>

                                    <a
                                        href="${this.escapeAttribute(
                                            file.file
                                        )}"
                                        target="_blank"
                                        rel="noopener"
                                        class="secondary-button">

                                        مشاهده

                                    </a>

                                </div>
                                `
                        )
                        .join("");

            }
            catch (error) {

                console.error(
                    "Specification files error:",
                    error
                );

                list.innerHTML = `
                    <div class="empty-state">
                        دریافت فایل‌ها انجام نشد.
                    </div>
                `;

            }

        },


        respondToInvitation: async function (
            participantId,
            responseStatus
        ) {

            try {

                const response =
                    await fetch(
                        `/api/tenders/participants/${participantId}/respond/`,
                        {
                            method: "POST",

                            credentials: "same-origin",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json",

                                "X-CSRFToken":
                                    this.getCSRFToken()
                            },

                            body:
                                JSON.stringify({
                                    response_status:
                                        responseStatus
                                })

                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        data.error ||
                        "خطا در پاسخ به دعوت"
                    );

                }

                await WorkshopApp.loadInvitations();

                this.showMessage(
                    responseStatus === "accepted"
                        ? "مشارکت در مناقصه پذیرفته شد."
                        : "عدم شرکت ثبت شد."
                );

            }
            catch (error) {

                console.error(
                    "Tender response error:",
                    error
                );

                this.showMessage(
                    error.message ||
                    "ثبت پاسخ انجام نشد."
                );

            }

        },


        showSubmitConfirmation: function () {

            return new Promise((resolve) => {

                const existing =
                    document.getElementById(
                        "workshop-submit-confirmation"
                    );

                if (existing) {
                    existing.remove();
                }

                const overlay =
                    document.createElement(
                        "div"
                    );

                overlay.id =
                    "workshop-submit-confirmation";

                overlay.style.cssText = `
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    background: rgba(0,0,0,.72);
                    backdrop-filter: blur(8px);
                `;

                overlay.innerHTML = `

                    <div
                        style="
                            width:min(520px,100%);
                            background:#10131a;
                            border:1px solid rgba(255,255,255,.14);
                            border-radius:18px;
                            padding:28px;
                            box-shadow:0 20px 70px rgba(0,0,0,.45);
                            direction:rtl;
                            text-align:right;
                        ">

                        <h3
                            style="
                                margin:0 0 16px;
                                font-size:20px;
                            ">

                            تأیید ارسال پیشنهاد

                        </h3>

                        <p
                            style="
                                margin:0 0 12px;
                                line-height:1.9;
                            ">

                            با تأیید، پیشنهاد شما به‌صورت نهایی ثبت می‌شود و پس از ارسال امکان ویرایش آن وجود نخواهد داشت.

                        </p>

                        <p
                            style="
                                margin:0 0 26px;
                                line-height:1.9;
                            ">

                            آیا از ارسال نهایی پیشنهاد اطمینان دارید؟

                        </p>

                        <div
                            style="
                                display:flex;
                                gap:10px;
                                justify-content:flex-start;
                            ">

                            <button
                                type="button"
                                data-confirm-cancel
                                class="secondary-button">

                                انصراف

                            </button>

                            <button
                                type="button"
                                data-confirm-submit
                                class="primary-button">

                                تأیید و ارسال نهایی

                            </button>

                        </div>

                    </div>

                `;

                document.body.appendChild(
                    overlay
                );

                const close =
                    (result) => {

                        overlay.remove();

                        resolve(
                            result
                        );

                    };

                overlay
                    .querySelector(
                        "[data-confirm-cancel]"
                    )
                    .addEventListener(
                        "click",
                        () => close(false)
                    );

                overlay
                    .querySelector(
                        "[data-confirm-submit]"
                    )
                    .addEventListener(
                        "click",
                        () => close(true)
                    );

                overlay.addEventListener(
                    "click",
                    (event) => {

                        if (
                            event.target ===
                            overlay
                        ) {

                            close(false);

                        }

                    }
                );

            });

        },


        setFormLocked: function (
            locked
        ) {

            document
                .querySelectorAll(
                    "#workshop-tender-view input, #workshop-tender-view select, #workshop-tender-view textarea"
                )
                .forEach((element) => {

                    element.disabled =
                        Boolean(
                            locked
                        );

                });

            const button =
                document.querySelector(
                    "[data-submit-workshop-bid]"
                );

            if (button && locked) {

                button.disabled =
                    true;

                button.textContent =
                    "پیشنهاد ارسال شد";

            }

        },


        isBidSubmitted: function () {

            return Boolean(
                this.currentBid &&
                this.currentBid.status &&
                this.currentBid.status !== "draft"
            );

        },


        bidStatusText: function (
            status
        ) {

            const labels = {

                draft:
                    "پیش‌نویس",

                submitted:
                    "ارسال شده",

                under_review:
                    "در حال بررسی",

                selected:
                    "انتخاب شده",

                rejected:
                    "رد شده"

            };

            return (
                labels[status] ||
                status ||
                "-"
            );

        },


        getCSRFToken: function () {

            const name =
                "csrftoken=";

            const cookies =
                document.cookie.split(";");

            for (
                let cookie of cookies
            ) {

                cookie =
                    cookie.trim();

                if (
                    cookie.indexOf(name) === 0
                ) {

                    return decodeURIComponent(
                        cookie.substring(
                            name.length
                        )
                    );

                }

            }

            return "";

        },


        readJSON: async function (
            response
        ) {

            const text =
                await response.text();

            if (!text) {
                return {};
            }

            try {

                return JSON.parse(
                    text
                );

            }
            catch (error) {

                return {
                    detail: text
                };

            }

        },


        extractError: function (
            data,
            fallback
        ) {

            if (!data) {
                return fallback;
            }

            if (typeof data === "string") {
                return data;
            }

            if (data.detail) {
                return data.detail;
            }

            const keys =
                Object.keys(data);

            if (keys.length) {

                const first =
                    data[keys[0]];

                if (Array.isArray(first)) {

                    return first.join(
                        " "
                    );

                }

                if (typeof first === "string") {

                    return first;

                }

            }

            return fallback;

        },


        showMessage: function (
            message
        ) {

            /*
             * فعلاً از alert استفاده می‌کنیم
             * تا وارد طراحی نهایی notification
             * نشویم.
             */

            alert(
                message
            );

        },


        renderTenderMessage: function (
            message
        ) {

            const container =
                document.getElementById(
                    "workshop-tender-view"
                );

            if (container) {

                container.innerHTML = `
                    <div class="empty-state">
                        ${this.escape(
                            message
                        )}
                    </div>
                `;

            }

        },


        formatMoney: function (
            value
        ) {

            return new Intl.NumberFormat(
                "fa-IR"
            ).format(
                Number(value) || 0
            );

        },


        formatDate: function (
            value
        ) {

            try {

                return new Intl.DateTimeFormat(
                    "fa-IR",
                    {
                        dateStyle: "short",
                        timeStyle: "short"
                    }
                ).format(
                    new Date(value)
                );

            }
            catch (error) {

                return value || "-";

            }

        },


        fileName: function (
            path
        ) {

            if (!path) {
                return "فایل";
            }

            return String(path)
                .split("/")
                .pop();

        },


        escapeAttribute: function (
            value
        ) {

            return this.escape(
                value
            );

        },


        escape: function (
            value
        ) {

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

        },


        toPersianNumber: function (
            value
        ) {

            return String(
                value
            ).replace(
                /\d/g,
                digit =>
                    "۰۱۲۳۴۵۶۷۸۹"[
                        Number(digit)
                    ]
            );

        }

    };


    document.addEventListener(
        "click",
        (event) => {

            const responseButton =
                event.target.closest(
                    "[data-respond-tender]"
                );

            if (responseButton) {

                const participantId =
                    responseButton.dataset
                        .participantId;

                const responseStatus =
                    responseButton.dataset
                        .respondTender;

                WorkshopTender
                    .respondToInvitation(
                        participantId,
                        responseStatus
                    );

                return;

            }


            const viewButton =
                event.target.closest(
                    "[data-view-tender]"
                );

            if (viewButton) {

                const tenderId =
                    viewButton.dataset
                        .tenderId;

                const invitation =
                    WorkshopApp.invitations
                        .find(
                            item =>
                                String(
                                    item.tender
                                ) ===
                                String(
                                    tenderId
                                )
                        );

                if (invitation) {

                    WorkshopApp.openTender(
                        invitation
                    );

                }

            }

        }
    );


})();
