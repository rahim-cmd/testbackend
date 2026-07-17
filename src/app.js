const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const app = express();

app.use(cors());

app.use(helmet());

app.use(compression());

app.use(express.json({
	verify: (req, res, buf) => {
		req.rawBody = buf.toString();
	}
}));

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(morgan("dev"));

const authRoutes = require("./routes/authRoutes");
const circleRoutes = require("./routes/circleRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes = require("./routes/userRoutes");
const healthRoutes = require("./routes/healthRoutes");
const zoomRoutes = require("./routes/zoomRoutes");

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/circles", circleRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/zoom", zoomRoutes);

module.exports = app;