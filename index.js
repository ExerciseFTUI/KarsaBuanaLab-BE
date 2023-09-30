const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const sheetsRoute = require("./src/routes/Sheets.routes");

const app = express();
dotenv.config();

app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CORS_ORIGINS.split(', '),
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// Routes for sheets API
app.use("/sheets", sheetsRoute);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
