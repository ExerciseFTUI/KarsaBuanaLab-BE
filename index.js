const express = require("express");
const { google } = require("googleapis");
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors"); // Import cors middleware

const sheetsRoute = require("./src/routes/Sheets.routes");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:3000", // Izinkan hanya akses dari localhost:3000
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Izinkan metode HTTP yang diperlukan
    credentials: true, // Izinkan penggunaan kredensial (mis. cookies)
  })
);

app.get("/", (req, res) => {
  res.render("index");
});

app.use("/sheets", sheetsRoute);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
