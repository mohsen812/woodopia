// ============================================================
// FEEMAAS Workspace Interaction Engine
// Version 2.0.0
//
// Responsibilities:
// - Visual selection
// - Project selection
// - Double-click project details
// - Drag & drop preparation
// - Zone detection
// - Central decision field detection
// - Waiting-slot detection
// - Persistent interaction state
// - Communication with Workspace Layout Renderer
//
// Architecture:
//
// Geometry
//     ↓
// Layout
//     ↓
// ProjectLayoutAdapter
//     ↓
// WorkspaceLayoutRenderer
//     ↓
// WorkspaceInteraction
//     ↓
// Workspace / Backend
//
// IMPORTANT:
// This engine does NOT own layout calculation.
// It does NOT create project visuals.
// It does NOT replace workspace.js.
// It only manages user interaction with already-rendered visuals.
// ============================================================

(function () {
    "use strict";

    // --------------------------------------------------------
    // Namespace
    // --------------------------------------------------------

    window.FEEMAAS = window.FEEMAAS || {};

    const VERSION = "2.0.0";

    // --------------------------------------------------------
    // Configuration
    // --------------------------------------------------------

    const config = {

        // Selection
        selection: {
            enabled: true,
            selectedClass: "feemaas-visual-selected",
            selectedProjectClass: "feemaas-project-selected"
        },

        // Double click
        doubleClick: {
            enabled: true,
            delay: 350
        },

        // Drag
        drag: {
            enabled: true,
            threshold: 5
        },

        // Zones
        zones: {
            enabled: true,

            codes: [
                "ZONE_1",
                "ZONE_2",
                "ZONE_3",
                "ZONE_4"
            ],

            // Generic fallback names used when workspace
            // uses another naming convention.
            aliases: {
                "1": "ZONE_1",
                "2": "ZONE_2",
                "3": "ZONE_3",
                "4": "ZONE_4",

                "A": "ZONE_1",
                "B": "ZONE_2",
                "C": "ZONE_3",
                "D": "ZONE_4"
            }
        },

        // Central decision field
        decisionField: {
            enabled: true,

            codes: [
                "DECISION",
                "DECISION_FIELD",
                "CENTER",
                "CENTRAL",
                "PLAZA",
                "FIELD"
            ]
        },

        // Waiting area
        waitingArea: {
            enabled: true,

            codes: [
                "WAITING",
                "WAITING_AREA",
                "PROJECT_WAITING",
                "QUEUE"
            ]
        },

        // CSS
        css: {
            inject: true
        },

        // Debug
        debug: true
    };


    // --------------------------------------------------------
    // Internal state
    // --------------------------------------------------------

    const state = {

        initialized: false,

        workspaceElement: null,

        projects: [],

        visuals: [],

        selectedVisualId: null,

        selectedProjectId: null,

        selectedVisualElement: null,

        selectedProject: null,

        dragging: false,
        pendingDrag: null,
        draggingVisualId: null,

        dragStartX: 0,

        dragStartY: 0,

        currentPointerX: 0,

        currentPointerY: 0,

        currentZone: null,

        currentDropTarget: null,

        lastClickTime: 0,

        lastClickVisualId: null,

        handlersAttached: false,

        events: {},

        statistics: {
            projects: 0,
            visuals: 0,
            selected: 0,
            drags: 0,
            doubleClicks: 0
        }
    };


    // --------------------------------------------------------
    // Utility: debug
    // --------------------------------------------------------

    function log() {

        if (!config.debug) {
            return;
        }

        console.log.apply(
            console,
            ["FEEMAAS Interaction:"].concat(
                Array.prototype.slice.call(arguments)
            )
        );
    }


    function warn() {

        console.warn.apply(
            console,
            ["FEEMAAS Interaction:"].concat(
                Array.prototype.slice.call(arguments)
            )
        );
    }


    function error() {

        console.error.apply(
            console,
            ["FEEMAAS Interaction:"].concat(
                Array.prototype.slice.call(arguments)
            )
        );
    }


    // --------------------------------------------------------
    // Utility: event system
    // --------------------------------------------------------

    function on(eventName, callback) {

        if (!state.events[eventName]) {
            state.events[eventName] = [];
        }

        state.events[eventName].push(callback);

        return function unsubscribe() {

            const list = state.events[eventName];

            if (!list) {
                return;
            }

            const index = list.indexOf(callback);

            if (index !== -1) {
                list.splice(index, 1);
            }
        };
    }


    function emit(eventName, payload) {

        const list = state.events[eventName];

        if (!list) {
            return;
        }

        list.slice().forEach(function (callback) {

            try {
                callback(payload);
            } catch (err) {

                console.error(
                    "FEEMAAS Interaction event error:",
                    eventName,
                    err
                );

            }

        });
    }


    // --------------------------------------------------------
    // CSS
    // --------------------------------------------------------

    function injectCSS() {

        if (!config.css.inject) {
            return;
        }

        if (document.getElementById(
            "feemaas-workspace-interaction-v2-css"
        )) {
            return;
        }

        const style = document.createElement("style");

        style.id =
            "feemaas-workspace-interaction-v2-css";

        style.textContent = `

            .feemaas-visual-selected {

                filter:
                    drop-shadow(0 0 8px rgba(255,255,255,.95))
                    drop-shadow(0 0 16px rgba(80,220,255,.75));

                outline:
                    2px solid rgba(255,255,255,.9);

                outline-offset: 3px;

                z-index: 1000 !important;

            }


            .feemaas-project-selected {

                filter:
                    drop-shadow(0 0 12px rgba(80,220,255,.9));

            }


            .feemaas-visual-dragging {

                opacity: .75;

                cursor: grabbing !important;

                z-index: 5000 !important;

            }


            .feemaas-drop-target {

                box-shadow:
                    inset 0 0 0 3px rgba(255,255,255,.75),
                    0 0 18px rgba(80,220,255,.65);

            }


            .feemaas-interaction-cursor {

                cursor: pointer;

            }


            .feemaas-interaction-drag-cursor {

                cursor: grab;

            }

        `;

        document.head.appendChild(style);
    }


    // --------------------------------------------------------
    // Workspace lookup
    // --------------------------------------------------------

    function getWorkspaceElement() {

        if (
            state.workspaceElement &&
            document.contains(state.workspaceElement)
        ) {
            return state.workspaceElement;
        }

        const selectors = [

            "#workspace",

            ".workspace",

            "#feemaas-workspace",

            ".feemaas-workspace",

            "[data-feemaas-workspace]",

            "[data-workspace]"

        ];

        for (
            let i = 0;
            i < selectors.length;
            i++
        ) {

            const element =
                document.querySelector(selectors[i]);

            if (element) {

                state.workspaceElement = element;

                return element;
            }
        }

        return null;
    }


    // --------------------------------------------------------
    // Renderer
    // --------------------------------------------------------

    function getRenderer() {

        if (
            window.FEEMAAS &&
            window.FEEMAAS.WorkspaceLayoutRenderer
        ) {
            return window.FEEMAAS.WorkspaceLayoutRenderer;
        }

        return null;
    }


    // --------------------------------------------------------
    // Find visual element
    // --------------------------------------------------------

    function getVisualElement(visualId) {

        if (visualId === null || visualId === undefined) {
            return null;
        }

        const workspace =
            getWorkspaceElement();

        if (!workspace) {
            return null;
        }

        const selectors = [

            `[data-visual-id="${visualId}"]`,

            `[data-visual="${visualId}"]`,

            `[data-project-visual-id="${visualId}"]`,

            `[data-visual-id='${visualId}']`,

            `[data-visual='${visualId}']`

        ];

        for (
            let i = 0;
            i < selectors.length;
            i++
        ) {

            const element =
                workspace.querySelector(
                    selectors[i]
                );

            if (element) {
                return element;
            }
        }

        return null;
    }


    // --------------------------------------------------------
    // Find visual from DOM event
    // --------------------------------------------------------

    function findVisualElement(target) {

        if (!target) {
            return null;
        }

        const workspace =
            getWorkspaceElement();

        if (!workspace) {
            return null;
        }

        let element = target;

        while (
            element &&
            element !== workspace
        ) {

            if (
                element.dataset &&
                (
                    element.dataset.visualId ||
                    element.dataset.visual ||
                    element.dataset.projectVisualId
                )
            ) {

                return element;
            }

            element = element.parentElement;
        }

        return null;
    }


    // --------------------------------------------------------
    // Read visual ID
    // --------------------------------------------------------

    function getVisualIdFromElement(element) {

        if (!element || !element.dataset) {
            return null;
        }

        return (
            element.dataset.visualId ||
            element.dataset.visual ||
            element.dataset.projectVisualId ||
            null
        );
    }


    // --------------------------------------------------------
    // Normalize IDs
    // --------------------------------------------------------

    function normalizeId(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return null;
        }

        const numeric =
            Number(value);

        if (!Number.isNaN(numeric)) {
            return numeric;
        }

        return String(value);
    }


    // --------------------------------------------------------
    // Find visual data
    // --------------------------------------------------------

    function findVisualData(visualId) {

        const normalized =
            normalizeId(visualId);

        for (
            let i = 0;
            i < state.visuals.length;
            i++
        ) {

            const visual =
                state.visuals[i];

            const candidate =
                visual.visualId ??
                visual.id ??
                visual.visual_id;

            if (
                normalizeId(candidate) ===
                normalized
            ) {
                return visual;
            }
        }

        return null;
    }


    // --------------------------------------------------------
    // Find project
    // --------------------------------------------------------

    function findProject(projectId) {

        const normalized =
            normalizeId(projectId);

        for (
            let i = 0;
            i < state.projects.length;
            i++
        ) {

            const project =
                state.projects[i];

            if (
                normalizeId(project.id) ===
                normalized
            ) {
                return project;
            }
        }

        return null;
    }


    // --------------------------------------------------------
    // Selection
    // --------------------------------------------------------

    function clearSelection() {

        if (state.selectedVisualElement) {

            state.selectedVisualElement
                .classList
                .remove(
                    config.selection.selectedClass
                );

        }

        const workspace =
            getWorkspaceElement();

        if (workspace) {

            workspace
                .querySelectorAll(
                    "." +
                    config.selection.selectedProjectClass
                )
                .forEach(function (element) {

                    element.classList.remove(
                        config.selection.selectedProjectClass
                    );

                });

        }

        state.selectedVisualId = null;

        state.selectedProjectId = null;

        state.selectedVisualElement = null;

        state.selectedProject = null;

        state.statistics.selected = 0;

        emit("selection-cleared", {
            state: getStateSnapshot()
        });
    }


    function selectVisual(
        visualId,
        element
    ) {

        const visual =
            findVisualData(visualId);

        if (!visual) {

            warn(
                "Visual not found:",
                visualId
            );

            return null;
        }

        clearSelection();

        const projectId =
            visual.projectId ??
            visual.project_id ??
            visual.project;

        const project =
            findProject(projectId);

        state.selectedVisualId =
            normalizeId(visualId);

        state.selectedProjectId =
            normalizeId(projectId);

        state.selectedVisualElement =
            element ||
            getVisualElement(visualId);

        state.selectedProject =
            project || null;

        if (
            state.selectedVisualElement
        ) {

            state.selectedVisualElement
                .classList
                .add(
                    config.selection.selectedClass
                );

        }

        state.statistics.selected = 1;

        log(
            "Visual selected:",
            state.selectedVisualId,
            "Project:",
            state.selectedProjectId
        );

        const payload = {

            visualId:
                state.selectedVisualId,

            projectId:
                state.selectedProjectId,

            visual,

            project,

            element:
                state.selectedVisualElement

        };

        emit(
            "visual-selected",
            payload
        );

        emit(
            "project-selected",
            payload
        );

        return payload;
    }


    // --------------------------------------------------------
    // Double click
    // --------------------------------------------------------

    function handleVisualDoubleClick(
        visualId,
        element
    ) {

        if (!config.doubleClick.enabled) {
            return;
        }

        const visual =
            findVisualData(visualId);

        if (!visual) {
            return;
        }

        const projectId =
            visual.projectId ??
            visual.project_id ??
            visual.project;

        const project =
            findProject(projectId);

        state.statistics.doubleClicks++;

        const payload = {

            visualId:
                normalizeId(visualId),

            projectId:
                normalizeId(projectId),

            visual,

            project,

            element:
                element ||
                getVisualElement(visualId)

        };

        log(
            "Visual double-click:",
            payload
        );

        emit(
            "visual-double-click",
            payload
        );

        emit(
            "project-open-request",
            payload
        );

        /*
         * We deliberately do NOT create a popup here.
         *
         * The interaction engine emits an event.
         * A dedicated Project Details UI can subscribe to it.
         *
         * This keeps UI, interaction and data architecture
         * separated.
         */

        return payload;
    }


    // --------------------------------------------------------
    // Click / double-click detector
    // --------------------------------------------------------

    function processVisualClick(
        element
    ) {

        const visualId =
            getVisualIdFromElement(element);

        if (visualId === null) {
            return;
        }

        const now =
            Date.now();

        const sameVisual =
            normalizeId(
                state.lastClickVisualId
            ) ===
            normalizeId(
                visualId
            );

        const elapsed =
            now -
            state.lastClickTime;

        if (
            sameVisual &&
            elapsed <=
            config.doubleClick.delay
        ) {

            state.lastClickTime = 0;

            state.lastClickVisualId = null;

            handleVisualDoubleClick(
                visualId,
                element
            );

            return;
        }

        state.lastClickTime = now;

        state.lastClickVisualId =
            visualId;

        selectVisual(
            visualId,
            element
        );
    }


    // --------------------------------------------------------
    // Pointer position
    // --------------------------------------------------------

    function getPointerPosition(event) {

        return {

            clientX:
                event.clientX,

            clientY:
                event.clientY,

            pageX:
                event.pageX,

            pageY:
                event.pageY

        };
    }


    // --------------------------------------------------------
    // Zone detection
    // --------------------------------------------------------

    function normalizeZoneCode(code) {

        if (
            code === null ||
            code === undefined
        ) {
            return null;
        }

        const value =
            String(code)
                .trim()
                .toUpperCase();

        if (
            config.zones.codes
                .includes(value)
        ) {
            return value;
        }

        if (
            config.zones.aliases[value]
        ) {
            return config
                .zones
                .aliases[value];
        }

        return value;
    }


    function isDecisionField(code) {

        if (!code) {
            return false;
        }

        const value =
            String(code)
                .trim()
                .toUpperCase();

        return config
            .decisionField
            .codes
            .includes(value);
    }


    function isWaitingArea(code) {

        if (!code) {
            return false;
        }

        const value =
            String(code)
                .trim()
                .toUpperCase();

        return config
            .waitingArea
            .codes
            .includes(value);
    }


    // --------------------------------------------------------
    // DOM zone lookup
    // --------------------------------------------------------

    function getDropTargets() {

        const workspace =
            getWorkspaceElement();

        if (!workspace) {
            return [];
        }

        return Array.from(
            workspace.querySelectorAll(
                "[data-zone-code]," +
                "[data-zone]," +
                "[data-area-code]," +
                "[data-drop-zone]"
            )
        );
    }


    function getZoneCodeFromElement(
        element
    ) {

        if (
            !element ||
            !element.dataset
        ) {
            return null;
        }

        return normalizeZoneCode(

            element.dataset.zoneCode ||

            element.dataset.zone ||

            element.dataset.areaCode ||

            element.dataset.dropZone ||

            null

        );
    }


    // --------------------------------------------------------
    // Detect target under pointer
    // --------------------------------------------------------

    function detectDropTarget(
        event
    ) {

        const targets =
            getDropTargets();

        if (!targets.length) {
            return null;
        }

        const x =
            event.clientX;

        const y =
            event.clientY;

        for (
            let i = 0;
            i < targets.length;
            i++
        ) {

            const target =
                targets[i];

            const rect =
                target.getBoundingClientRect();

            if (
                x >= rect.left &&
                x <= rect.right &&
                y >= rect.top &&
                y <= rect.bottom
            ) {

                return {

                    element: target,

                    code:
                        getZoneCodeFromElement(
                            target
                        ),

                    rect

                };
            }
        }

        return null;
    }


    // --------------------------------------------------------
    // Drag start
    // --------------------------------------------------------

    function beginDrag(
        event,
        element
    ) {

        if (!config.drag.enabled) {
            return;
        }

        const visualId =
            getVisualIdFromElement(
                element
            );

        if (visualId === null) {
            return;
        }

        const visual =
            findVisualData(
                visualId
            );

        if (!visual) {
            return;
        }

        selectVisual(
            visualId,
            element
        );

        const pointer =
            getPointerPosition(
                event
            );

        state.dragging = true;

        state.draggingVisualId =
            normalizeId(
                visualId
            );

        state.dragStartX =
            pointer.clientX;

        state.dragStartY =
            pointer.clientY;

        state.currentPointerX =
            pointer.clientX;

        state.currentPointerY =
            pointer.clientY;

        state.currentZone = null;

        state.currentDropTarget = null;

        element.classList.add(
            "feemaas-visual-dragging"
        );

        log(
            "Drag started:",
            visualId
        );

        emit(
            "drag-start",
            {

                visualId:
                    normalizeId(
                        visualId
                    ),

                visual,

                project:
                    state.selectedProject,

                element

            }
        );
    }


    // --------------------------------------------------------
    // Drag move
    // --------------------------------------------------------

    function moveDrag(event) {

        if (!state.dragging) {
            return;
        }

        const element =
            state.selectedVisualElement;

        if (!element) {
            return;
        }

        const pointer =
            getPointerPosition(
                event
            );

        state.currentPointerX =
            pointer.clientX;

        state.currentPointerY =
            pointer.clientY;

        const distance =
            Math.sqrt(

                Math.pow(
                    pointer.clientX -
                    state.dragStartX,
                    2
                ) +

                Math.pow(
                    pointer.clientY -
                    state.dragStartY,
                    2
                )

            );

        if (
            distance <
            config.drag.threshold
        ) {
            return;
        }

        const target =
            detectDropTarget(
                event
            );

        if (
            target &&
            target.element !==
            state.currentDropTarget
        ) {

            removeDropHighlight();

            state.currentDropTarget =
                target.element;

            state.currentZone =
                target.code;

            target.element.classList.add(
                "feemaas-drop-target"
            );

            emit(
                "drag-enter-zone",
                {

                    visualId:
                        state.draggingVisualId,

                    zone:
                        target.code,

                    element:
                        target.element

                }
            );

        } else if (!target) {

            removeDropHighlight();

            state.currentDropTarget = null;

            state.currentZone = null;

        }

 emit(
    "drag-move",
    {
        visualId:
            state.draggingVisualId,

        x:
            pointer.clientX,

        y:
            pointer.clientY,

        zone:
            state.currentZone
    }
);
}


    // --------------------------------------------------------
    // Remove drop highlight
    // --------------------------------------------------------

    function removeDropHighlight() {

        if (
            state.currentDropTarget
        ) {

            state.currentDropTarget
                .classList
                .remove(
                    "feemaas-drop-target"
                );

        }

    }


    // --------------------------------------------------------
    // Drag end
    // --------------------------------------------------------

    function endDrag(event) {

        if (!state.dragging) {
            return;
        }

        const visualId =
            state.draggingVisualId;

        const visual =
            findVisualData(
                visualId
            );

        const target =
            state.currentDropTarget;

        const zone =
            state.currentZone;

        const element =
            state.selectedVisualElement;

        if (element) {

            element.classList.remove(
                "feemaas-visual-dragging"
            );

        }

        removeDropHighlight();

        state.dragging = false;

        state.draggingVisualId = null;

        state.currentDropTarget = null;

        state.currentZone = null;

        state.statistics.drags++;

        const payload = {

            visualId:
                normalizeId(
                    visualId
                ),

            visual,

            project:
                state.selectedProject,

            zone,

            target,

            element,

            committed:
                Boolean(zone)

        };

        log(
            "Drag ended:",
            payload
        );

        emit(
            "drag-end",
            payload
        );

        /*
         * IMPORTANT:
         *
         * We do not directly mutate backend data here.
         *
         * The application layer can listen to drag-end
         * and decide whether:
         *
         * 1. the item is moved locally,
         * 2. the backend is updated,
         * 3. the consultant workflow is triggered,
         * 4. the project shape changes.
         */

        if (zone) {

            emit(
                "drop-request",
                payload
            );

        }

        return payload;
    }


    // --------------------------------------------------------
    // Mouse events
    // --------------------------------------------------------

    function handlePointerDown(event) {

        if (
            event.button !== undefined &&
            event.button !== 0
        ) {
            return;
        }

        const element =
            findVisualElement(
                event.target
            );

        if (!element) {
            return;
        }

       const visualId =
    getVisualIdFromElement(
        element
    );

if (visualId === null) {
    return;
}

state.pendingDrag = {

    visualId,

    element,

    startX:
        event.clientX,

    startY:
        event.clientY
};
    }

function handlePointerMove(event) {

    if (
        !state.dragging &&
        state.pendingDrag
    ) {

        const deltaX =
            event.clientX -
            state.pendingDrag.startX;

        const deltaY =
            event.clientY -
            state.pendingDrag.startY;


        const distance =
            Math.sqrt(
                deltaX * deltaX +
                deltaY * deltaY
            );

console.log(
    "FEEMAAS Drag Threshold Check:",
    {
        visualId:
            state.pendingDrag.visualId,

        deltaX,
        deltaY,
        distance,

        threshold:
            config.drag.threshold
    }
);

        if (
            distance >=
            config.drag.threshold
        ) {

            beginDrag(
                {
                    clientX:
                        state.pendingDrag.startX,

                    clientY:
                        state.pendingDrag.startY,

                    target:
                        state.pendingDrag.element
                },

                state.pendingDrag.element
            );

            state.pendingDrag = null;
            event.preventDefault();
        }
    }


    if (!state.dragging) {
        return;
    }


    moveDrag(event);
}
    


 function handlePointerUp(event) {
if (state.pendingDrag) {

    state.pendingDrag = null;

}
    if (
        state.pendingDrag &&
        !state.dragging
    ) {

        state.pendingDrag = null;

        return;
    }


    if (!state.dragging) {
        return;
    }


    endDrag(event);
}

    function handleClick(event) {

        /*
         * If a drag actually happened, don't treat the
         * pointer release as a normal click.
         */

        if (state.dragging) {
            return;
        }

        const element =
            findVisualElement(
                event.target
            );

        if (!element) {
            return;
        }
console.log(
    "FEEMAAS CLICK DETECTED",
    getVisualIdFromElement(element)
);

        processVisualClick(
            element
        );
    }


    function handleWorkspaceClick(event) {

        const element =
            findVisualElement(
                event.target
            );

        if (element) {
            return;
        }

        /*
         * Clicking empty workspace clears selection.
         */

        clearSelection();
    }


    // --------------------------------------------------------
    // Attach handlers
    // --------------------------------------------------------

    function attachHandlers() {

        const workspace =
            getWorkspaceElement();

        if (!workspace) {

            warn(
                "Workspace element not found."
            );

            return false;
        }

        if (state.handlersAttached) {
            return true;
        }

        /*
         * Pointer events are used instead of separate
         * mouse/touch systems so the same architecture can
         * later work on mobile/tablet.
         */

        workspace.addEventListener(
            "pointerdown",
            handlePointerDown
        );

        window.addEventListener(
            "pointermove",
            handlePointerMove
        );

        window.addEventListener(
            "pointerup",
            handlePointerUp
        );

        workspace.addEventListener(
            "click",
            handleClick
        );

/*
workspace.addEventListener(
    "click",
    handleWorkspaceClick,
    true
);
*/
        state.handlersAttached = true;

        log(
            "Interaction handlers attached."
        );

        return true;
    }


    // --------------------------------------------------------
    // Detach handlers
    // --------------------------------------------------------

    function detachHandlers() {

        const workspace =
            state.workspaceElement;

        if (!workspace) {
            return;
        }

        workspace.removeEventListener(
            "pointerdown",
            handlePointerDown
        );

        window.removeEventListener(
            "pointermove",
            handlePointerMove
        );

        window.removeEventListener(
            "pointerup",
            handlePointerUp
        );

        workspace.removeEventListener(
            "click",
            handleClick
        );

        workspace.removeEventListener(
            "click",
            handleWorkspaceClick,
            true
        );

        state.handlersAttached = false;

        log(
            "Interaction handlers detached."
        );
    }


    // --------------------------------------------------------
    // Normalize project input
    // --------------------------------------------------------

    function normalizeProjects(
        projects
    ) {

        if (!Array.isArray(projects)) {
            return [];
        }

        return projects;
    }


    // --------------------------------------------------------
    // Flatten visuals
    // --------------------------------------------------------

    function flattenProjects(
        projects
    ) {

        const result = [];

        projects.forEach(
            function (project) {

                if (
                    !project ||
                    !Array.isArray(
                        project.zones
                    )
                ) {
                    return;
                }

                project.zones.forEach(
                    function (zone) {

                        if (
                            !zone ||
                            !Array.isArray(
                                zone.visuals
                            )
                        ) {
                            return;
                        }

                        zone.visuals.forEach(
                            function (visual) {

                                result.push({

                                    ...visual,

                                    projectId:
                                        visual.projectId ??
                                        visual.project_id ??
                                        project.id,

                                    projectTitle:
                                        visual.projectTitle ??
                                        project.title,

                                    zoneId:
                                        visual.zoneId ??
                                        visual.current_zone ??
                                        zone.id,

                                    zoneCode:
                                        visual.zoneCode ??
                                        zone.code

                                });

                            }
                        );

                    }
                );

            }
        );

        return result;
    }


    // --------------------------------------------------------
    // Load projects into interaction state
    // --------------------------------------------------------

    function setProjects(
        projects
    ) {

        state.projects =
            normalizeProjects(
                projects
            );

        /*
         * Prefer the ProjectLayoutAdapter because it already
         * knows how FEEMAAS visual data is normalized.
         */

        let visuals = [];

        const adapter =
            window.FEEMAAS &&
            window.FEEMAAS.ProjectLayoutAdapter;

        if (
            adapter &&
            typeof adapter.adaptProjects ===
            "function"
        ) {

            try {

                const adapted =
                    adapter.adaptProjects(
                        state.projects
                    );

                if (
                    typeof adapter.flattenVisuals ===
                    "function"
                ) {

                    visuals =
                        adapter.flattenVisuals(
                            adapted
                        );

                }

            } catch (err) {

                warn(
                    "Adapter failed. Falling back to raw projects.",
                    err
                );

                visuals =
                    flattenProjects(
                        state.projects
                    );

            }

        } else {

            visuals =
                flattenProjects(
                    state.projects
                );

        }

        state.visuals =
            Array.isArray(visuals)
                ? visuals
                : [];

        state.statistics.projects =
            state.projects.length;

        state.statistics.visuals =
            state.visuals.length;

        log(
            "Projects synchronized:",
            state.statistics.projects,
            "projects /",
            state.statistics.visuals,
            "visuals"
        );

        emit(
            "projects-synchronized",
            {

                projects:
                    state.projects,

                visuals:
                    state.visuals,

                statistics:
                    {
                        ...state.statistics
                    }

            }
        );

        return state.visuals;
    }


    // --------------------------------------------------------
    // Refresh visual references
    // --------------------------------------------------------

    function refreshDOMReferences() {

        if (
            state.selectedVisualId === null
        ) {
            return;
        }

        state.selectedVisualElement =
            getVisualElement(
                state.selectedVisualId
            );

        if (
            state.selectedVisualElement
        ) {

            state.selectedVisualElement
                .classList
                .add(
                    config.selection.selectedClass
                );

        }

    }


    // --------------------------------------------------------
    // Initialize
    // --------------------------------------------------------

    function initialize(
        projects
    ) {

        log(
            "Initializing V2..."
        );

        injectCSS();

        const workspace =
            getWorkspaceElement();

        if (!workspace) {

            warn(
                "Workspace not found. " +
                "Interaction will retry."
            );

            return false;
        }

        state.workspaceElement =
            workspace;

        if (Array.isArray(projects)) {

            setProjects(
                projects
            );

        }

        attachHandlers();

        refreshDOMReferences();

        state.initialized = true;

        log(
            "Initialization complete."
        );

        emit(
            "initialized",
            getStateSnapshot()
        );

        return true;
    }


    // --------------------------------------------------------
    // Destroy
    // --------------------------------------------------------

    function destroy() {

        detachHandlers();

        clearSelection();

        state.initialized = false;

        state.projects = [];

        state.visuals = [];

        state.dragging = false;

        state.draggingVisualId = null;

        state.currentDropTarget = null;

        state.currentZone = null;

        log(
            "Destroyed."
        );

        emit(
            "destroyed",
            getStateSnapshot()
        );
    }


    // --------------------------------------------------------
    // State snapshot
    // --------------------------------------------------------

    function getStateSnapshot() {

        return {

            version: VERSION,

            initialized:
                state.initialized,

            workspaceFound:
                Boolean(
                    getWorkspaceElement()
                ),

            selectedVisualId:
                state.selectedVisualId,

            selectedProjectId:
                state.selectedProjectId,

            projects:
                state.projects.length,

            visuals:
                state.visuals.length,

            selected:
                state.statistics.selected,

            dragging:
                state.dragging,

            draggingVisualId:
                state.draggingVisualId,

            currentZone:
                state.currentZone,

            handlersAttached:
                state.handlersAttached,

            statistics:
                {
                    ...state.statistics
                }

        };
    }


    // --------------------------------------------------------
    // Get selected data
    // --------------------------------------------------------

    function getSelectedVisual() {

        if (
            state.selectedVisualId === null
        ) {
            return null;
        }

        return findVisualData(
            state.selectedVisualId
        );
    }


    function getSelectedProject() {

        if (
            state.selectedProjectId === null
        ) {
            return null;
        }

        return findProject(
            state.selectedProjectId
        );
    }


    // --------------------------------------------------------
    // Public event subscription
    // --------------------------------------------------------

    function subscribe(
        eventName,
        callback
    ) {

        return on(
            eventName,
            callback
        );
    }


    // --------------------------------------------------------
    // Manual visual selection
    // --------------------------------------------------------

    function select(
        visualId
    ) {

        const element =
            getVisualElement(
                visualId
            );

        return selectVisual(
            visualId,
            element
        );
    }


    // --------------------------------------------------------
    // Clear
    // --------------------------------------------------------

    function clear() {

        clearSelection();
    }


    // --------------------------------------------------------
    // Reconnect
    // --------------------------------------------------------

    function reconnect(
        projects
    ) {

        if (
            state.handlersAttached
        ) {

            detachHandlers();

        }

        state.workspaceElement =
            null;

        return initialize(
            projects
        );
    }


    // --------------------------------------------------------
    // Test
    // --------------------------------------------------------

    function test() {

        const workspace =
            getWorkspaceElement();

        const renderer =
            getRenderer();

        const adapter =
            window.FEEMAAS &&
            window.FEEMAAS.ProjectLayoutAdapter;

        const layout =
            window.FEEMAAS &&
            window.FEEMAAS.Layout;

        const result = {

            version: VERSION,

            workspaceFound:
                Boolean(workspace),

            rendererAvailable:
                Boolean(renderer),

            adapterAvailable:
                Boolean(adapter),

            layoutAvailable:
                Boolean(layout),

            initialized:
                state.initialized,

            handlersAttached:
                state.handlersAttached,

            projects:
                state.projects.length,

            visuals:
                state.visuals.length,

            selectedVisualId:
                state.selectedVisualId,

            selectedProjectId:
                state.selectedProjectId

        };

        console.log(
            "FEEMAAS Workspace Interaction V2 Test:",
            result
        );

        return result;
    }


    // --------------------------------------------------------
    // Automatic initialization helper
    // --------------------------------------------------------

    function initializeWhenReady(
        projects
    ) {

        if (
            getWorkspaceElement()
        ) {

            return initialize(
                projects
            );

        }

        /*
         * Workspace may be created by workspace.js
         * after this engine is loaded.
         */

        let attempts = 0;

        const maxAttempts = 30;

        const timer =
            setInterval(
                function () {

                    attempts++;

                    if (
                        getWorkspaceElement()
                    ) {

                        clearInterval(
                            timer
                        );

                        initialize(
                            projects
                        );

                        return;
                    }

                    if (
                        attempts >=
                        maxAttempts
                    ) {

                        clearInterval(
                            timer
                        );

                        warn(
                            "Workspace was not found after retry period."
                        );

                    }

                },
                250
            );

        return true;
    }


    // --------------------------------------------------------
    // Public API
    // --------------------------------------------------------

    FEEMAAS.WorkspaceInteraction = {

        version: VERSION,

        config,

        initialize,

        initializeWhenReady,

        destroy,

        reconnect,

        setProjects,

        select,

        clear,

        getSelectedVisual,

        getSelectedProject,

        getStateSnapshot,

        subscribe,

        getWorkspaceElement,

        getVisualElement,

        getVisualIdFromElement,

        findVisualData,

        findProject,

        detectDropTarget,

        isDecisionField,

        isWaitingArea,

        test,

        /*
         * Exposed intentionally for Renderer integration.
         */

        handleVisualDoubleClick

    };


    // --------------------------------------------------------
    // Global events for external modules
    // --------------------------------------------------------

    FEEMAAS.WorkspaceInteraction.on =
        subscribe;


    // --------------------------------------------------------
    // Load message
    // --------------------------------------------------------

    console.log(
        "FEEMAAS Workspace Interaction Engine Version 2.0.0 loaded."
    );

})();