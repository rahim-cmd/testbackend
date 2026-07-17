require("dotenv").config();

const app = require("./app");
const db = require("./config/db");
const ensureZoomSchema = require("./config/ensureZoomSchema");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {

        await db.getConnection();
        await ensureZoomSchema();

        console.log("✅ Database Connected");

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

    } catch (err) {

        console.error(err);

        process.exit(1);

    }
}

startServer();