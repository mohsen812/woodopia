(function () {
    "use strict";

    const instances = new Map();

    const MAX_MESSAGE_LENGTH = 10000;

    const labels = {
        eyebrow: "PROJECT DISCUSSION",
        title: "گفتگوی پروژه",
        connecting: "در حال اتصال",
        connected: "متصل",
        disconnected: "قطع ارتباط",
        loading: "در حال دریافت گفتگو...",
        empty: "هنوز پیامی در این گفتگو ثبت نشده است.",
        placeholder: "پیام خود را بنویسید...",
        send: "ارسال پیام",
        hint: "برای ارسال پیام Enter و برای رفتن به خط بعد Shift + Enter را بزنید.",
        retry: "تلاش مجدد",
        close: "بستن گفتگو",
        readonly: "این پروژه در وضعیت فعلی امکان ارسال پیام جدید ندارد. تاریخچه گفتگو همچنان قابل مشاهده است.",
        loginRequired: "نشست شما منقضی شده است. لطفاً دوباره وارد حساب کاربری شوید.",
        accessDenied: "شما به گفتگوی این پروژه دسترسی ندارید.",
        revoked: "دسترسی شما به این گفتگو لغو شده است.",
        serverError: "دریافت اطلاعات گفتگو با مشکل مواجه شد.",
        connectionError: "اتصال به گفتگوی پروژه برقرار نشد. لطفاً دوباره تلاش کنید.",
        invalidMessage: "متن پیام معتبر نیست.",
        messageTooLong: "طول پیام از حد مجاز بیشتر است.",
        sendError: "ارسال پیام انجام نشد. لطفاً دوباره تلاش کنید."
    };

    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined) {
            element.textContent = text;
        }

        return element;
    }

    function buildShell(projectId) {
        const overlay = createElement("div", "project-chat-overlay");
        overlay.hidden = true;
        overlay.setAttribute("data-project-chat-overlay", "");

        const dialog = createElement("div", "project-chat-dialog");
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("aria-labelledby", "project-chat-title");

        const root = createElement("section", "project-chat");
        root.setAttribute("aria-label", labels.title);
        root.setAttribute("data-project-id", String(projectId));

        const header = createElement("header", "project-chat__header");

        const heading = createElement("div", "project-chat__heading");

        const eyebrow = createElement(
            "span",
            "project-chat__eyebrow",
            labels.eyebrow
        );

        const title = createElement("h2", "project-chat__title", labels.title);
        title.id = "project-chat-title";

        heading.appendChild(eyebrow);
        heading.appendChild(title);

        const actions = createElement(
            "div",
            "project-chat__header-actions"
        );

        const connection = createElement(
            "div",
            "project-chat__connection"
        );

        const connectionDot = createElement(
            "span",
            "project-chat__connection-dot is-connecting"
        );

        connectionDot.setAttribute("aria-hidden", "true");

        const connectionText = createElement(
            "span",
            "project-chat__connection-text",
            labels.connecting
        );

        connection.appendChild(connectionDot);
        connection.appendChild(connectionText);

        const closeButton = createElement(
            "button",
            "project-chat__close",
            "×"
        );

        closeButton.type = "button";
        closeButton.setAttribute("aria-label", labels.close);
        closeButton.title = labels.close;

        actions.appendChild(connection);
        actions.appendChild(closeButton);

        header.appendChild(heading);
        header.appendChild(actions);

        const notice = createElement("div", "project-chat__notice");
        notice.hidden = true;
        notice.setAttribute("role", "status");
        notice.setAttribute("aria-live", "polite");

        const history = createElement("div", "project-chat__history");
        history.setAttribute("role", "log");
        history.setAttribute("aria-live", "polite");
        history.setAttribute("aria-relevant", "additions");

        const empty = createElement(
            "div",
            "project-chat__empty",
            labels.loading
        );

        history.appendChild(empty);

        const retryButton = createElement(
            "button",
            "project-chat__retry",
            labels.retry
        );

        retryButton.type = "button";
        retryButton.hidden = true;

        const composer = createElement("form", "project-chat__composer");

        const input = createElement("textarea", "project-chat__input");
        input.rows = 2;
        input.maxLength = MAX_MESSAGE_LENGTH;
        input.placeholder = labels.placeholder;
        input.setAttribute("aria-label", labels.placeholder);

        const footer = createElement(
            "div",
            "project-chat__composer-footer"
        );

        const hint = createElement(
            "span",
            "project-chat__hint",
            labels.hint
        );

        const counter = createElement(
            "span",
            "project-chat__counter",
            "0 / " + MAX_MESSAGE_LENGTH
        );

        const sendButton = createElement(
            "button",
            "project-chat__send",
            labels.send
        );

        sendButton.type = "submit";
        sendButton.disabled = true;

        footer.appendChild(hint);
        footer.appendChild(counter);
        footer.appendChild(sendButton);

        composer.appendChild(input);
        composer.appendChild(footer);

        root.appendChild(header);
        root.appendChild(notice);
        root.appendChild(history);
        root.appendChild(retryButton);
        root.appendChild(composer);

        dialog.appendChild(root);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        return {
            overlay: overlay,
            dialog: dialog,
            root: root,
            closeButton: closeButton,
            connectionDot: connectionDot,
            connectionText: connectionText,
            notice: notice,
            history: history,
            retryButton: retryButton,
            composer: composer,
            input: input,
            counter: counter,
            sendButton: sendButton
        };
    }

    function isCurrent(container, state) {
        return (
            !state.destroyed &&
            instances.get(container) === state
        );
    }

    function setConnection(ui, text, status) {
        ui.connectionText.textContent = text;

        ui.connectionDot.classList.remove(
            "is-connected",
            "is-connecting",
            "is-disconnected"
        );

        ui.connectionDot.classList.add(
            "is-" + status
        );
    }

    function setNotice(ui, message, type) {
        ui.notice.textContent = message || "";
        ui.notice.classList.remove("is-error", "is-readonly");

        if (!message) {
            ui.notice.hidden = true;
            return;
        }

        if (type === "error") {
            ui.notice.classList.add("is-error");
        }

        if (type === "readonly") {
            ui.notice.classList.add("is-readonly");
        }

        ui.notice.hidden = false;
    }

    function formatTime(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        try {
            return new Intl.DateTimeFormat("fa-IR", {
                hour: "2-digit",
                minute: "2-digit"
            }).format(date);
        } catch (error) {
            return date.toLocaleTimeString();
        }
    }

    function scrollToBottom(history) {
        history.scrollTop = history.scrollHeight;
    }

    function renderEmpty(state, message) {
        state.ui.history.replaceChildren();

        const empty = createElement(
            "div",
            "project-chat__empty",
            message
        );

        state.ui.history.appendChild(empty);
    }

    function renderMessage(state, message) {
        if (!message || typeof message.text !== "string") {
            return;
        }

        if (
            message.uuid &&
            state.messages.some(function (item) {
                return item.uuid === message.uuid;
            })
        ) {
            return;
        }

        state.messages.push(message);

        const ownMessage =
            Number(message.sender_membership_id) ===
            Number(state.conversation.membership_id);

        const item = createElement(
            "article",
            "project-chat__message" + (
                ownMessage ? " is-own" : ""
            )
        );

        const meta = createElement("div", "project-chat__message-meta");

        const sender = createElement(
            "span",
            "project-chat__sender",
            ownMessage ? "شما" : (message.sender_name || "کاربر")
        );

        const time = createElement(
            "time",
            "project-chat__time",
            formatTime(message.created_at)
        );

        if (message.created_at) {
            time.dateTime = message.created_at;
        }

        meta.appendChild(sender);
        meta.appendChild(time);

        const bubble = createElement("div", "project-chat__bubble");

        const text = createElement(
            "p",
            "project-chat__message-text",
            message.text
        );

        bubble.appendChild(text);
        item.appendChild(meta);
        item.appendChild(bubble);

        const empty = state.ui.history.querySelector(
            ".project-chat__empty"
        );

        if (empty) {
            empty.remove();
        }

        state.ui.history.appendChild(item);

        if (ownMessage) {
            state.sending = false;
            updateComposer(state);
        }

        scrollToBottom(state.ui.history);
    }

    function renderHistory(state, messages) {
        state.messages = [];

        state.ui.history.replaceChildren();

        if (!Array.isArray(messages) || messages.length === 0) {
            renderEmpty(state, labels.empty);
            return;
        }

        const sorted = messages.slice().sort(function (a, b) {
            return Number(a.id || 0) - Number(b.id || 0);
        });

        sorted.forEach(function (message) {
            renderMessage(state, message);
        });

        scrollToBottom(state.ui.history);
    }

    function updateComposer(state) {
        const ui = state.ui;
        const length = ui.input.value.length;
        const connected = (
            state.socket &&
            state.socket.readyState === WebSocket.OPEN
        );

        ui.counter.textContent =
            length + " / " + state.maxLength;

        ui.input.maxLength = state.maxLength;

        ui.input.disabled = (
            !state.canSend ||
            !connected ||
            state.revoked
        );

        ui.sendButton.disabled = (
            !state.canSend ||
            !connected ||
            state.revoked ||
            state.sending ||
            !ui.input.value.trim() ||
            length > state.maxLength
        );
    }

    function closeSocket(state) {
        const socket = state.socket;

        if (!socket) {
            return;
        }

        state.socket = null;

        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (
            socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING
        ) {
            try {
                socket.close(1000, "Chat instance closed");
            } catch (error) {
                // The browser may already have closed the connection.
            }
        }
    }

    function connect(container, state) {
        if (!isCurrent(container, state)) {
            return;
        }

        if (!state.conversation || !state.conversation.websocket_url) {
            return;
        }

        closeSocket(state);

        setConnection(state.ui, labels.connecting, "connecting");
        state.ui.retryButton.hidden = true;
        updateComposer(state);

        let socketUrl;

        try {
            const url = new URL(
                state.conversation.websocket_url,
                window.location.href
            );

            url.protocol = (
                window.location.protocol === "https:"
                    ? "wss:"
                    : "ws:"
            );

            socketUrl = url.toString();
        } catch (error) {
            setConnection(
                state.ui,
                labels.disconnected,
                "disconnected"
            );

            setNotice(
                state.ui,
                labels.connectionError,
                "error"
            );

            state.ui.retryButton.hidden = false;
            return;
        }

        let socket;

        try {
            socket = new WebSocket(socketUrl);
        } catch (error) {
            setConnection(
                state.ui,
                labels.disconnected,
                "disconnected"
            );

            setNotice(
                state.ui,
                labels.connectionError,
                "error"
            );

            state.ui.retryButton.hidden = false;
            return;
        }

        state.socket = socket;

        socket.onopen = function () {
            if (!isCurrent(container, state)) {
                return;
            }

            setConnection(
                state.ui,
                labels.connected,
                "connected"
            );

            state.ui.retryButton.hidden = true;

            if (state.canSend) {
                setNotice(state.ui, "", "");
            } else {
                setNotice(
                    state.ui,
                    labels.readonly,
                    "readonly"
                );
            }

            updateComposer(state);
        };

        socket.onmessage = function (event) {
            if (!isCurrent(container, state)) {
                return;
            }

            let payload;

            try {
                payload = JSON.parse(event.data);
            } catch (error) {
                return;
            }

            if (!payload || typeof payload !== "object") {
                return;
            }

            if (payload.type === "history") {
                renderHistory(state, payload.messages);
                state.sending = false;
                updateComposer(state);
                return;
            }

            if (payload.type === "message") {
                renderMessage(state, payload.message);
                return;
            }

            if (payload.type === "error") {
                state.sending = false;

                setNotice(
                    state.ui,
                    payload.message || labels.sendError,
                    "error"
                );

                updateComposer(state);
            }
        };

        socket.onerror = function () {
            if (!isCurrent(container, state)) {
                return;
            }

            setConnection(
                state.ui,
                labels.disconnected,
                "disconnected"
            );

            updateComposer(state);
        };

        socket.onclose = function (event) {
            if (!isCurrent(container, state)) {
                return;
            }

            setConnection(
                state.ui,
                labels.disconnected,
                "disconnected"
            );

            state.sending = false;

            if (event.code === 4403) {
                state.revoked = true;
                state.canSend = false;

                setNotice(
                    state.ui,
                    labels.revoked,
                    "error"
                );

                state.ui.retryButton.hidden = true;
            } else {
                setNotice(
                    state.ui,
                    labels.connectionError,
                    "error"
                );

                state.ui.retryButton.hidden = false;
            }

            updateComposer(state);
        };
    }

    async function loadConversation(container, state) {
        if (!isCurrent(container, state)) {
            return false;
        }

        if (state.loading) {
            return state.promise || false;
        }

        state.loading = true;
        state.revoked = false;

        setConnection(
            state.ui,
            labels.connecting,
            "connecting"
        );

        setNotice(state.ui, labels.loading, "");
        state.ui.retryButton.hidden = true;

        updateComposer(state);

        try {
            const response = await fetch(
                "/api/chat/projects/" +
                encodeURIComponent(state.projectId) +
                "/",
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            if (!isCurrent(container, state)) {
                return false;
            }

            let data = {};

            try {
                data = await response.json();
            } catch (error) {
                data = {};
            }

            if (!isCurrent(container, state)) {
                return false;
            }

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(labels.loginRequired);
                }

                if (response.status === 403 || response.status === 404) {
                    state.revoked = true;
                    throw new Error(
                        data.detail || labels.accessDenied
                    );
                }

                throw new Error(
                    data.detail || labels.serverError
                );
            }

            if (
                !data.websocket_url ||
                !data.conversation_id ||
                !data.membership_id
            ) {
                throw new Error(labels.serverError);
            }

            state.conversation = data;
            state.canSend = Boolean(data.can_send);
            state.maxLength = Math.max(
                1,
                Math.min(
                    Number(data.max_message_length) ||
                    MAX_MESSAGE_LENGTH,
                    MAX_MESSAGE_LENGTH
                )
            );

            state.sending = false;

            if (state.canSend) {
                setNotice(state.ui, "", "");
            } else {
                setNotice(
                    state.ui,
                    labels.readonly,
                    "readonly"
                );
            }

            connect(container, state);
            return true;

        } catch (error) {
            if (!isCurrent(container, state)) {
                return false;
            }

            setConnection(
                state.ui,
                labels.disconnected,
                "disconnected"
            );

            setNotice(
                state.ui,
                error.message || labels.serverError,
                "error"
            );

            state.ui.retryButton.hidden = Boolean(state.revoked);

            updateComposer(state);
            return false;

        } finally {
            state.loading = false;
        }
    }

    function sendMessage(state) {
        const text = state.ui.input.value.trim();

        if (!text) {
            return;
        }

        if (text.length > state.maxLength) {
            setNotice(
                state.ui,
                labels.messageTooLong,
                "error"
            );
            return;
        }

        if (
            !state.canSend ||
            state.revoked ||
            !state.socket ||
            state.socket.readyState !== WebSocket.OPEN ||
            state.sending
        ) {
            return;
        }

        try {
            state.socket.send(JSON.stringify({
                message: text
            }));

            state.sending = true;
            state.ui.input.value = "";

            setNotice(state.ui, "", "");
            updateComposer(state);

        } catch (error) {
            state.sending = false;

            setNotice(
                state.ui,
                labels.sendError,
                "error"
            );

            updateComposer(state);
        }
    }

    function bindEvents(container, state) {
        const ui = state.ui;

        ui.closeButton.addEventListener("click", function () {
            state.close();
        });

        ui.overlay.addEventListener("click", function (event) {
            if (event.target === ui.overlay) {
                state.close();
            }
        });

        ui.overlay.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                event.preventDefault();
                state.close();
                return;
            }

            if (event.key !== "Tab") {
                return;
            }

            const focusable = Array.from(
                ui.dialog.querySelectorAll(
                    'button:not(:disabled):not([hidden]), textarea:not(:disabled):not([hidden])'
                )
            ).filter(function (element) {
                return element.offsetParent !== null;
            });

            if (!focusable.length) {
                event.preventDefault();
                ui.closeButton.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (
                event.shiftKey &&
                document.activeElement === first
            ) {
                event.preventDefault();
                last.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault();
                first.focus();
            }
        });

        ui.input.addEventListener("input", function () {
            updateComposer(state);
        });

        ui.input.addEventListener("keydown", function (event) {
            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.isComposing
            ) {
                event.preventDefault();
                ui.composer.requestSubmit();
            }
        });

        ui.composer.addEventListener("submit", function (event) {
            event.preventDefault();
            sendMessage(state);
        });

        ui.retryButton.addEventListener("click", function () {
            if (state.loading || state.revoked) {
                return;
            }

            closeSocket(state);
            state.sending = false;

            state.promise = loadConversation(container, state);
        });
    }

    function mount(options) {
        if (!options || !options.container || !options.projectId) {
            return Promise.resolve(false);
        }

        const container = options.container;
        const projectId = String(options.projectId);

        const previous = instances.get(container);

        if (previous && previous.projectId === projectId) {
            previous.open();
            return previous.promise || Promise.resolve(true);
        }

        if (previous) {
            previous.destroy();
            instances.delete(container);
        }

        const ui = buildShell(projectId);

        const state = {
            projectId: projectId,
            ui: ui,
            socket: null,
            conversation: null,
            messages: [],
            canSend: false,
            maxLength: MAX_MESSAGE_LENGTH,
            sending: false,
            loading: false,
            revoked: false,
            destroyed: false,
            previousFocus: null,
            previousBodyOverflow: "",
            promise: null,
            open: null,
            close: null,
            destroy: null
        };

        state.open = function () {
            if (state.destroyed || !ui.overlay.hidden) {
                return;
            }

            state.previousFocus = document.activeElement;
            state.previousBodyOverflow =
                document.body.style.overflow;

            document.body.style.overflow = "hidden";
            ui.overlay.hidden = false;

            ui.closeButton.focus();
        };

        state.close = function () {
            if (state.destroyed || ui.overlay.hidden) {
                return;
            }

            ui.overlay.hidden = true;

            document.body.style.overflow =
                state.previousBodyOverflow;

            if (
                state.previousFocus &&
                document.contains(state.previousFocus)
            ) {
                state.previousFocus.focus();
            }

            state.previousFocus = null;
        };

        state.destroy = function () {
            if (state.destroyed) {
                return;
            }

            state.close();
            state.destroyed = true;

            closeSocket(state);

            state.messages = [];
            state.conversation = null;
            state.canSend = false;
            state.sending = false;

            ui.overlay.remove();
        };

        bindEvents(container, state);

        instances.set(container, state);

        state.open();

        state.promise = loadConversation(container, state);

        return state.promise;
    }

    function close(container) {
        const state = instances.get(container);

        if (state) {
            state.close();
        }
    }

    function destroy(container) {
        const state = instances.get(container);

        if (!state) {
            return;
        }

        state.destroy();
        instances.delete(container);
    }

    window.ProjectChat = {
        mount: mount,
        close: close,
        destroy: destroy
    };
})();
