// ============================================================
// FEEMAAS PROJECT LAYOUT ADAPTER
// Version 2
//
// Purpose:
// Convert FEEMAAS project/API data into a stable,
// layout-ready visual data structure.
//
// Architecture:
//
// API
//   ↓
// currentProjects
//   ↓
// ProjectLayoutAdapter
//   ↓
// Layout Engine
//   ↓
// Workspace Renderer
//
// IMPORTANT:
//
// This adapter NEVER changes the original project coordinates.
//
// sourcePosition:
//     Real/project/database position
//
// displayPosition:
//     Temporary UI/layout position
//
// Therefore layout algorithms can change freely without
// corrupting the project's persisted coordinates.
// ============================================================

(function () {

    "use strict";


    // ========================================================
    // GLOBAL NAMESPACE
    // ========================================================

    window.FEEMAAS =
        window.FEEMAAS || {};


    // ========================================================
    // VERSION
    // ========================================================

    const VERSION = "2.0.0";


    // ========================================================
    // CONFIGURATION
    // ========================================================

    const CONFIG = {

        // --------------------------------------------
        // Default visual values
        // --------------------------------------------

        defaultShape:
            "triangle",

        defaultColor:
            "#8B4513",

        defaultSize:
            100,

        defaultStatus:
            "waiting",


        // --------------------------------------------
        // Layout metadata
        // --------------------------------------------

        defaultCluster:
            "default",

        defaultOverflow:
            false,


        // --------------------------------------------
        // Workspace boundaries
        // --------------------------------------------

        workspace: {

            width:
                800,

            height:
                500,

            centerX:
                400,

            centerY:
                250

        },


        // --------------------------------------------
        // Safety limits
        // --------------------------------------------

        maxProjects:
            10000,

        maxVisuals:
            50000

    };


    // ========================================================
    // UTILITY
    // ========================================================

    function numberOrDefault(
        value,
        fallback
    ) {

        const number =
            Number(value);


        if (
            Number.isFinite(number)
        ) {

            return number;

        }


        return fallback;

    }


    // ========================================================
    // SAFE STRING
    // ========================================================

    function stringOrDefault(
        value,
        fallback
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return fallback;

        }


        const string =
            String(value).trim();


        if (!string) {

            return fallback;

        }


        return string;

    }


    // ========================================================
    // NORMALIZE SHAPE
    // ========================================================

    function normalizeShape(
        shape
    ) {

        const value =
            stringOrDefault(
                shape,
                CONFIG.defaultShape
            ).toLowerCase();


        // --------------------------------------------
        // Supported shapes
        // --------------------------------------------

        const supported = [

            "triangle",
            "square",
            "pentagon",
            "hexagon",
            "heptagon",
            "octagon",
            "circle"

        ];


        if (
            supported.includes(value)
        ) {

            return value;

        }


        return CONFIG.defaultShape;

    }


    // ========================================================
    // NORMALIZE COLOR
    // ========================================================

    function normalizeColor(
        color
    ) {

        return stringOrDefault(
            color,
            CONFIG.defaultColor
        );

    }


    // ========================================================
    // NORMALIZE STATUS
    // ========================================================

    function normalizeStatus(
        status
    ) {

        return stringOrDefault(
            status,
            CONFIG.defaultStatus
        );

    }


    // ========================================================
    // GET PROJECT ID
    // ========================================================

    function getProjectId(
        project
    ) {

        if (!project) {

            return null;

        }


        return (
            project.id !== undefined &&
            project.id !== null
        )

            ? project.id

            : null;

    }


    // ========================================================
    // GET ZONE ID
    // ========================================================

    function getZoneId(
        zone
    ) {

        if (!zone) {

            return null;

        }


        return (
            zone.id !== undefined &&
            zone.id !== null
        )

            ? zone.id

            : null;

    }


    // ========================================================
    // GET VISUAL ID
    // ========================================================

    function getVisualId(
        visual
    ) {

        if (!visual) {

            return null;

        }


        return (
            visual.id !== undefined &&
            visual.id !== null
        )

            ? visual.id

            : null;

    }


    // ========================================================
    // CREATE SOURCE POSITION
    //
    // IMPORTANT:
    // This represents the original project position.
    // Never modify this object during layout.
    // ========================================================

    function createSourcePosition(
        visual
    ) {

        return {

            x:
                numberOrDefault(
                    visual &&
                    visual.position_x,
                    0
                ),

            y:
                numberOrDefault(
                    visual &&
                    visual.position_y,
                    0
                ),

            rotation:
                numberOrDefault(
                    visual &&
                    visual.rotation,
                    0
                )

        };

    }


    // ========================================================
    // CREATE DISPLAY POSITION
    //
    // This is intentionally separate from sourcePosition.
    // Layout Engine can modify this freely.
    // ========================================================

    function createDisplayPosition(
        sourcePosition
    ) {

        return {

            x:
                sourcePosition.x,

            y:
                sourcePosition.y,

            rotation:
                sourcePosition.rotation

        };

    }


    // ========================================================
    // CREATE VISUAL METADATA
    // ========================================================

    function createVisualMetadata(
        visual
    ) {

        const visualData =
            (
                visual &&
                typeof visual.visual_data === "object" &&
                visual.visual_data !== null
            )

                ? visual.visual_data

                : {};


        return {

            capacitySlot:
                visualData.capacity_slot !== undefined
                    ? visualData.capacity_slot
                    : null,

            engineVersion:
                visualData.engine_version || null,

            material:
                visualData.material || null,

            raw:
                {
                    ...visualData
                }

        };

    }


    // ========================================================
    // CREATE CLUSTER KEY
    //
    // At this stage the cluster is deterministic.
    //
    // Later we can replace this strategy with:
    //
    // shape
    // status
    // project
    // customer
    // priority
    // consultant
    // etc.
    // ========================================================

    function createClusterKey(
        project,
        zone,
        visual
    ) {

        const zoneCode =
            stringOrDefault(
                zone && zone.code,
                "UNASSIGNED"
            );


        const shape =
            normalizeShape(
                visual &&
                visual.shape_type
            );


        return (
            zoneCode +
            ":" +
            shape
        );

    }


    // ========================================================
    // CREATE ADAPTED VISUAL
    // ========================================================

    function adaptVisual(
        project,
        zone,
        visual,
        visualIndex
    ) {

        if (!visual) {

            return null;

        }


        const projectId =
            getProjectId(
                project
            );


        const zoneId =
            getZoneId(
                zone
            );


        const visualId =
            getVisualId(
                visual
            );


        const sourcePosition =
            createSourcePosition(
                visual
            );


        const displayPosition =
            createDisplayPosition(
                sourcePosition
            );


        const shapeType =
            normalizeShape(
                visual.shape_type
            );


        const color =
            normalizeColor(
                visual.color
            );


        const size =
            numberOrDefault(
                visual.size,
                CONFIG.defaultSize
            );


        const status =
            normalizeStatus(
                visual.status
            );


        const cluster =
            createClusterKey(
                project,
                zone,
                visual
            );


        return {

            // ----------------------------------------
            // Identity
            // ----------------------------------------

            id:
                visualId,

            visualId:
                visualId,

            projectId:
                projectId,

            projectTitle:
                stringOrDefault(
                    project &&
                    project.title,
                    "Untitled Project"
                ),

            zoneId:
                zoneId,

            zoneCode:
                stringOrDefault(
                    zone &&
                    zone.code,
                    "UNASSIGNED"
                ),


            // ----------------------------------------
            // Visual definition
            // ----------------------------------------

            name:
                stringOrDefault(
                    visual.name,
                    "Visual"
                ),

            shapeType:
                shapeType,

            color:
                color,

            size:
                size,

            rotation:
                sourcePosition.rotation,

            status:
                status,


            // ----------------------------------------
            // Coordinates
            // ----------------------------------------

            sourcePosition:
                sourcePosition,

            displayPosition:
                displayPosition,


            // ----------------------------------------
            // Layout metadata
            // ----------------------------------------

            layout: {

                cluster:
                    cluster,

                clusterIndex:
                    visualIndex,

                overflow:
                    CONFIG.defaultOverflow,

                visible:
                    true,

                row:
                    0,

                column:
                    0,

                order:
                    visualIndex,

                displaySize:
                    size

            },


            // ----------------------------------------
            // Extra visual data
            // ----------------------------------------

            metadata:
                createVisualMetadata(
                    visual
                ),


            // ----------------------------------------
            // Original references
            //
            // These are references only.
            // We do NOT mutate them.
            // ----------------------------------------

            source: {

                project:
                    project,

                zone:
                    zone,

                visual:
                    visual

            }

        };

    }


    // ========================================================
    // ADAPT PROJECT
    // ========================================================

    function adaptProject(
        project,
        projectIndex
    ) {

        if (!project) {

            return null;

        }


        const zones =
            Array.isArray(
                project.zones
            )

                ? project.zones

                : [];


        const adaptedZones = [];


        zones.forEach(
            (
                zone,
                zoneIndex
            ) => {

                if (!zone) {

                    return;

                }


                const visuals =
                    Array.isArray(
                        zone.visuals
                    )

                        ? zone.visuals

                        : [];


                const adaptedVisuals = [];


                visuals.forEach(
                    (
                        visual,
                        visualIndex
                    ) => {

                        const adaptedVisual =
                            adaptVisual(
                                project,
                                zone,
                                visual,
                                visualIndex
                            );


                        if (
                            adaptedVisual
                        ) {

                            adaptedVisuals.push(
                                adaptedVisual
                            );

                        }

                    }
                );


                adaptedZones.push({

                    id:
                        getZoneId(
                            zone
                        ),

                    code:
                        stringOrDefault(
                            zone.code,
                            "UNASSIGNED"
                        ),

                    name:
                        stringOrDefault(
                            zone.name,
                            "Zone"
                        ),

                    description:
                        stringOrDefault(
                            zone.description,
                            ""
                        ),

                    index:
                        zoneIndex,

                    visuals:
                        adaptedVisuals

                });

            }
        );


        return {

            // ----------------------------------------
            // Project identity
            // ----------------------------------------

            id:
                getProjectId(
                    project
                ),

            title:
                stringOrDefault(
                    project.title,
                    "Untitled Project"
                ),

            description:
                stringOrDefault(
                    project.description,
                    ""
                ),

            status:
                normalizeStatus(
                    project.status
                ),


            // ----------------------------------------
            // Project index
            // ----------------------------------------

            index:
                projectIndex,


            // ----------------------------------------
            // Project zones
            // ----------------------------------------

            zones:
                adaptedZones,


            // ----------------------------------------
            // Original project
            // ----------------------------------------

            source:
                project

        };

    }


    // ========================================================
    // ADAPT PROJECTS
    // ========================================================

    function adaptProjects(
        projects
    ) {

        if (
            !Array.isArray(projects)
        ) {

            console.warn(
                "FEEMAAS ProjectLayoutAdapter: projects is not an array."
            );


            return [];

        }


        if (
            projects.length >
            CONFIG.maxProjects
        ) {

            console.warn(
                "FEEMAAS ProjectLayoutAdapter: project limit exceeded."
            );

        }


        const limitedProjects =
            projects.slice(
                0,
                CONFIG.maxProjects
            );


        const adaptedProjects = [];


        limitedProjects.forEach(
            (
                project,
                projectIndex
            ) => {

                const adapted =
                    adaptProject(
                        project,
                        projectIndex
                    );


                if (
                    adapted
                ) {

                    adaptedProjects.push(
                        adapted
                    );

                }

            }
        );


        return adaptedProjects;

    }


    // ========================================================
    // FLATTEN VISUALS
    //
    // Useful for Layout Engine.
    // ========================================================

    function flattenVisuals(
        adaptedProjects
    ) {

        if (
            !Array.isArray(
                adaptedProjects
            )
        ) {

            return [];

        }


        const result = [];


        adaptedProjects.forEach(
            project => {

                if (
                    !project ||
                    !Array.isArray(
                        project.zones
                    )
                ) {

                    return;

                }


                project.zones.forEach(
                    zone => {

                        if (
                            !zone ||
                            !Array.isArray(
                                zone.visuals
                            )
                        ) {

                            return;

                        }


                        zone.visuals.forEach(
                            visual => {

                                if (
                                    visual
                                ) {

                                    result.push(
                                        visual
                                    );

                                }

                            }
                        );

                    }
                );

            }
        );


        return result.slice(
            0,
            CONFIG.maxVisuals
        );

    }


    // ========================================================
    // GET STATISTICS
    // ========================================================

    function getStatistics(
        adaptedProjects
    ) {

        const visuals =
            flattenVisuals(
                adaptedProjects
            );


        const shapes = {};


        const zones = {};


        const statuses = {};


        visuals.forEach(
            visual => {

                const shape =
                    visual.shapeType;


                const zone =
                    visual.zoneCode;


                const status =
                    visual.status;


                shapes[shape] =
                    (
                        shapes[shape] ||
                        0
                    ) + 1;


                zones[zone] =
                    (
                        zones[zone] ||
                        0
                    ) + 1;


                statuses[status] =
                    (
                        statuses[status] ||
                        0
                    ) + 1;

            }
        );


        return {

            projects:
                Array.isArray(
                    adaptedProjects
                )
                    ? adaptedProjects.length
                    : 0,

            visuals:
                visuals.length,

            shapes:
                shapes,

            zones:
                zones,

            statuses:
                statuses

        };

    }


    // ========================================================
    // FIND VISUAL
    // ========================================================

    function findVisual(
        adaptedProjects,
        visualId
    ) {

        const visuals =
            flattenVisuals(
                adaptedProjects
            );


        for (
            let i = 0;
            i < visuals.length;
            i++
        ) {

            if (
                String(
                    visuals[i].visualId
                ) ===
                String(
                    visualId
                )
            ) {

                return visuals[i];

            }

        }


        return null;

    }


    // ========================================================
    // FIND PROJECT
    // ========================================================

    function findProject(
        adaptedProjects,
        projectId
    ) {

        if (
            !Array.isArray(
                adaptedProjects
            )
        ) {

            return null;

        }


        for (
            let i = 0;
            i < adaptedProjects.length;
            i++
        ) {

            if (
                String(
                    adaptedProjects[i].id
                ) ===
                String(
                    projectId
                )
            ) {

                return adaptedProjects[i];

            }

        }


        return null;

    }


    // ========================================================
    // RESET DISPLAY POSITIONS
    //
    // Useful when switching Layout Strategies.
    //
    // It restores the temporary UI position to
    // the original project position.
    //
    // IMPORTANT:
    // sourcePosition is never changed.
    // ========================================================

    function resetDisplayPositions(
        adaptedProjects
    ) {

        const visuals =
            flattenVisuals(
                adaptedProjects
            );


        visuals.forEach(
            visual => {

                visual.displayPosition.x =
                    visual.sourcePosition.x;


                visual.displayPosition.y =
                    visual.sourcePosition.y;


                visual.displayPosition.rotation =
                    visual.sourcePosition.rotation;


                visual.layout.overflow =
                    false;


                visual.layout.visible =
                    true;


                visual.layout.row =
                    0;


                visual.layout.column =
                    0;

            }
        );


        return adaptedProjects;

    }


    // ========================================================
    // CLONE FOR LAYOUT
    //
    // Creates a layout-safe copy.
    //
    // This is especially important when an external
    // Layout Engine wants to mutate positions.
    // ========================================================

    function cloneForLayout(
        adaptedProjects
    ) {

        if (
            !Array.isArray(
                adaptedProjects
            )
        ) {

            return [];

        }


        return JSON.parse(
            JSON.stringify(
                adaptedProjects
            )
        );

    }


    // ========================================================
    // TEST
    // ========================================================

    function test(
        projects
    ) {

        const source =
            Array.isArray(projects)
                ? projects
                : [];


        const adapted =
            adaptProjects(
                source
            );


        const visuals =
            flattenVisuals(
                adapted
            );


        const statistics =
            getStatistics(
                adapted
            );


        const result = {

            version:
                VERSION,

            inputProjects:
                source.length,

            adaptedProjects:
                adapted.length,

            inputVisuals:
                countInputVisuals(
                    source
                ),

            adaptedVisuals:
                visuals.length,

            statistics:
                statistics,

            sample:
                visuals.length
                    ? {

                        id:
                            visuals[0].visualId,

                        projectId:
                            visuals[0].projectId,

                        projectTitle:
                            visuals[0].projectTitle,

                        shape:
                            visuals[0].shapeType,

                        sourcePosition:
                            {
                                ...visuals[0].sourcePosition
                            },

                        displayPosition:
                            {
                                ...visuals[0].displayPosition
                            },

                        cluster:
                            visuals[0].layout.cluster,

                        overflow:
                            visuals[0].layout.overflow

                    }
                    : null

        };


        console.log(
            "FEEMAAS Project Layout Adapter V2 Test:",
            result
        );


        return result;

    }


    // ========================================================
    // COUNT INPUT VISUALS
    // ========================================================

    function countInputVisuals(
        projects
    ) {

        if (
            !Array.isArray(
                projects
            )
        ) {

            return 0;

        }


        let count = 0;


        projects.forEach(
            project => {

                if (
                    !project ||
                    !Array.isArray(
                        project.zones
                    )
                ) {

                    return;

                }


                project.zones.forEach(
                    zone => {

                        if (
                            zone &&
                            Array.isArray(
                                zone.visuals
                            )
                        ) {

                            count +=
                                zone.visuals.length;

                        }

                    }
                );

            }
        );


        return count;

    }


    // ========================================================
    // PUBLIC API
    // ========================================================

    window.FEEMAAS.ProjectLayoutAdapter = {

        version:
            VERSION,


        config:
            CONFIG,


        adaptProject:
            adaptProject,


        adaptProjects:
            adaptProjects,


        adaptVisual:
            adaptVisual,


        flattenVisuals:
            flattenVisuals,


        getStatistics:
            getStatistics,


        findVisual:
            findVisual,


        findProject:
            findProject,


        resetDisplayPositions:
            resetDisplayPositions,


        cloneForLayout:
            cloneForLayout,


        countInputVisuals:
            countInputVisuals,


        test:
            test

    };


    // ========================================================
    // LOADED MESSAGE
    // ========================================================

    console.log(
        "FEEMAAS Project Layout Adapter Version 2 loaded."
    );

})();