// ============================================================
// FEEMAAS VISUAL ENGINE
// Geometry Core
// Version 1
//
// Responsibility:
// - Coordinate conversion
// - Polygon geometry
// - Workspace boundaries
// - Point / rectangle calculations
// - Grid calculations
//
// IMPORTANT:
// This file has NO dependency on:
// - DOM
// - SVG
// - Django
// - API
// - Customer Workspace
// - Consultant Workspace
//
// It is a pure geometry utility layer.
// ============================================================

(function (global) {

    "use strict";


    // ========================================================
    // CONSTANTS
    // ========================================================

    const Geometry = {


        // ----------------------------------------------------
        // Clamp
        // ----------------------------------------------------

        clamp: function (value, min, max) {

            return Math.max(
                min,
                Math.min(
                    max,
                    value
                )
            );

        },


        // ----------------------------------------------------
        // Degrees → Radians
        // ----------------------------------------------------

        degreesToRadians: function (degrees) {

            return (
                Number(degrees) *
                Math.PI /
                180
            );

        },


        // ----------------------------------------------------
        // Radians → Degrees
        // ----------------------------------------------------

        radiansToDegrees: function (radians) {

            return (
                Number(radians) *
                180 /
                Math.PI
            );

        },


        // ----------------------------------------------------
        // Distance between two points
        // ----------------------------------------------------

        distance: function (
            x1,
            y1,
            x2,
            y2
        ) {

            const dx =
                Number(x2) -
                Number(x1);

            const dy =
                Number(y2) -
                Number(y1);

            return Math.sqrt(
                dx * dx +
                dy * dy
            );

        },


        // ----------------------------------------------------
        // Point inside rectangle
        // ----------------------------------------------------

        pointInRect: function (
            x,
            y,
            rect
        ) {

            if (!rect) {

                return false;

            }


            return (
                x >= rect.x &&
                x <= rect.x + rect.width &&
                y >= rect.y &&
                y <= rect.y + rect.height
            );

        },


        // ----------------------------------------------------
        // Point inside circle
        // ----------------------------------------------------

        pointInCircle: function (
            x,
            y,
            circle
        ) {

            if (!circle) {

                return false;

            }


            return (
                this.distance(
                    x,
                    y,
                    circle.x,
                    circle.y
                ) <=
                Number(circle.radius)
            );

        },


        // ----------------------------------------------------
        // Rectangle center
        // ----------------------------------------------------

        rectCenter: function (rect) {

            if (!rect) {

                return {
                    x: 0,
                    y: 0
                };

            }


            return {

                x:
                    Number(rect.x) +
                    Number(rect.width) / 2,

                y:
                    Number(rect.y) +
                    Number(rect.height) / 2

            };

        },


        // ----------------------------------------------------
        // Generate regular polygon points
        //
        // Returns:
        //
        // [
        //   {x, y},
        //   {x, y},
        //   ...
        // ]
        // ----------------------------------------------------

        polygonPoints: function (
            centerX,
            centerY,
            radius,
            sides,
            angleOffset
        ) {

            const cx =
                Number(centerX) || 0;

            const cy =
                Number(centerY) || 0;

            const r =
                Math.max(
                    0,
                    Number(radius) || 0
                );

            const count =
                Math.max(
                    3,
                    Math.floor(
                        Number(sides) || 3
                    )
                );

            const offset =
                Number(angleOffset) || 0;


            const points = [];


            for (
                let i = 0;
                i < count;
                i++
            ) {

                const angle =
                    this.degreesToRadians(
                        offset +
                        (
                            360 / count
                        ) * i
                    );


                points.push({

                    x:
                        cx +
                        r *
                        Math.cos(angle),

                    y:
                        cy +
                        r *
                        Math.sin(angle)

                });

            }


            return points;

        },


        // ----------------------------------------------------
        // Polygon points → SVG string
        // ----------------------------------------------------

        polygonPointsToString: function (
            points
        ) {

            if (
                !Array.isArray(points)
            ) {

                return "";

            }


            return points
                .map(
                    point =>
                        `${point.x},${point.y}`
                )
                .join(" ");

        },


        // ----------------------------------------------------
        // Create centered grid position
        //
        // This is the first basic layout primitive.
        //
        // Important:
        // This does NOT know anything about projects.
        //
        // It simply answers:
        //
        // "Where is cell row/column?"
        // ----------------------------------------------------

        gridCellCenter: function (
            container,
            row,
            column,
            columns,
            cellWidth,
            cellHeight,
            gapX,
            gapY
        ) {

            if (!container) {

                return {
                    x: 0,
                    y: 0
                };

            }


            const safeColumns =
                Math.max(
                    1,
                    Number(columns) || 1
                );


            const safeCellWidth =
                Number(cellWidth) || 0;

            const safeCellHeight =
                Number(cellHeight) || 0;

            const safeGapX =
                Number(gapX) || 0;

            const safeGapY =
                Number(gapY) || 0;


            const x =
                Number(container.x) +
                (
                    Number(column) *
                    (
                        safeCellWidth +
                        safeGapX
                    )
                ) +
                safeCellWidth / 2;


            const y =
                Number(container.y) +
                (
                    Number(row) *
                    (
                        safeCellHeight +
                        safeGapY
                    )
                ) +
                safeCellHeight / 2;


            return {
                x: x,
                y: y
            };

        },


        // ----------------------------------------------------
        // Calculate number of columns that fit
        // ----------------------------------------------------

        fitColumns: function (
            width,
            itemWidth,
            gap
        ) {

            const safeWidth =
                Math.max(
                    0,
                    Number(width) || 0
                );

            const safeItemWidth =
                Math.max(
                    1,
                    Number(itemWidth) || 1
                );

            const safeGap =
                Math.max(
                    0,
                    Number(gap) || 0
                );


            return Math.max(
                1,
                Math.floor(
                    (
                        safeWidth +
                        safeGap
                    ) /
                    (
                        safeItemWidth +
                        safeGap
                    )
                )
            );

        },


        // ----------------------------------------------------
        // Calculate number of rows that fit
        // ----------------------------------------------------

        fitRows: function (
            height,
            itemHeight,
            gap
        ) {

            const safeHeight =
                Math.max(
                    0,
                    Number(height) || 0
                );

            const safeItemHeight =
                Math.max(
                    1,
                    Number(itemHeight) || 1
                );

            const safeGap =
                Math.max(
                    0,
                    Number(gap) || 0
                );


            return Math.max(
                1,
                Math.floor(
                    (
                        safeHeight +
                        safeGap
                    ) /
                    (
                        safeItemHeight +
                        safeGap
                    )
                )
            );

        },


        // ----------------------------------------------------
        // Bounding box for polygon points
        // ----------------------------------------------------

        polygonBounds: function (
            points
        ) {

            if (
                !Array.isArray(points) ||
                points.length === 0
            ) {

                return {

                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0

                };

            }


            let minX =
                Number.POSITIVE_INFINITY;

            let minY =
                Number.POSITIVE_INFINITY;

            let maxX =
                Number.NEGATIVE_INFINITY;

            let maxY =
                Number.NEGATIVE_INFINITY;


            points.forEach(
                point => {

                    const x =
                        Number(point.x) || 0;

                    const y =
                        Number(point.y) || 0;


                    minX =
                        Math.min(
                            minX,
                            x
                        );

                    minY =
                        Math.min(
                            minY,
                            y
                        );

                    maxX =
                        Math.max(
                            maxX,
                            x
                        );

                    maxY =
                        Math.max(
                            maxY,
                            y
                        );

                }
            );


            return {

                x: minX,

                y: minY,

                width:
                    maxX - minX,

                height:
                    maxY - minY

            };

        },


        // ----------------------------------------------------
        // Keep point inside rectangle
        // ----------------------------------------------------

        clampPointToRect: function (
            x,
            y,
            rect,
            padding
        ) {

            if (!rect) {

                return {

                    x: Number(x) || 0,

                    y: Number(y) || 0

                };

            }


            const safePadding =
                Math.max(
                    0,
                    Number(padding) || 0
                );


            return {

                x:
                    this.clamp(
                        Number(x) || 0,

                        Number(rect.x) +
                        safePadding,

                        Number(rect.x) +
                        Number(rect.width) -
                        safePadding
                    ),

                y:
                    this.clamp(
                        Number(y) || 0,

                        Number(rect.y) +
                        safePadding,

                        Number(rect.y) +
                        Number(rect.height) -
                        safePadding
                    )

            };

        },


        // ----------------------------------------------------
        // Generate deterministic position
        //
        // Used later by Layout Engine.
        //
        // The same index + same configuration
        // always produces the same position.
        // ----------------------------------------------------

        indexedGridPosition: function (
            container,
            index,
            columns,
            cellWidth,
            cellHeight,
            gapX,
            gapY
        ) {

            const safeIndex =
                Math.max(
                    0,
                    Math.floor(
                        Number(index) || 0
                    )
                );


            const safeColumns =
                Math.max(
                    1,
                    Math.floor(
                        Number(columns) || 1
                    )
                );


            const row =
                Math.floor(
                    safeIndex /
                    safeColumns
                );


            const column =
                safeIndex %
                safeColumns;


            return this.gridCellCenter(

                container,

                row,

                column,

                safeColumns,

                cellWidth,

                cellHeight,

                gapX,

                gapY

            );

        }

    };


    // ========================================================
    // PUBLIC API
    // ========================================================

    global.FEEMAAS =
        global.FEEMAAS || {};


    global.FEEMAAS.Geometry =
        Geometry;


    console.log(
        "FEEMAAS Geometry Core loaded."
    );


})(window);