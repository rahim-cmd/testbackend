const circleModel = require("../models/circleModel");

const createCircle = async (circleData) => {

    const circle = {

        title: circleData.title,

        description: circleData.description || null,

        meeting_date: circleData.meeting_date,

        start_time: circleData.start_time,

        end_time: circleData.end_time,

        max_members: circleData.max_members,

        zoom_link: circleData.zoom_link || null,

        host_name: circleData.host_name || null,

        created_by: circleData.created_by

    };

    const circleId = await circleModel.createCircle(circle);

    return {

        id: circleId

    };

};

module.exports = {

    createCircle

};