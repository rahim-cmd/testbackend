const circleService = require("../services/circleService");

const createCircle = async (req, res) => {

    try {

        const result = await circleService.createCircle({
            ...req.body,
            userId: req.user.id
            
        });

        return res.status(201).json({

            success: true,

            message: "Circle created successfully.",

            data: result

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

const getUpcomingCircles = async (req, res) => {

    try {

        const circles = await circleService.getUpcomingCircles();

        return res.status(200).json({

            success: true,

            data: circles

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


module.exports = {

    createCircle,
    getUpcomingCircles

};