// ============================================================
// FEEMAAS Workspace Layout Renderer
// Version 1.0.1
//
// Purpose:
// Render FEEMAAS.Layout calculated positions inside Workspace.
//
// IMPORTANT:
// This module does NOT own:
// - project creation
// - project persistence
// - drag & drop
// - API calls
//
// It only renders already-calculated layout data.
// ============================================================

(function (window) {
    "use strict";

    // --------------------------------------------------------
    // FEEMAAS namespace
    // --------------------------------------------------------

    window.FEEMAAS = window.FEEMAAS || {};

    // --------------------------------------------------------
    // Renderer
    // --------------------------------------------------------

    const Renderer = {

        version: "1.0.1",

        // ----------------------------------------------------
        // Configuration
        // ----------------------------------------------------

        config: {
            workspaceSelector: "#workspace",
            visualClass: "feemaas-layout-visual",

            // Safety margin so visuals do not touch edges.
            padding: 24,

            // Maximum number of visuals rendered directly
            // into the normal workspace.
            maxVisiblePerZone: 96,

            // Default visual size.
            defaultSize: 70
        },

        // ----------------------------------------------------
        // Resolve workspace element safely
        // ----------------------------------------------------

        getWorkspaceElement() {
            const element =
                document.querySelector(this.config.workspaceSelector) ||
                document.querySelector(".workspace") ||
                document.querySelector("[data-feemaas-workspace]");

            return element || null;
        },

        // ----------------------------------------------------
        // Create visual element
        // ----------------------------------------------------

        createVisualElement(visual) {

            const element = document.createElement("div");

            element.className = this.config.visualClass;

            element.dataset.visualId =
                visual.visualId ??
                visual.id ??
                "";

            element.dataset.projectId =
                visual.projectId ??
                "";

            element.dataset.zoneId =
                visual.zoneId ??
                "";

            element.dataset.zoneCode =
                visual.zoneCode ??
                "";

            element.dataset.shape =
                visual.shapeType ??
                "triangle";

            // ------------------------------------------------
            // Position
            // ------------------------------------------------

            const position =
                visual.displayPosition ||
                visual.position ||
                {
                    x: 0,
                    y: 0
                };

            const x = Number(position.x) || 0;
            const y = Number(position.y) || 0;

            const size =
                Number(visual.size) ||
                this.config.defaultSize;

            element.style.position = "absolute";

            element.style.left =
                `${x - size / 2}px`;

            element.style.top =
                `${y - size / 2}px`;

            element.style.width =
                `${size}px`;

            element.style.height =
                `${size}px`;

            // ------------------------------------------------
            // Shape
            // ------------------------------------------------

            const shape =
                visual.shapeType ||
                "triangle";

            const color =
                visual.color ||
                "#8B4513";

            element.style.background =
                color;

            element.style.boxSizing =
                "border-box";

            element.style.cursor =
                "pointer";

            element.style.zIndex =
                String(
                    10 +
                    (Number(visual.layout?.row) || 0)
                );

            // ------------------------------------------------
            // Shape geometry
            // ------------------------------------------------

            if (shape === "triangle") {

                element.style.clipPath =
                    "polygon(50% 0%, 100% 100%, 0% 100%)";

            } else if (shape === "square") {

                element.style.borderRadius =
                    "8px";

            } else if (shape === "circle") {

                element.style.borderRadius =
                    "50%";

            } else if (shape === "hexagon") {

                element.style.clipPath =
                    "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

            } else if (shape === "pentagon") {

                element.style.clipPath =
                    "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)";

            } else {

                element.style.borderRadius =
                    "12px";
            }

            // ------------------------------------------------
            // Visual metadata
            // ------------------------------------------------

            element.title =
                visual.projectTitle ||
                `Project ${visual.projectId || ""}`;

            // ------------------------------------------------
            // Click event
            // ------------------------------------------------

            element.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    Renderer.handleVisualClick(
                        visual,
                        element
                    );
                }
            );

            // ------------------------------------------------
            // Double click event
            // ------------------------------------------------

            element.addEventListener(
                "dblclick",
                function (event) {

                    event.stopPropagation();

                    Renderer.handleVisualDoubleClick(
                        visual,
                        element
                    );
                }
            );

            return element;
        },

        // ----------------------------------------------------
        // Click
        // ----------------------------------------------------

        handleVisualClick(visual, element) {

            console.log(
                "FEEMAAS Renderer: visual selected",
                {
                    visualId: visual.visualId,
                    projectId: visual.projectId,
                    projectTitle: visual.projectTitle,
                    zone: visual.zoneCode
                }
            );

            // Keep selection behavior compatible with
            // the existing Workspace Engine.

            document
                .querySelectorAll(
                    `.${this.config.visualClass}`
                )
                .forEach(function (node) {

                    node.classList.remove(
                        "feemaas-layout-selected"
                    );
                });

            element.classList.add(
                "feemaas-layout-selected"
            );
        },

        // ----------------------------------------------------
        // Double click
        // ----------------------------------------------------

        handleVisualDoubleClick(visual) {

            console.log(
                "FEEMAAS Renderer: visual double clicked",
                visual
            );

            // Existing Workspace V8 owns the project
            // information popup.
            //
            // We intentionally do NOT create a second
            // project popup here.
            //
            // If Workspace V8 exposes an existing function,
            // use it.

            if (
                typeof window.openProjectDetails ===
                "function"
            ) {

                window.openProjectDetails(
                    visual.projectId
                );

                return;
            }

            if (
                typeof window.showProjectDetails ===
                "function"
            ) {

                window.showProjectDetails(
                    visual.projectId
                );

                return;
            }

            // Safe fallback for current development stage.

            console.log(
                "FEEMAAS Renderer: project details handler not found.",
                visual.projectId
            );
        },

        // ----------------------------------------------------
        // Clear rendered visuals
        // ----------------------------------------------------

        clear() {

            const workspace =
                this.getWorkspaceElement();

            if (!workspace) {

                console.warn(
                    "FEEMAAS Renderer: workspace element not found."
                );

                return;
            }

            workspace
                .querySelectorAll(
                    `.${this.config.visualClass}`
                )
                .forEach(function (element) {

                    element.remove();
                });
        },

        // ----------------------------------------------------
        // Render visuals
        // ----------------------------------------------------

        render(visuals) {

            const workspace =
                this.getWorkspaceElement();

            if (!workspace) {

                console.warn(
                    "FEEMAAS Renderer: workspace element not found."
                );

                return {
                    rendered: 0,
                    skipped: visuals?.length || 0
                };
            }

            if (!Array.isArray(visuals)) {

                console.warn(
                    "FEEMAAS Renderer: visuals must be an array."
                );

                return {
                    rendered: 0,
                    skipped: 0
                };
            }

            // ------------------------------------------------
            // Ensure positioning context
            // ------------------------------------------------

            const computed =
                window.getComputedStyle(
                    workspace
                );

            if (
                computed.position === "static"
            ) {

                workspace.style.position =
                    "relative";
            }

            // ------------------------------------------------
            // Remove previous renderer visuals
            // ------------------------------------------------

            this.clear();

            let rendered = 0;
            let skipped = 0;

            // ------------------------------------------------
            // Render
            // ------------------------------------------------

            visuals.forEach(
                function (visual) {

                    if (
                        visual.layout &&
                        visual.layout.overflow
                    ) {

                        skipped++;

                        return;
                    }

                    const element =
                        Renderer.createVisualElement(
                            visual
                        );

                    workspace.appendChild(
                        element
                    );

                    rendered++;
                }
            );

            console.log(
                "FEEMAAS Renderer: render complete",
                {
                    rendered,
                    skipped,
                    total: visuals.length
                }
            );

            return {
                rendered,
                skipped
            };
        },

        // ----------------------------------------------------
        // Render result from Layout Engine
        // ----------------------------------------------------

        renderLayoutResult(result) {

            if (!result) {

                console.warn(
                    "FEEMAAS Renderer: empty layout result."
                );

                return {
                    rendered: 0,
                    skipped: 0
                };
            }

            const visuals =
                Array.isArray(result.visuals)
                    ? result.visuals
                    : [];

            return this.render(
                visuals
            );
        },

        // ----------------------------------------------------
        // Render current projects
        // ----------------------------------------------------

        renderCurrentProjects(projects) {

            if (
                !window.FEEMAAS ||
                !window.FEEMAAS.ProjectLayoutAdapter
            ) {

                console.error(
                    "FEEMAAS Renderer: ProjectLayoutAdapter unavailable."
                );

                return {
                    rendered: 0,
                    skipped: 0
                };
            }

            if (
                !window.FEEMAAS.Layout
            ) {

                console.error(
                    "FEEMAAS Renderer: Layout Engine unavailable."
                );

                return {
                    rendered: 0,
                    skipped: 0
                };
            }

            const adapted =
                window.FEEMAAS.ProjectLayoutAdapter
                    .adaptProjects(
                        projects || []
                    );

            const visuals =
                window.FEEMAAS.ProjectLayoutAdapter
                    .flattenVisuals(
                        adapted
                    );

            const result =
                window.FEEMAAS.Layout.layoutByZone(
                    visuals
                );

            return this.renderLayoutResult(
                result
            );
        },

        // ----------------------------------------------------
        // Test
        // ----------------------------------------------------

        test() {

            const workspace =
                this.getWorkspaceElement();

            const result = {

                version: this.version,

                workspaceFound:
                    !!workspace,

                geometryAvailable:
                    !!(
                        window.FEEMAAS &&
                        window.FEEMAAS.Geometry
                    ),

                layoutAvailable:
                    !!(
                        window.FEEMAAS &&
                        window.FEEMAAS.Layout
                    ),

                adapterAvailable:
                    !!(
                        window.FEEMAAS &&
                        window.FEEMAAS.ProjectLayoutAdapter
                    )
            };

            console.log(
                "FEEMAAS Workspace Layout Renderer Test:",
                result
            );

            return result;
        }
    };

    // --------------------------------------------------------
    // Public API
    // --------------------------------------------------------

    window.FEEMAAS.WorkspaceLayoutRenderer =
        Renderer;

    console.log(
        "FEEMAAS Workspace Layout Renderer Version 1.0.1 loaded."
    );

})(window);