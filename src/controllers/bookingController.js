const bookingService = require("../services/bookingService");

const createBooking = async (req, res) => {

    try {

        const result = await bookingService.createBooking({

            user_id: req.user.id,

            circle_id: req.body.circle_id

        });

        return res.status(201).json({

            success: true,

            message: "Booking request submitted.",

            data: result

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

module.exports = {

    createBooking

};