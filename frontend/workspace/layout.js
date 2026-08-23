// ============================================================
// FEEMAAS LAYOUT ENGINE
// Version 3
//
// Visual Layout / Arrangement Engine
//
// Architecture:
//
// ProjectLayoutAdapter
//        |
//        v
//   Layout Engine
//        |
//        +---- Grid
//        +---- Compact Grid
//        +---- Shape Cluster
//        +---- Future Strategies
//        |
//        v
//   displayPosition
//
// IMPORTANT:
//
// This engine NEVER changes:
//     sourcePosition
//
// This engine ONLY changes:
//     displayPosition
//
// Therefore layout is presentation logic,
// not project persistence logic.
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

    const VERSION = "3.0.0";


    // ========================================================
    // WORKSPACE CONFIGURATION
    // ========================================================

    const WORKSPACE = {

        width: 800,

        height: 500,

        centerX: 400,

        centerY: 250

    };


    // ========================================================
    // DEFAULT CONFIGURATION
    // ========================================================

    const DEFAULT_CONFIG = {

        strategy:
            "grid",

        padding:
            24,

        gap:
            18,

        minGap:
            8,

        maxVisiblePerZone:
            96,

        itemSize:
            64,

        rowHeight:
            82,

        columnWidth:
            82,

        overflowMode:
            "stack",

        preserveSourceRotation:
            true

    };


    // ========================================================
    // SUPPORTED STRATEGIES
    // ========================================================

    const STRATEGIES = {

        GRID:
            "grid",

        COMPACT_GRID:
            "compact-grid",

        SHAPE_CLUSTER:
            "shape-cluster"

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
    // CLAMP
    // ========================================================

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


    // ========================================================
    // NORMALIZE STRATEGY
    // ========================================================

    function normalizeStrategy(
        strategy
    ) {

        const value =
            String(
                strategy ||
                DEFAULT_CONFIG.strategy
            )
            .toLowerCase()
            .trim();


        if (
            value === STRATEGIES.GRID
        ) {

            return STRATEGIES.GRID;

        }


        if (
            value ===
            STRATEGIES.COMPACT_GRID
        ) {

            return STRATEGIES.COMPACT_GRID;

        }


        if (
            value ===
            STRATEGIES.SHAPE_CLUSTER
        ) {

            return STRATEGIES.SHAPE_CLUSTER;

        }


        console.warn(
            "FEEMAAS Layout: Unsupported strategy:",
            strategy,
            "→ using grid."
        );


        return STRATEGIES.GRID;

    }


    // ========================================================
    // CREATE CONFIG
    // ========================================================

    function createConfig(
        customConfig
    ) {

        return {

            ...DEFAULT_CONFIG,

            ...(customConfig || {})

        };

    }


    // ========================================================
    // GET VISUAL SIZE
    // ========================================================

    function getVisualSize(
        visual,
        config
    ) {

        const sourceSize =
            visual &&
            visual.size;


        const size =
            numberOrDefault(
                sourceSize,
                config.itemSize
            );


        // --------------------------------------------
        // Layout display size is intentionally
        // independent from source size.
        //
        // The actual visual can remain 100,
        // while its UI representation can later
        // be scaled according to density.
        // --------------------------------------------

        return Math.max(
            24,
            Math.min(
                100,
                size
            )
        );

    }


    // ========================================================
    // GET ZONE KEY
    // ========================================================

    function getZoneKey(
        visual
    ) {

        if (
            !visual
        ) {

            return "UNASSIGNED";

        }


        return String(
            visual.zoneCode ||
            "UNASSIGNED"
        );

    }


    // ========================================================
    // GET SHAPE KEY
    // ========================================================

    function getShapeKey(
        visual
    ) {

        if (
            !visual
        ) {

            return "triangle";

        }


        return String(
            visual.shapeType ||
            "triangle"
        )
        .toLowerCase();

    }


    // ========================================================
    // CREATE POSITION
    // ========================================================

    function createPosition(
        x,
        y,
        rotation
    ) {

        return {

            x:
                Number(
                    x.toFixed(2)
                ),

            y:
                Number(
                    y.toFixed(2)
                ),

            rotation:
                Number(
                    rotation.toFixed(2)
                )

        };

    }


    // ========================================================
    // SAFE ROTATION
    // ========================================================

    function getRotation(
        visual,
        config
    ) {

        if (
            !config.preserveSourceRotation
        ) {

            return 0;

        }


        return numberOrDefault(
            visual &&
            visual.sourcePosition &&
            visual.sourcePosition.rotation,
            0
        );

    }


    // ========================================================
    // RESET VISUAL LAYOUT STATE
    // ========================================================

    function resetVisualLayout(
        visual
    ) {

        if (
            !visual
        ) {

            return;

        }


        if (
            !visual.layout
        ) {

            visual.layout = {};

        }


        if (
            !visual.displayPosition
        ) {

            visual.displayPosition = {

                x: 0,

                y: 0,

                rotation: 0

            };

        }


        const source =
            visual.sourcePosition || {

                x: 0,

                y: 0,

                rotation: 0

            };


        visual.displayPosition.x =
            numberOrDefault(
                source.x,
                0
            );


        visual.displayPosition.y =
            numberOrDefault(
                source.y,
                0
            );


        visual.displayPosition.rotation =
            numberOrDefault(
                source.rotation,
                0
            );


        visual.layout.visible =
            true;


        visual.layout.overflow =
            false;


        visual.layout.row =
            0;


        visual.layout.column =
            0;


        visual.layout.order =
            0;


        visual.layout.clusterIndex =
            0;

    }


    // ========================================================
    // RESET ALL
    // ========================================================

    function resetAll(
        visuals
    ) {

        if (
            !Array.isArray(
                visuals
            )
        ) {

            return [];

        }


        visuals.forEach(
            visual => {

                resetVisualLayout(
                    visual
                );

            }
        );


        return visuals;

    }


    // ========================================================
    // CREATE ZONE GROUPS
    // ========================================================

    function groupByZone(
        visuals
    ) {

        const groups = {};


        if (
            !Array.isArray(
                visuals
            )
        ) {

            return groups;

        }


        visuals.forEach(
            visual => {

                if (
                    !visual
                ) {

                    return;

                }


                const zone =
                    getZoneKey(
                        visual
                    );


                if (
                    !groups[zone]
                ) {

                    groups[zone] = [];

                }


                groups[zone].push(
                    visual
                );

            }
        );


        return groups;

    }


    // ========================================================
    // GROUP BY SHAPE
    // ========================================================

    function groupByShape(
        visuals
    ) {

        const groups = {};


        if (
            !Array.isArray(
                visuals
            )
        ) {

            return groups;

        }


        visuals.forEach(
            visual => {

                if (
                    !visual
                ) {

                    return;

                }


                const shape =
                    getShapeKey(
                        visual
                    );


                if (
                    !groups[shape]
                ) {

                    groups[shape] = [];

                }


                groups[shape].push(
                    visual
                );

            }
        );


        return groups;

    }


    // ========================================================
    // CALCULATE GRID COLUMNS
    // ========================================================

    function calculateColumns(
        count,
        config
    ) {

        if (
            count <= 0
        ) {

            return 1;

        }


        const availableWidth =
            WORKSPACE.width -
            (
                config.padding * 2
            );


        const columnWidth =
            config.columnWidth;


        const possibleColumns =
            Math.floor(
                (
                    availableWidth +
                    config.gap
                ) /
                (
                    columnWidth +
                    config.gap
                )
            );


        const columns =
            Math.max(
                1,
                possibleColumns
            );


        return Math.min(
            columns,
            count
        );

    }


    // ========================================================
    // GRID CELL POSITION
    // ========================================================

    function calculateGridPosition(
        index,
        columns,
        config
    ) {

        const row =
            Math.floor(
                index /
                columns
            );


        const column =
            index %
            columns;


        const totalWidth =
            (
                columns *
                config.columnWidth
            ) +
            (
                (
                    columns - 1
                ) *
                config.gap
            );


        const startX =
            (
                WORKSPACE.width -
                totalWidth
            ) /
            2;


        const x =
            startX +
            (
                column *
                (
                    config.columnWidth +
                    config.gap
                )
            ) +
            (
                config.columnWidth /
                2
            );


        const y =
            config.padding +
            (
                row *
                (
                    config.rowHeight +
                    config.gap
                )
            ) +
            (
                config.rowHeight /
                2
            );


        return {

            x:
                x -
                WORKSPACE.centerX,

            y:
                y -
                WORKSPACE.centerY,

            row:
                row,

            column:
                column

        };

    }


    // ========================================================
    // APPLY GRID
    // ========================================================

    function applyGrid(
        visuals,
        config
    ) {

        const count =
            visuals.length;


        const columns =
            calculateColumns(
                count,
                config
            );


        const maxVisible =
            Math.max(
                1,
                config.maxVisiblePerZone
            );


        visuals.forEach(
            (
                visual,
                index
            ) => {

                if (
                    index >=
                    maxVisible
                ) {

                    applyOverflow(
                        visual,
                        index,
                        config
                    );


                    return;

                }


                const position =
                    calculateGridPosition(
                        index,
                        columns,
                        config
                    );


                const rotation =
                    getRotation(
                        visual,
                        config
                    );


                visual.displayPosition =
                    createPosition(
                        position.x,
                        position.y,
                        rotation
                    );


                visual.layout.visible =
                    true;


                visual.layout.overflow =
                    false;


                visual.layout.row =
                    position.row;


                visual.layout.column =
                    position.column;


                visual.layout.order =
                    index;


                visual.layout.clusterIndex =
                    index;


                visual.layout.displaySize =
                    getVisualSize(
                        visual,
                        config
                    );

            }
        );


        return visuals;

    }


    // ========================================================
    // APPLY COMPACT GRID
    // ========================================================

    function applyCompactGrid(
        visuals,
        config
    ) {

        const compactConfig = {

            ...config,

            columnWidth:
                Math.max(
                    56,
                    config.columnWidth -
                    14
                ),

            rowHeight:
                Math.max(
                    56,
                    config.rowHeight -
                    14
                ),

            gap:
                Math.max(
                    config.minGap,
                    config.gap -
                    8
                ),

            padding:
                Math.max(
                    12,
                    config.padding -
                    8
                )

        };


        return applyGrid(
            visuals,
            compactConfig
        );

    }


    // ========================================================
    // APPLY SHAPE CLUSTER
    // ========================================================

    function applyShapeCluster(
        visuals,
        config
    ) {

        const groups =
            groupByShape(
                visuals
            );


        const shapes =
            Object.keys(
                groups
            );


        if (
            shapes.length === 0
        ) {

            return visuals;

        }


        // --------------------------------------------
        // We divide the available workspace into
        // horizontal cluster bands.
        //
        // This is intentionally a first-generation
        // cluster algorithm.
        //
        // Future versions can replace it with:
        //
        // radial
        // hexagonal
        // organic
        // semantic
        // density-aware
        // --------------------------------------------

        const bandHeight =
            (
                WORKSPACE.height -
                (
                    config.padding * 2
                )
            ) /
            shapes.length;


        let globalIndex = 0;


        shapes.forEach(
            (
                shape,
                shapeIndex
            ) => {

                const group =
                    groups[shape];


                const columns =
                    calculateColumns(
                        group.length,
                        config
                    );


                group.forEach(
                    (
                        visual,
                        localIndex
                    ) => {

                        if (
                            globalIndex >=
                            config.maxVisiblePerZone
                        ) {

                            applyOverflow(
                                visual,
                                globalIndex,
                                config
                            );


                            globalIndex += 1;


                            return;

                        }


                        const row =
                            Math.floor(
                                localIndex /
                                columns
                            );


                        const column =
                                localIndex %
                                columns;


                        const totalWidth =
                            (
                                columns *
                                config.columnWidth
                            ) +
                            (
                                (
                                    columns - 1
                                ) *
                                config.gap
                            );


                        const startX =
                            (
                                WORKSPACE.width -
                                totalWidth
                            ) /
                            2;


                        const bandStartY =
                            config.padding +
                            (
                                shapeIndex *
                                bandHeight
                            );


                        const x =
                            startX +
                            (
                                column *
                                (
                                    config.columnWidth +
                                    config.gap
                                )
                            ) +
                            (
                                config.columnWidth /
                                2
                            );


                        const y =
                            bandStartY +
                            (
                                row *
                                (
                                    config.rowHeight +
                                    config.gap
                                )
                            ) +
                            (
                                config.rowHeight /
                                2
                            );


                        const rotation =
                            getRotation(
                                visual,
                                config
                            );


                        visual.displayPosition =
                            createPosition(
                                x -
                                WORKSPACE.centerX,

                                y -
                                WORKSPACE.centerY,

                                rotation
                            );


                        visual.layout.visible =
                            true;


                        visual.layout.overflow =
                            false;


                        visual.layout.row =
                            row;


                        visual.layout.column =
                            column;


                        visual.layout.order =
                            globalIndex;


                        visual.layout.cluster =
                            "shape:" +
                            shape;


                        visual.layout.clusterIndex =
                            localIndex;


                        visual.layout.displaySize =
                            getVisualSize(
                                visual,
                                config
                            );


                        globalIndex += 1;

                    }
                );

            }
        );


        return visuals;

    }


    // ========================================================
    // APPLY OVERFLOW
    // ========================================================
    //
    // Overflow visuals are NOT deleted.
    //
    // They remain part of the layout result.
    //
    // They receive:
    //
    // visible = false
    // overflow = true
    //
    // Later the Zone Zoom UI can show them.
    //
    // This is important for 100+ visual zones.
    // ========================================================

    function applyOverflow(
        visual,
        index,
        config
    ) {

        if (
            !visual
        ) {

            return;

        }


        visual.layout.visible =
            false;


        visual.layout.overflow =
            true;


        visual.layout.order =
            index;


        visual.layout.clusterIndex =
            index;


        visual.layout.row =
            -1;


        visual.layout.column =
            -1;


        visual.layout.displaySize =
            Math.max(
                32,
                getVisualSize(
                    visual,
                    config
                ) *
                0.65
            );


        // --------------------------------------------
        // Overflow items get a deterministic
        // hidden-stack position.
        //
        // This means they still have a meaningful
        // displayPosition and can later be expanded
        // by Zone Zoom.
        // --------------------------------------------

        const stackIndex =
            index -
            config.maxVisiblePerZone;


        const stackColumns =
            8;


        const stackRow =
            Math.floor(
                stackIndex /
                stackColumns
            );


        const stackColumn =
            stackIndex %
            stackColumns;


        const x =
            (
                config.padding
            ) +
            (
                stackColumn *
                (
                    config.minGap +
                    30
                )
            );


        const y =
            WORKSPACE.height -
            config.padding -
            (
                stackRow *
                (
                    config.minGap +
                    30
                )
            );


        visual.displayPosition =
            createPosition(
                x -
                WORKSPACE.centerX,

                y -
                WORKSPACE.centerY,

                getRotation(
                    visual,
                    config
                )
            );

    }


    // ========================================================
    // APPLY STRATEGY
    // ========================================================

    function applyStrategy(
        visuals,
        strategy,
        config
    ) {

        switch (
            strategy
        ) {

            case STRATEGIES.GRID:

                return applyGrid(
                    visuals,
                    config
                );


            case STRATEGIES.COMPACT_GRID:

                return applyCompactGrid(
                    visuals,
                    config
                );


            case STRATEGIES.SHAPE_CLUSTER:

                return applyShapeCluster(
                    visuals,
                    config
                );


            default:

                return applyGrid(
                    visuals,
                    config
                );

        }

    }


    // ========================================================
    // LAYOUT VISUALS
    // ========================================================

    function layoutVisuals(
        visuals,
        customConfig
    ) {

        if (
            !Array.isArray(
                visuals
            )
        ) {

            console.warn(
                "FEEMAAS Layout: visuals is not an array."
            );


            return {

                version:
                    VERSION,

                strategy:
                    null,

                visuals: [],

                statistics:
                    createEmptyStatistics()

            };

        }


        const config =
            createConfig(
                customConfig
            );


        const strategy =
            normalizeStrategy(
                config.strategy
            );


        // --------------------------------------------
        // Do not mutate the source visual array
        // structure itself, but visual objects are
        // intentionally updated with display data.
        //
        // Source coordinates remain untouched.
        // --------------------------------------------

        resetAll(
            visuals
        );


        const result =
            applyStrategy(
                visuals,
                strategy,
                config
            );


        const statistics =
            createStatistics(
                result,
                strategy,
                config
            );


        return {

            version:
                VERSION,

            strategy:
                strategy,

            config:
                config,

            visuals:
                result,

            statistics:
                statistics

        };

    }


    // ========================================================
    // EMPTY STATISTICS
    // ========================================================

    function createEmptyStatistics() {

        return {

            total:
                0,

            visible:
                0,

            overflow:
                0,

            clusters:
                0,

            shapes: {},

            zones: {},

            rows:
                0,

            columns:
                0

        };

    }


    // ========================================================
    // CREATE STATISTICS
    // ========================================================

    function createStatistics(
        visuals,
        strategy,
        config
    ) {

        const statistics =
            createEmptyStatistics();


        statistics.total =
            visuals.length;


        statistics.strategy =
            strategy;


        const clusters =
            new Set();


        let maxRow =
            0;


        let maxColumn =
            0;


        visuals.forEach(
            visual => {

                if (
                    !visual
                ) {

                    return;

                }


                if (
                    visual.layout.visible
                ) {

                    statistics.visible +=
                        1;

                }


                if (
                    visual.layout.overflow
                ) {

                    statistics.overflow +=
                        1;

                }


                const shape =
                    getShapeKey(
                        visual
                    );


                const zone =
                    getZoneKey(
                        visual
                    );


                statistics.shapes[shape] =
                    (
                        statistics.shapes[shape] ||
                        0
                    ) + 1;


                statistics.zones[zone] =
                    (
                        statistics.zones[zone] ||
                        0
                    ) + 1;


                if (
                    visual.layout.cluster
                ) {

                    clusters.add(
                        visual.layout.cluster
                    );

                }


                if (
                    visual.layout.row >= 0
                ) {

                    maxRow =
                        Math.max(
                            maxRow,
                            visual.layout.row
                        );

                }


                if (
                    visual.layout.column >= 0
                ) {

                    maxColumn =
                        Math.max(
                            maxColumn,
                            visual.layout.column
                        );

                }

            }
        );


        statistics.clusters =
            clusters.size;


        statistics.rows =
            maxRow + 1;


        statistics.columns =
            maxColumn + 1;


        statistics.maxVisiblePerZone =
            config.maxVisiblePerZone;


        return statistics;

    }


    // ========================================================
    // LAYOUT BY ZONE
    // ========================================================
    //
    // This is important for future Consultant
    // and Customer workspaces.
    //
    // Each zone can independently receive
    // its own visual collection.
    // ========================================================

    function layoutByZone(
        visuals,
        customConfig
    ) {

        if (
            !Array.isArray(
                visuals
            )
        ) {

            return {

                zones: {},

                statistics:
                    createEmptyStatistics()

            };

        }


        const config =
            createConfig(
                customConfig
            );


        const zoneGroups =
            groupByZone(
                visuals
            );


        const zones = {};


        Object.keys(
            zoneGroups
        ).forEach(
            zoneKey => {

                const zoneVisuals =
                    zoneGroups[
                        zoneKey
                    ];


                const result =
                    layoutVisuals(
                        zoneVisuals,
                        config
                    );


                zones[zoneKey] =
                    result;

            }
        );


        const allVisuals =
            Object.values(
                zones
            )
            .flatMap(
                result =>
                    result.visuals
            );


        return {

            version:
                VERSION,

            strategy:
                normalizeStrategy(
                    config.strategy
                ),

            zones:
                zones,

            visuals:
                allVisuals,

            statistics:
                createStatistics(
                    allVisuals,
                    normalizeStrategy(
                        config.strategy
                    ),
                    config
                )

        };

    }


    // ========================================================
    // LAYOUT ADAPTED PROJECTS
    // ========================================================
    //
    // Convenience method.
    //
    // This does NOT know how the adapter works.
    //
    // It only expects:
    //
    // adaptedProjects
    //
    // with:
    //
    // project.zones[].visuals[]
    // ========================================================

    function layoutProjects(
        adaptedProjects,
        customConfig
    ) {

        if (
            !Array.isArray(
                adaptedProjects
            )
        ) {

            return {

                version:
                    VERSION,

                projects: [],

                visuals: [],

                statistics:
                    createEmptyStatistics()

            };

        }


        const allVisuals = [];


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

                                    allVisuals.push(
                                        visual
                                    );

                                }

                            }
                        );

                    }
                );

            }
        );


        const result =
            layoutVisuals(
                allVisuals,
                customConfig
            );


        return {

            version:
                VERSION,

            projects:
                adaptedProjects,

            visuals:
                result.visuals,

            strategy:
                result.strategy,

            config:
                result.config,

            statistics:
                result.statistics

        };

    }


    // ========================================================
    // TEST DATA GENERATOR
    // ========================================================
    //
    // This generates artificial Visuals only.
    //
    // It does NOT create API projects.
    // ========================================================

    function createTestVisual(
        id,
        shape,
        zone,
        index
    ) {

        return {

            visualId:
                id,

            projectId:
                "TEST-" +
                id,

            projectTitle:
                "Layout Test " +
                id,

            zoneCode:
                zone,

            shapeType:
                shape,

            color:
                "#8B4513",

            size:
                80,

            status:
                "waiting",

            sourcePosition: {

                x:
                    0,

                y:
                    0,

                rotation:
                    0

            },

            displayPosition: {

                x:
                    0,

                y:
                    0,

                rotation:
                    0

            },

            layout: {

                cluster:
                    zone +
                    ":" +
                    shape,

                clusterIndex:
                    index,

                overflow:
                    false,

                visible:
                    true,

                row:
                    0,

                column:
                    0,

                order:
                    index

            }

        };

    }


    // ========================================================
    // CREATE TEST DATASET
    // ========================================================

    function createTestDataset() {

        const visuals = [];


        let id =
            1;


        // --------------------------------------------
        // Zone A
        // --------------------------------------------

        for (
            let i = 0;
            i < 40;
            i++
        ) {

            visuals.push(
                createTestVisual(
                    id++,
                    "triangle",
                    "A",
                    i
                )
            );

        }


        // --------------------------------------------
        // Zone B
        // --------------------------------------------

        for (
            let i = 0;
            i < 30;
            i++
        ) {

            visuals.push(
                createTestVisual(
                    id++,
                    "square",
                    "B",
                    i
                )
            );

        }


        // --------------------------------------------
        // Zone C
        // --------------------------------------------

        for (
            let i = 0;
            i < 25;
            i++
        ) {

            visuals.push(
                createTestVisual(
                    id++,
                    "hexagon",
                    "C",
                    i
                )
            );

        }


        // --------------------------------------------
        // Zone D
        // --------------------------------------------

        for (
            let i = 0;
            i < 31;
            i++
        ) {

            visuals.push(
                createTestVisual(
                    id++,
                    "triangle",
                    "D",
                    i
                )
            );

        }


        return visuals;

    }


    // ========================================================
    // TEST
    // ========================================================

    function test(
        customConfig
    ) {

        const testVisuals =
            createTestDataset();


        const result =
            layoutVisuals(
                testVisuals,
                customConfig
            );


        console.log(
            "FEEMAAS Layout V3 Test Result:",
            result
        );


        console.log(
            "FEEMAAS Layout V3 Statistics:",
            result.statistics
        );


        return result;

    }


    // ========================================================
    // TEST REAL ADAPTED DATA
    // ========================================================
    //
    // This function accepts currentProjects directly
    // only as a convenience test.
    //
    // It dynamically checks whether the Adapter exists.
    //
    // Layout itself remains independent from Adapter.
    // ========================================================

    function testCurrentProjects(
        projects,
        customConfig
    ) {

        if (
            !window.FEEMAAS.ProjectLayoutAdapter
        ) {

            console.error(
                "FEEMAAS Layout: ProjectLayoutAdapter is not available."
            );


            return null;

        }


        const adapted =
            window.FEEMAAS
                .ProjectLayoutAdapter
                .adaptProjects(
                    projects
                );


        const visuals =
            window.FEEMAAS
                .ProjectLayoutAdapter
                .flattenVisuals(
                    adapted
                );


        const result =
            layoutVisuals(
                visuals,
                customConfig
            );


        console.log(
            "FEEMAAS Layout V3 Real Project Test:",
            result
        );


        return result;

    }


    // ========================================================
    // GET STRATEGIES
    // ========================================================

    function getStrategies() {

        return {

            grid:
                STRATEGIES.GRID,

            compactGrid:
                STRATEGIES.COMPACT_GRID,

            shapeCluster:
                STRATEGIES.SHAPE_CLUSTER

        };

    }


    // ========================================================
    // PUBLIC API
    // ========================================================

    window.FEEMAAS.Layout = {

        version:
            VERSION,


        workspace:
            WORKSPACE,


        defaults:
            DEFAULT_CONFIG,


        strategies:
            STRATEGIES,


        getStrategies:
            getStrategies,


        layoutVisuals:
            layoutVisuals,


        layoutByZone:
            layoutByZone,


        layoutProjects:
            layoutProjects,


        resetAll:
            resetAll,


        groupByZone:
            groupByZone,


        groupByShape:
            groupByShape,


        createTestDataset:
            createTestDataset,


        test:
            test,


        testCurrentProjects:
            testCurrentProjects

    };


    // ========================================================
    // LOADED MESSAGE
    // ========================================================

    console.log(
        "FEEMAAS.Layout Engine Version 3 loaded."
    );

})();