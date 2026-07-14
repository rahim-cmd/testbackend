const db = require("../config/db");

const createCircle = async (circle) => {

    const [result] = await db.execute(

        `INSERT INTO circle_events
        (
            title,
            description,
            meeting_date,
            start_time,
            end_time,
            max_members,
            booked_members,
            zoom_link,
            host_name,
            booking_open,
            status,
            created_by
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

        [
            circle.title,
            circle.description,
            circle.meeting_date,
            circle.start_time,
            circle.end_time,
            circle.max_members,
            0,
            circle.zoom_link,
            circle.host_name,
            1,
            "scheduled",
            circle.created_by
        ]

    );

    return result.insertId;

};

const getUpcomingCircles = async () => {

    const [rows] = await db.execute(

        `SELECT
            id,
            title,
            description,
            meeting_date,
            start_time,
            end_time,
            max_members,
            booked_members,
            host_name
        FROM circle_events
        WHERE
            status = 'scheduled'
            AND booking_open = 1
            AND meeting_date >= CURDATE()
        ORDER BY meeting_date ASC, start_time ASC`

    );

    return rows;

};

module.exports = {

    createCircle,
    getUpcomingCircles

};