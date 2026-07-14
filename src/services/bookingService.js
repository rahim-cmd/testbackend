const bookingModel = require("../models/bookingModel");

const createBooking = async (bookingData) => {

    const bookingId = await bookingModel.createBooking(bookingData);

    return {

        id: bookingId

    };

};

module.exports = {

    createBooking

};