const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("Hostinger Node Working");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Running");
});