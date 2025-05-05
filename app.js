const express = require("express");

const app = express();
const path = require("path");
app.use(express.json());
const homePageRouter = require("./routes/homepageRoute");
app.use(express.static(path.join(__dirname, "public")));
app.use("/home", homePageRouter);

module.exports = app;
