// =====================================
// FEEMAAS GEOMETRY ENGINE
// Version 1
//
// Responsibility:
// - Coordinate calculations
// - Workspace geometry
// - Zone detection
// - Position normalization
// - Future layout calculations
//
// IMPORTANT:
// This file does NOT render anything.
// It does NOT create SVG elements.
// It does NOT communicate with the API.
// =====================================


// =====================================
// GLOBAL FEEMAAS NAMESPACE
// =====================================

window.FEEMAAS = window.FEEMAAS || {};


// =====================================
// GEOMETRY NAMESPACE
// =====================================

FEEMAAS.Geometry = {

    // ---------------------------------
    // Workspace dimensions
    // ---------------------------------

    workspace: {
        width: 800,
        height: 500
    },


    // ---------------------------------
    // Get workspace center
    // ---------------------------------

    getCenter() {

        return {

            x:
                this.workspace.width / 2,

            y:
                this.workspace.height / 2

        };

    },


    // ---------------------------------
    // Convert local project position
    // to SVG position
    //
    // Project coordinates are stored
    // relative to workspace center.
    //
    // Example:
    //
    // position_x = 0
    // position_y = 0
    //
    // becomes:
    //
    // SVG x = 400
    // SVG y = 250
    // ---------------------------------

    localToSVG(
        positionX,
        positionY
    ) {

        const center =
            this.getCenter();

        return {

            x:
                center.x +
                Number(positionX || 0),

            y:
                center.y +
                Number(positionY || 0)

        };

    },


    // ---------------------------------
    // Convert SVG position
    // to local project position
    // ---------------------------------

    svgToLocal(
        svgX,
        svgY
    ) {

        const center =
            this.getCenter();

        return {

            x:
                Number(svgX || 0) -
                center.x,

            y:
                Number(svgY || 0) -
                center.y

        };

    },


    // ---------------------------------
    // Clamp project position
    // ---------------------------------

    clampPosition(
        x,
        y,
        size = 100
    ) {

        const width =
            this.workspace.width;

        const height =
            this.workspace.height;

        const radius =
            Number(size || 100) / 2;


        const minX =
            -width / 2 +
            radius;


        const maxX =
            width / 2 -
            radius;


        const minY =
            -height / 2 +
            radius;


        const maxY =
            height / 2 -
            radius;


        return {

            x:
                Math.max(
                    minX,
                    Math.min(
                        maxX,
                        Number(x || 0)
                    )
                ),

            y:
                Math.max(
                    minY,
                    Math.min(
                        maxY,
                        Number(y || 0)
                    )
                )

        };

    },


    // ---------------------------------
    // Point inside rectangle
    // ---------------------------------

    pointInsideRect(
        x,
        y,
        rect
    ) {

        if (!rect) {

            return false;

        }


        return (

            x >= rect.x &&

            x <=
                rect.x +
                rect.width &&

            y >= rect.y &&

            y <=
                rect.y +
                rect.height

        );

    },


    // ---------------------------------
    // Detect zone from SVG coordinate
    //
    // zones are supplied by Workspace.
    // Geometry does not own business
    // definitions of zones.
    // ---------------------------------

    detectZone(
        x,
        y,
        zones
    ) {

        if (
            !Array.isArray(zones)
        ) {

            return null;

        }


        for (
            const zone of zones
        ) {

            if (
                this.pointInsideRect(
                    x,
                    y,
                    zone
                )
            ) {

                return zone;

            }

        }


        return null;

    },


    // ---------------------------------
    // Calculate distance between points
    // ---------------------------------

    distance(
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


    // ---------------------------------
    // Calculate distance from center
    // ---------------------------------

    distanceFromCenter(
        x,
        y
    ) {

        const center =
            this.getCenter();

        return this.distance(
            x,
            y,
            center.x,
            center.y
        );

    },


    // ---------------------------------
    // Normalize number
    // ---------------------------------

    normalize(
        value
    ) {

        const number =
            Number(value);

        if (
            !Number.isFinite(number)
        ) {

            return 0;

        }

        return number;

    }

};


// =====================================
// VERSION MARKER
// =====================================

FEEMAAS.Geometry.version =
    "1.0.0";


console.log(
    "FEEMAAS.Geometry Engine Version 1 loaded."
);