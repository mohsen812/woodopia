// =====================================
// FEEMAAS WORKSPACE ENGINE
// Version 6
//
// Shape-Agnostic Visual Object Engine
//
// Supported Shapes:
// triangle
// square
// hexagon
//
// Features:
// - Workspace rendering
// - 4 customer zones
// - Central plaza
// - Coordinate system
// - Visual selection
// - Visual drag
// - Visual persistence
// - Zone detection
// - Zone highlighting
//
// IMPORTANT:
// The 5 initial customer triangles are NOT created here.
// They belong to the customer/palette layer.
// This engine only renders actual project visuals.
// =====================================


// =====================================
// API
// =====================================

const API_URL =
    "http://127.0.0.1:8000/api/projects/";


// =====================================
// GLOBAL STATE
// =====================================

let currentProject = null;
let currentVisual = null;

let selectedVisualElement = null;

let isDragging = false;

let dragStartX = 0;
let dragStartY = 0;

let objectStartX = 0;
let objectStartY = 0;


// =====================================
// WORKSPACE CONFIGURATION
// =====================================

const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;

const SVG_CENTER_X = SVG_WIDTH / 2;
const SVG_CENTER_Y = SVG_HEIGHT / 2;

const SVG_NS =
    "http://www.w3.org/2000/svg";


// =====================================
// CENTRAL PLAZA CONFIG
// =====================================

const CENTRAL_PLAZA = {
    x: SVG_CENTER_X,
    y: SVG_CENTER_Y,
    radius: 55
};


// =====================================
// CUSTOMER ZONES
//
// The workspace has exactly 4 zones.
//
// A = top-left
// B = top-right
// C = bottom-left
// D = bottom-right
//
// IMPORTANT:
// Central plaza is NOT a fifth zone.
// =====================================

const WORKSPACE_ZONES = [

    {
        id: "A",
        name: "ZONE A",
        role: "customer",

        x: 40,
        y: 40,

        width: 300,
        height: 170,

        behavior: "neon"
    },

    {
        id: "B",
        name: "ZONE B",
        role: "customer",

        x: 460,
        y: 40,

        width: 300,
        height: 170,

        behavior: "neon"
    },

    {
        id: "C",
        name: "ZONE C",
        role: "customer",

        x: 40,
        y: 290,

        width: 300,
        height: 170,

        behavior: "neon"
    },

    {
        id: "D",
        name: "ZONE D",
        role: "customer",

        x: 460,
        y: 290,

        width: 300,
        height: 170,

        behavior: "neon"
    }

];


// =====================================
// START
// =====================================
document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeCapacityTriangles();

        initializeWorkspaceDropZone();

        initializeProjectModal();

        loadProject();

    }
);

// =====================================
// CUSTOMER CAPACITY TRIANGLES
// =====================================
//
// These are the 5 initial project slots.
//
// IMPORTANT:
// They are NOT project visuals yet.
//
// They become a project only after
// the customer starts an interaction.
// =====================================

let draggedCapacityTriangle = null;


// =====================================
// INITIALIZE CAPACITY TRIANGLES
// =====================================

function initializeCapacityTriangles() {

    const triangles =
        document.querySelectorAll(
            ".capacity-triangle"
        );


    if (!triangles.length) {

        console.warn(
            "FEEMAAS: Capacity triangles not found."
        );

        return;

    }


    triangles.forEach(
        triangle => {

            // ---------------------------------
            // Native drag
            // ---------------------------------

            triangle.setAttribute(
                "draggable",
                "true"
            );


            triangle.addEventListener(
                "dragstart",
                startCapacityDrag
            );


            triangle.addEventListener(
                "dragend",
                stopCapacityDrag
            );


            // ---------------------------------
            // Double click
            // ---------------------------------

            triangle.addEventListener(
                "dblclick",
                () => {

                    openProjectModal(
                        triangle
                    );

                }
            );


            // ---------------------------------
            // Click / selection
            // ---------------------------------

            triangle.addEventListener(
                "click",
                () => {

                    selectCapacityTriangle(
                        triangle
                    );

                }
            );

        }
    );

}


// =====================================
// SELECT CAPACITY TRIANGLE
// =====================================

function selectCapacityTriangle(
    triangle
) {

    const triangles =
        document.querySelectorAll(
            ".capacity-triangle"
        );


    triangles.forEach(
        item => {

            item.classList.remove(
                "selected"
            );

        }
    );


    triangle.classList.add(
        "selected"
    );


    console.log(
        "FEEMAAS: Capacity triangle selected:",
        triangle.dataset.slot
    );

}


// =====================================
// START CAPACITY DRAG
// =====================================

function startCapacityDrag(event) {

    draggedCapacityTriangle =
        event.currentTarget;


    const slot =
        draggedCapacityTriangle.dataset.slot;


    // ---------------------------------
    // Store slot information
    // ---------------------------------

    event.dataTransfer.effectAllowed =
        "copy";


    event.dataTransfer.setData(
        "text/plain",
        slot
    );


    // ---------------------------------
    // Select triangle
    // ---------------------------------

    selectCapacityTriangle(
        draggedCapacityTriangle
    );


    draggedCapacityTriangle.classList.add(
        "dragging"
    );


    console.log(
        "FEEMAAS: Drag started:",
        slot
    );

}


// =====================================
// STOP CAPACITY DRAG
// =====================================

function stopCapacityDrag() {

    if (
        draggedCapacityTriangle
    ) {

        draggedCapacityTriangle.classList.remove(
            "dragging"
        );

    }


    draggedCapacityTriangle =
        null;

}


// =====================================
// ENABLE DROP ON WORKSPACE
// =====================================

function initializeWorkspaceDropZone() {

    const svg =
        document.getElementById(
            "visualCanvas"
        );


    if (!svg) {

        console.warn(
            "FEEMAAS: visualCanvas not found."
        );

        return;

    }


    // ---------------------------------
    // Allow drag over SVG
    // ---------------------------------

    svg.addEventListener(
        "dragover",
        handleWorkspaceDragOver
    );


    // ---------------------------------
    // Drop
    // ---------------------------------

    svg.addEventListener(
        "drop",
        handleWorkspaceDrop
    );

}


// =====================================
// DRAG OVER WORKSPACE
// =====================================

function handleWorkspaceDragOver(
    event
) {

    event.preventDefault();


    event.dataTransfer.dropEffect =
        "copy";

}


// =====================================
// DROP CAPACITY TRIANGLE
// =====================================

function handleWorkspaceDrop(
    event
) {

    event.preventDefault();


    if (
        !draggedCapacityTriangle
    ) {

        return;

    }


    const svg =
        document.getElementById(
            "visualCanvas"
        );


    if (!svg) {

        return;

    }


    const point =
        getSVGPoint(
            svg,
            event.clientX,
            event.clientY
        );


    const zone =
        detectPointZone(
            point.x,
            point.y
        );


    console.log(
        "FEEMAAS: Capacity triangle dropped:",
        {
            x: point.x,
            y: point.y,
            zone: zone
                ? zone.id
                : null
        }
    );


    // ---------------------------------
    // If dropped outside customer zones
    // ---------------------------------

    if (!zone) {

        console.log(
            "FEEMAAS: Triangle dropped outside customer zone."
        );

        return;

    }


    // ---------------------------------
    // Store pending creation data
    // ---------------------------------

    window.pendingProjectCreation = {

        slot:
            draggedCapacityTriangle.dataset.slot,

        zoneId:
            zone.id,

        position_x:
            Number(
                point.x -
                SVG_CENTER_X
            ),

        position_y:
            Number(
                point.y -
                SVG_CENTER_Y
            )

    };


    // ---------------------------------
    // Open project form
    // ---------------------------------

    openProjectModal(
        draggedCapacityTriangle
    );

}


// =====================================
// DETECT ZONE FROM SVG POINT
// =====================================

function detectPointZone(
    x,
    y
) {

    for (
        const zone of WORKSPACE_ZONES
    ) {

        const inside =
            x >= zone.x &&
            x <=
                zone.x +
                zone.width &&
            y >= zone.y &&
            y <=
                zone.y +
                zone.height;


        if (inside) {

            return zone;

        }

    }


    return null;

}


// =====================================
// PROJECT MODAL
// =====================================

function initializeProjectModal() {

    const modal =
        document.getElementById(
            "projectModal"
        );


    const closeButton =
        document.getElementById(
            "closeModal"
        );


    const createButton =
        document.getElementById(
            "createProjectBtn"
        );


    if (!modal) {

        console.warn(
            "FEEMAAS: projectModal not found."
        );

        return;

    }


    // ---------------------------------
    // Close
    // ---------------------------------

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeProjectModal
        );

    }


    // ---------------------------------
    // Create project
    // ---------------------------------

    if (createButton) {

        createButton.addEventListener(
            "click",
            handleCreateProject
        );

    }


    // ---------------------------------
    // Click outside modal box
    // ---------------------------------

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeProjectModal();

            }

        }
    );

}


// =====================================
// OPEN PROJECT MODAL
// =====================================

function openProjectModal(
    triangle = null
) {

    const modal =
        document.getElementById(
            "projectModal"
        );


    if (!modal) {

        console.warn(
            "FEEMAAS: projectModal not found."
        );

        return;

    }


    if (triangle) {

        selectCapacityTriangle(
            triangle
        );


        // ---------------------------------
        // If opened by double click rather
        // than drag, create pending data.
        // ---------------------------------

        if (
            !window.pendingProjectCreation
        ) {

            window.pendingProjectCreation = {

                slot:
                    triangle.dataset.slot,

                zoneId:
                    null,

                position_x:
                    0,

                position_y:
                    0

            };

        }

    }


    modal.classList.remove(
        "hidden"
    );

}


// =====================================
// CLOSE PROJECT MODAL
// =====================================

function closeProjectModal() {

    const modal =
        document.getElementById(
            "projectModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "hidden"
    );


    // ---------------------------------
    // Do not destroy the selected slot.
    // Just clear pending operation.
    // ---------------------------------

    window.pendingProjectCreation =
        null;

}


// =====================================
// CREATE PROJECT
// =====================================
//
// IMPORTANT:
//
// For now this function does NOT invent
// a backend payload.
//
// We first verify that the UI flow works.
//
// Backend creation will be connected
// after we confirm the exact API schema.
// =====================================

function handleCreateProject() {

    const title =
        document.getElementById(
            "projectTitleInput"
        );


    const description =
        document.getElementById(
            "projectDescriptionInput"
        );


    const quantity =
        document.getElementById(
            "projectQuantityInput"
        );


    const budget =
        document.getElementById(
            "projectBudgetInput"
        );


    const pending =
        window.pendingProjectCreation;


    console.log(
        "FEEMAAS: Project creation request",
        {

            title:
                title
                    ? title.value
                    : "",

            description:
                description
                    ? description.value
                    : "",

            quantity:
                quantity
                    ? quantity.value
                    : "",

            budget:
                budget
                    ? budget.value
                    : "",

            pending

        }
    );


    // ---------------------------------
    // Temporary UI confirmation
    // ---------------------------------

    closeProjectModal();


    console.log(
        "FEEMAAS: Project form captured."
    );

}
// =====================================
// LOAD PROJECT
// =====================================

async function loadProject() {

    try {

        const response =
            await fetch(API_URL);

        if (!response.ok) {

            throw new Error(
                `API error: ${response.status}`
            );

        }

        const projects =
            await response.json();

        if (
            !Array.isArray(projects) ||
            projects.length === 0
        ) {

            console.warn(
                "FEEMAAS: No projects found."
            );

            drawWorkspace();

            return;

        }

        // ---------------------------------
        // Current temporary strategy:
        // use first project.
        // ---------------------------------

        currentProject =
            projects[0];

        showProject(
            currentProject
        );

    }

    catch (error) {

        console.error(
            "FEEMAAS API Error:",
            error
        );

        // Even if API fails,
        // workspace itself should render.

        drawWorkspace();

    }

}


// =====================================
// SHOW PROJECT
// =====================================

function showProject(project) {

    if (!project) {

        return;

    }

    // ---------------------------------
    // PROJECT INFORMATION
    // ---------------------------------

    const projectTitle =
        document.getElementById(
            "projectTitle"
        );

    const projectDescription =
        document.getElementById(
            "projectDescription"
        );

    const zoneName =
        document.getElementById(
            "zoneName"
        );


    if (projectTitle) {

        projectTitle.innerText =
            project.title || "";

    }


    if (projectDescription) {

        projectDescription.innerText =
            project.description || "";

    }


    // ---------------------------------
    // DRAW WORKSPACE
    // ---------------------------------

    drawWorkspace();


    // ---------------------------------
    // FIND PROJECT VISUAL
    // ---------------------------------

    if (
        !project.zones ||
        !project.zones.length
    ) {

        return;

    }


    const zone =
        project.zones[0];


    if (zoneName) {

        zoneName.innerText =
            zone.name || "";

    }


    if (
        zone.visuals &&
        zone.visuals.length
    ) {

        drawVisual(
            zone.visuals[0]
        );

    }

}


// =====================================
// DRAW WORKSPACE
// =====================================
//
// Rendering order:
//
// 1. Background
// 2. Coordinate system
// 3. Four zones
// 4. Central plaza
//
// There is NO ROAD layer.
// There is NO extra central shape.
// =====================================

function drawWorkspace() {

    const svg =
        document.getElementById(
            "visualCanvas"
        );

    if (!svg) {

        console.warn(
            "FEEMAAS: #visualCanvas not found."
        );

        return;

    }


    // ---------------------------------
    // Clear old workspace
    // ---------------------------------

    svg.innerHTML = "";


    // ---------------------------------
    // Make sure SVG has correct viewBox
    // ---------------------------------

    svg.setAttribute(
        "viewBox",
        `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`
    );


    // ---------------------------------
    // Background
    // ---------------------------------

    drawBackground(svg);


    // ---------------------------------
    // Coordinate system
    // ---------------------------------

    drawCoordinateSystem(svg);


    // ---------------------------------
    // Four zones
    // ---------------------------------

    WORKSPACE_ZONES.forEach(
        zone => {

            drawZone(
                svg,
                zone
            );

        }
    );


    // ---------------------------------
    // Central plaza
    // ---------------------------------

    drawCentralPlaza(svg);

}


// =====================================
// DRAW BACKGROUND
// =====================================

function drawBackground(svg) {

    const background =
        document.createElementNS(
            SVG_NS,
            "rect"
        );


    background.setAttribute(
        "x",
        "0"
    );

    background.setAttribute(
        "y",
        "0"
    );

    background.setAttribute(
        "width",
        SVG_WIDTH
    );

    background.setAttribute(
        "height",
        SVG_HEIGHT
    );

    background.setAttribute(
        "fill",
        "#f8fafc"
    );

    background.setAttribute(
        "rx",
        "18"
    );


    background.setAttribute(
        "data-workspace-background",
        "true"
    );


    svg.appendChild(
        background
    );

}


// =====================================
// DRAW COORDINATE SYSTEM
// =====================================
//
// IMPORTANT:
//
// No roads.
//
// Only two thin crossing lines:
//
// horizontal:
// Y = 250
//
// vertical:
// X = 400
//
// They visually divide the workspace
// into four quadrants.
// =====================================

function drawCoordinateSystem(svg) {

    // ---------------------------------
    // Horizontal axis
    // ---------------------------------

    const horizontal =
        document.createElementNS(
            SVG_NS,
            "line"
        );


    horizontal.setAttribute(
        "x1",
        "0"
    );

    horizontal.setAttribute(
        "y1",
        SVG_CENTER_Y
    );

    horizontal.setAttribute(
        "x2",
        SVG_WIDTH
    );

    horizontal.setAttribute(
        "y2",
        SVG_CENTER_Y
    );


    horizontal.setAttribute(
        "stroke",
        "#cbd5e1"
    );

    horizontal.setAttribute(
        "stroke-width",
        "2"
    );


    horizontal.setAttribute(
        "pointer-events",
        "none"
    );


    svg.appendChild(
        horizontal
    );


    // ---------------------------------
    // Vertical axis
    // ---------------------------------

    const vertical =
        document.createElementNS(
            SVG_NS,
            "line"
        );


    vertical.setAttribute(
        "x1",
        SVG_CENTER_X
    );

    vertical.setAttribute(
        "y1",
        "0"
    );

    vertical.setAttribute(
        "x2",
        SVG_CENTER_X
    );

    vertical.setAttribute(
        "y2",
        SVG_HEIGHT
    );


    vertical.setAttribute(
        "stroke",
        "#cbd5e1"
    );

    vertical.setAttribute(
        "stroke-width",
        "2"
    );


    vertical.setAttribute(
        "pointer-events",
        "none"
    );


    svg.appendChild(
        vertical
    );

}


// =====================================
// DRAW CENTRAL PLAZA
// =====================================
//
// The plaza is infrastructure,
// not a project visual.
//
// Therefore:
// - no visual id
// - no drag
// - no project shape
// - no extra triangle
// =====================================

function drawCentralPlaza(svg) {

    const circle =
        document.createElementNS(
            SVG_NS,
            "circle"
        );


    circle.setAttribute(
        "cx",
        CENTRAL_PLAZA.x
    );

    circle.setAttribute(
        "cy",
        CENTRAL_PLAZA.y
    );

    circle.setAttribute(
        "r",
        CENTRAL_PLAZA.radius
    );


    circle.setAttribute(
        "fill",
        "#ffffff"
    );


    circle.setAttribute(
        "stroke",
        "#38bdf8"
    );


    circle.setAttribute(
        "stroke-width",
        "4"
    );


    circle.setAttribute(
        "id",
        "consultantPlaza"
    );


    circle.setAttribute(
        "data-plaza",
        "central"
    );


    circle.setAttribute(
        "pointer-events",
        "none"
    );


    svg.appendChild(
        circle
    );

}


// =====================================
// DRAW ZONE
// =====================================

function drawZone(
    svg,
    zone
) {

    if (!zone) {

        return;

    }


    const group =
        document.createElementNS(
            SVG_NS,
            "g"
        );


    group.setAttribute(
        "data-zone-id",
        zone.id
    );


    group.setAttribute(
        "data-zone-role",
        zone.role || ""
    );


    // ---------------------------------
    // Zone rectangle
    // ---------------------------------

    const zoneRect =
        document.createElementNS(
            SVG_NS,
            "rect"
        );


    zoneRect.setAttribute(
        "x",
        zone.x
    );

    zoneRect.setAttribute(
        "y",
        zone.y
    );

    zoneRect.setAttribute(
        "width",
        zone.width
    );

    zoneRect.setAttribute(
        "height",
        zone.height
    );


    zoneRect.setAttribute(
        "rx",
        "24"
    );


    zoneRect.setAttribute(
        "fill",
        "rgba(255,255,255,0.45)"
    );


    zoneRect.setAttribute(
        "stroke",
        "#cbd5e1"
    );


    zoneRect.setAttribute(
        "stroke-width",
        "1"
    );


    zoneRect.setAttribute(
        "class",
        "workspace-zone"
    );


    zoneRect.setAttribute(
        "pointer-events",
        "none"
    );


    group.appendChild(
        zoneRect
    );


    // ---------------------------------
    // Zone label
    // ---------------------------------

    const label =
        document.createElementNS(
            SVG_NS,
            "text"
        );


    label.setAttribute(
        "x",
        zone.x + 18
    );


    label.setAttribute(
        "y",
        zone.y + 28
    );


    label.setAttribute(
        "font-family",
        "Tahoma, Arial, sans-serif"
    );


    label.setAttribute(
        "font-size",
        "11"
    );


    label.setAttribute(
        "font-weight",
        "bold"
    );


    label.setAttribute(
        "fill",
        "#94a3b8"
    );


    label.setAttribute(
        "pointer-events",
        "none"
    );


    label.textContent =
        zone.name;


    group.appendChild(
        label
    );


    svg.appendChild(
        group
    );

}


// =====================================
// DRAW VISUAL
// =====================================
//
// This function renders the ACTUAL
// project visual.
//
// It does NOT create the 5 initial
// customer triangles.
//
// The 5 triangles belong to the
// customer interaction/palette layer.
// =====================================

function drawVisual(visual) {

    if (!visual) {

        return;

    }


    // ---------------------------------
    // Normalize position
    // ---------------------------------

    visual.position_x =
        clamp(
            Number(
                visual.position_x
            ) || 0,

            -350,
            350
        );


    visual.position_y =
        clamp(
            Number(
                visual.position_y
            ) || 0,

            -200,
            200
        );


    currentVisual =
        visual;


    updateVisualPanel(
        visual
    );


    const svg =
        document.getElementById(
            "visualCanvas"
        );


    if (!svg) {

        return;

    }


    removeExistingVisuals(
        svg
    );


    const shapeType =
        String(
            visual.shape_type || ""
        ).toLowerCase();


    switch (shapeType) {

        case "triangle":

            createTriangle(
                svg,
                visual
            );

            break;


        case "square":

            createSquare(
                svg,
                visual
            );

            break;


        case "hexagon":

            createHexagon(
                svg,
                visual
            );

            break;


        default:

            console.warn(
                "FEEMAAS: Unsupported visual shape:",
                visual.shape_type
            );

            break;

    }

}


// =====================================
// REMOVE EXISTING VISUALS
// =====================================

function removeExistingVisuals(svg) {

    const visuals =
        svg.querySelectorAll(
            "[data-visual-id]"
        );


    visuals.forEach(
        element => {

            element.remove();

        }
    );


    selectedVisualElement =
        null;

}


// =====================================
// CREATE TRIANGLE
// =====================================

function createTriangle(
    svg,
    visual
) {

    createPolygonVisual(
        svg,
        visual,
        3,
        -90
    );

}


// =====================================
// CREATE SQUARE
// =====================================

function createSquare(
    svg,
    visual
) {

    createPolygonVisual(
        svg,
        visual,
        4,
        45
    );

}


// =====================================
// CREATE HEXAGON
// =====================================

function createHexagon(
    svg,
    visual
) {

    createPolygonVisual(
        svg,
        visual,
        6,
        30
    );

}


// =====================================
// GENERIC POLYGON VISUAL
// =====================================

function createPolygonVisual(
    svg,
    visual,
    sides,
    angleOffset
) {

    const size =
        Number(
            visual.size
        ) || 100;


    const x =
        Number(
            visual.position_x
        ) || 0;


    const y =
        Number(
            visual.position_y
        ) || 0;


    const rotation =
        Number(
            visual.rotation
        ) || 0;


    const centerX =
        SVG_CENTER_X + x;


    const centerY =
        SVG_CENTER_Y + y;


    const points =
        buildPolygonPoints(
            centerX,
            centerY,
            size,
            sides,
            angleOffset
        );


    const polygon =
        document.createElementNS(
            SVG_NS,
            "polygon"
        );


    polygon.setAttribute(
        "points",
        points
    );


    polygon.setAttribute(
        "fill",
        visual.color ||
        "#8B4513"
    );


    polygon.setAttribute(
        "stroke",
        "#5b3a20"
    );


    polygon.setAttribute(
        "stroke-width",
        "3"
    );


    polygon.setAttribute(
        "opacity",
        "0.9"
    );


    polygon.setAttribute(
        "data-visual-id",
        visual.id
    );


    polygon.setAttribute(
        "data-shape-type",
        visual.shape_type
    );


    polygon.setAttribute(
        "data-sides",
        sides
    );


    polygon.setAttribute(
        "data-angle-offset",
        angleOffset
    );


    polygon.setAttribute(
        "data-x",
        x
    );


    polygon.setAttribute(
        "data-y",
        y
    );


    polygon.style.cursor =
        "grab";


    polygon.setAttribute(
        "transform",
        `rotate(${rotation} ${centerX} ${centerY})`
    );


    // ---------------------------------
    // Interaction
    // ---------------------------------

    polygon.addEventListener(
        "mousedown",
        startDrag
    );


    polygon.addEventListener(
        "click",
        selectVisual
    );


    svg.appendChild(
        polygon
    );


    // ---------------------------------
    // IMPORTANT:
    // Do NOT reset selection here.
    // ---------------------------------

    updateZoneState(
        visual
    );

}


// =====================================
// BUILD POLYGON POINTS
// =====================================

function buildPolygonPoints(
    centerX,
    centerY,
    size,
    sides,
    angleOffset
) {

    const radius =
        size / 2;


    const points = [];


    for (
        let i = 0;
        i < sides;
        i++
    ) {

        const angle =
            (
                angleOffset +
                (360 / sides) * i
            ) *
            Math.PI /
            180;


        const pointX =
            centerX +
            radius *
            Math.cos(angle);


        const pointY =
            centerY +
            radius *
            Math.sin(angle);


        points.push(
            `${pointX},${pointY}`
        );

    }


    return points.join(
        " "
    );

}


// =====================================
// SELECT VISUAL
// =====================================

function selectVisual(event) {

    event.stopPropagation();


    const element =
        event.currentTarget;


    // ---------------------------------
    // Clear previous selection
    // ---------------------------------

    if (
        selectedVisualElement &&
        selectedVisualElement !== element
    ) {

        restoreVisualAppearance(
            selectedVisualElement
        );

    }


    // ---------------------------------
    // Select current
    // ---------------------------------

    selectedVisualElement =
        element;


    selectedVisualElement.setAttribute(
        "stroke",
        "#2563eb"
    );


    selectedVisualElement.setAttribute(
        "stroke-width",
        "6"
    );


    selectedVisualElement.style.cursor =
        "grab";


    // ---------------------------------
    // Keep zone state synchronized
    // ---------------------------------

    if (currentVisual) {

        updateZoneState(
            currentVisual
        );

    }

}


// =====================================
// RESTORE VISUAL APPEARANCE
// =====================================

function restoreVisualAppearance(
    element
) {

    if (!element) {

        return;

    }


    element.setAttribute(
        "stroke",
        "#5b3a20"
    );


    element.setAttribute(
        "stroke-width",
        "3"
    );


    element.removeAttribute(
        "filter"
    );

}


// =====================================
// START DRAG
// =====================================

function startDrag(event) {

    event.preventDefault();
    event.stopPropagation();


    const element =
        event.currentTarget;


    // ---------------------------------
    // Select before dragging
    // ---------------------------------

    if (
        selectedVisualElement !==
        element
    ) {

        selectVisual(
            event
        );

    }


    isDragging =
        true;


    const svg =
        document.getElementById(
            "visualCanvas"
        );


    if (!svg) {

        return;

    }


    const point =
        getSVGPoint(
            svg,
            event.clientX,
            event.clientY
        );


    dragStartX =
        point.x;


    dragStartY =
        point.y;


    objectStartX =
        Number(
            element.dataset.x
        ) || 0;


    objectStartY =
        Number(
            element.dataset.y
        ) || 0;


    element.style.cursor =
        "grabbing";


    document.addEventListener(
        "mousemove",
        dragVisual
    );


    document.addEventListener(
        "mouseup",
        stopDrag
    );

}


// =====================================
// DRAG VISUAL
// =====================================

function dragVisual(event) {

    if (!isDragging) {

        return;

    }


    if (!selectedVisualElement) {

        return;

    }


    const svg =
        document.getElementById(
            "visualCanvas"
        );


    if (!svg) {

        return;

    }


    const point =
        getSVGPoint(
            svg,
            event.clientX,
            event.clientY
        );


    const deltaX =
        point.x -
        dragStartX;


    const deltaY =
        point.y -
        dragStartY;


    const newX =
        objectStartX +
        deltaX;


    const newY =
        objectStartY +
        deltaY;


    updateVisualPosition(
        selectedVisualElement,
        newX,
        newY
    );

}


// =====================================
// UPDATE VISUAL POSITION
// =====================================

function updateVisualPosition(
    visualElement,
    x,
    y
) {

    if (!visualElement) {

        return;

    }


    if (!currentVisual) {

        return;

    }


    const size =
        Number(
            currentVisual.size
        ) || 100;


    // ---------------------------------
    // Keep visual inside workspace
    // ---------------------------------

    const radius =
        size / 2;


    const minX =
        -SVG_CENTER_X +
        radius;


    const maxX =
        SVG_CENTER_X -
        radius;


    const minY =
        -SVG_CENTER_Y +
        radius;


    const maxY =
        SVG_CENTER_Y -
        radius;


    x =
        clamp(
            x,
            minX,
            maxX
        );


    y =
        clamp(
            y,
            minY,
            maxY
        );


    // ---------------------------------
    // Calculate new center
    // ---------------------------------

    const centerX =
        SVG_CENTER_X + x;


    const centerY =
        SVG_CENTER_Y + y;


    const rotation =
        Number(
            currentVisual.rotation
        ) || 0;


    const sides =
        Number(
            visualElement.dataset.sides
        ) || 3;


    const angleOffset =
        Number(
            visualElement.dataset.angleOffset
        ) || 0;


    const points =
        buildPolygonPoints(
            centerX,
            centerY,
            size,
            sides,
            angleOffset
        );


    visualElement.setAttribute(
        "points",
        points
    );


    visualElement.setAttribute(
        "transform",
        `rotate(${rotation} ${centerX} ${centerY})`
    );


    visualElement.dataset.x =
        x;


    visualElement.dataset.y =
        y;


    currentVisual.position_x =
        Number(
            x.toFixed(2)
        );


    currentVisual.position_y =
        Number(
            y.toFixed(2)
        );


    updateVisualPanel(
        currentVisual
    );


    updateZoneState(
        currentVisual
    );

}


// =====================================
// BACKWARD COMPATIBILITY
// =====================================

function updateTrianglePosition(
    triangle,
    x,
    y
) {

    updateVisualPosition(
        triangle,
        x,
        y
    );

}


// =====================================
// ZONE DETECTION
// =====================================

function detectVisualZone(
    visual
) {

    if (!visual) {

        return null;

    }


    const centerX =
        SVG_CENTER_X +
        Number(
            visual.position_x
        );


    const centerY =
        SVG_CENTER_Y +
        Number(
            visual.position_y
        );


    for (
        const zone of WORKSPACE_ZONES
    ) {

        const inside =
            centerX >= zone.x &&
            centerX <=
                zone.x + zone.width &&
            centerY >= zone.y &&
            centerY <=
                zone.y + zone.height;


        if (inside) {

            return zone;

        }

    }


    return null;

}


// =====================================
// UPDATE ZONE STATE
// =====================================

function updateZoneState(
    visual
) {

    if (!visual) {

        return;

    }


    const zone =
        detectVisualZone(
            visual
        );


    if (zone) {

        applyZoneBehavior(
            visual,
            zone
        );

    }

    else {

        resetZoneBehavior(
            visual
        );

    }

}


// =====================================
// FIND VISUAL ELEMENT
// =====================================

function findVisualElement(
    visualId
) {

    if (
        visualId === null ||
        visualId === undefined
    ) {

        return null;

    }


    const elements =
        document.querySelectorAll(
            "[data-visual-id]"
        );


    for (
        const element of elements
    ) {

        if (
            String(
                element.getAttribute(
                    "data-visual-id"
                )
            ) ===
            String(
                visualId
            )
        ) {

            return element;

        }

    }


    return null;

}


// =====================================
// APPLY ZONE BEHAVIOR
// =====================================

function applyZoneBehavior(
    visual,
    zone
) {

    const visualElement =
        findVisualElement(
            visual.id
        );


    if (!visualElement) {

        return;

    }


    // ---------------------------------
    // Active customer zone
    // ---------------------------------

    if (
        zone.behavior ===
        "neon"
    ) {

        // ---------------------------------
        // IMPORTANT:
        // Selection has priority.
        // ---------------------------------

        if (
            selectedVisualElement ===
            visualElement
        ) {

            visualElement.setAttribute(
                "stroke",
                "#2563eb"
            );

            visualElement.setAttribute(
                "stroke-width",
                "6"
            );

        }

        else {

            visualElement.setAttribute(
                "stroke",
                "#22d3ee"
            );

            visualElement.setAttribute(
                "stroke-width",
                "5"
            );

        }


        visualElement.setAttribute(
            "filter",
            "drop-shadow(0 0 8px #22d3ee)"
        );


        visualElement.setAttribute(
            "data-active-zone",
            zone.id
        );

    }

}


// =====================================
// RESET ZONE BEHAVIOR
// =====================================

function resetZoneBehavior(
    visual
) {

    const visualElement =
        findVisualElement(
            visual.id
        );


    if (!visualElement) {

        return;

    }


    visualElement.removeAttribute(
        "filter"
    );


    visualElement.removeAttribute(
        "data-active-zone"
    );


    if (
        selectedVisualElement ===
        visualElement
    ) {

        visualElement.setAttribute(
            "stroke",
            "#2563eb"
        );

        visualElement.setAttribute(
            "stroke-width",
            "6"
        );

    }

    else {

        visualElement.setAttribute(
            "stroke",
            "#5b3a20"
        );

        visualElement.setAttribute(
            "stroke-width",
            "3"
        );

    }

}


// =====================================
// STOP DRAG
// =====================================

async function stopDrag() {

    if (!isDragging) {

        return;

    }


    isDragging =
        false;


    if (
        selectedVisualElement
    ) {

        selectedVisualElement.style.cursor =
            "grab";

    }


    document.removeEventListener(
        "mousemove",
        dragVisual
    );


    document.removeEventListener(
        "mouseup",
        stopDrag
    );


    if (
        currentVisual &&
        currentVisual.id
    ) {

        await saveVisualPosition();

    }

}


// =====================================
// SAVE VISUAL POSITION
// =====================================

async function saveVisualPosition() {

    if (
        !currentVisual ||
        !currentVisual.id
    ) {

        return;

    }


    const visualId =
        currentVisual.id;


    const url =
        `${API_URL}visuals/${visualId}/`;


    const payload = {

        position_x:
            Number(
                currentVisual.position_x
            ),

        position_y:
            Number(
                currentVisual.position_y
            )

    };


    try {

        const response =
            await fetch(
                url,
                {

                    method:
                        "PATCH",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        if (!response.ok) {

            throw new Error(
                `Save failed: ${response.status}`
            );

        }


        const savedVisual =
            await response.json();


        currentVisual =
            savedVisual;


        updateVisualPanel(
            currentVisual
        );


        updateZoneState(
            currentVisual
        );


        console.log(
            "FEEMAAS Visual saved:",
            savedVisual
        );

    }

    catch (error) {

        console.error(
            "FEEMAAS Save Error:",
            error
        );

    }

}


// =====================================
// SVG COORDINATES
// =====================================

function getSVGPoint(
    svg,
    clientX,
    clientY
) {

    const rect =
        svg.getBoundingClientRect();


    const viewBox =
        svg.viewBox.baseVal;


    // ---------------------------------
    // Fallback if viewBox is missing
    // ---------------------------------

    const viewBoxWidth =
        viewBox.width ||
        SVG_WIDTH;


    const viewBoxHeight =
        viewBox.height ||
        SVG_HEIGHT;


    const scaleX =
        viewBoxWidth /
        rect.width;


    const scaleY =
        viewBoxHeight /
        rect.height;


    return {

        x:
            (clientX - rect.left) *
            scaleX,

        y:
            (clientY - rect.top) *
            scaleY

    };

}


// =====================================
// VISUAL INFORMATION PANEL
// =====================================

function updateVisualPanel(
    visual
) {

    if (!visual) {

        return;

    }


    const visualName =
        document.getElementById(
            "visualName"
        );


    const visualType =
        document.getElementById(
            "visualType"
        );


    const visualMaterial =
        document.getElementById(
            "visualMaterial"
        );


    if (visualName) {

        visualName.innerText =
            "نام: " +
            (
                visual.name ||
                "-"
            );

    }


    if (visualType) {

        visualType.innerText =
            "نوع: " +
            (
                visual.shape_type ||
                "-"
            );

    }


    const material =
        visual.visual_data &&
        visual.visual_data.material
            ? visual.visual_data.material
            : "-";


    if (visualMaterial) {

        visualMaterial.innerText =
            "متریال: " +
            material;

    }

}


// =====================================
// UTILITY
// =====================================

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}