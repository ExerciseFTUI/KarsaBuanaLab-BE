const express = require("express");
const { google } = require("googleapis");
const dotenv = require("dotenv");
dotenv.config();

const sheetsRoute = require("./src/routes/Sheets.routes");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index");
});

app.use("/sheets", sheetsRoute);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
