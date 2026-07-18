const getZoomTimeZone = () => process.env.ZOOM_TIMEZONE || "Europe/London";

const getWallClockParts = (date = new Date(), timeZone = getZoomTimeZone()) => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    const parts = formatter.formatToParts(date).reduce((accumulator, part) => {
        if (part.type !== "literal") {
            accumulator[part.type] = part.value;
        }

        return accumulator;
    }, {});

    return {
        year: parts.year,
        month: parts.month,
        day: parts.day,
        hour: parts.hour,
        minute: parts.minute,
        second: parts.second,
    };
};

const toWallClockKey = ({ year, month, day, hour, minute }) => `${year}-${month}-${day} ${hour}:${minute}`;

const getCurrentWallClockKey = (timeZone = getZoomTimeZone()) => toWallClockKey(getWallClockParts(new Date(), timeZone));

const buildWallClockKey = (meetingDate, timeString) => {
    if (!meetingDate || !timeString) {
        return null;
    }

    return `${meetingDate} ${timeString.slice(0, 5)}`;
};

const subtractMinutesFromWallClock = (meetingDate, timeString, minutes) => {
    if (!meetingDate || !timeString) {
        return null;
    }

    const [year, month, day] = meetingDate.split("-").map((value) => Number(value));
    const [hour, minute, second = "0"] = timeString.split(":");
    const adjusted = new Date(Date.UTC(year, month - 1, day, Number(hour), Number(minute), Number(second)) - (minutes * 60000));

    return `${adjusted.getUTCFullYear()}-${String(adjusted.getUTCMonth() + 1).padStart(2, "0")}-${String(adjusted.getUTCDate()).padStart(2, "0")} ${String(adjusted.getUTCHours()).padStart(2, "0")}:${String(adjusted.getUTCMinutes()).padStart(2, "0")}`;
};

const isWithinJoinWindow = ({ meeting_date, start_time, end_time, timeZone = getZoomTimeZone(), graceMinutes = 2 }) => {
    const currentKey = getCurrentWallClockKey(timeZone);
    const openKey = subtractMinutesFromWallClock(meeting_date, start_time, graceMinutes);
    const closeKey = buildWallClockKey(meeting_date, end_time);

    if (!currentKey || !openKey || !closeKey) {
        return false;
    }

    return currentKey >= openKey && currentKey <= closeKey;
};

module.exports = {
    getZoomTimeZone,
    getWallClockParts,
    getCurrentWallClockKey,
    buildWallClockKey,
    subtractMinutesFromWallClock,
    isWithinJoinWindow,
};
