const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const db = require("./src/config/db");
const sheetsRoutes = require("./src/routes/Sheets.routes");
const authRoutes = require("./src/routes/Auth.routes");
const projectsRoutes = require("./src/routes/Projects.routes");

const app = express();
dotenv.config();
db.connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CORS_ORIGINS.split(', '),
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// Routes used in the app
app.use("/auth", authRoutes);
app.use("/sheets", sheetsRoutes);
app.use("/projects", projectsRoutes)

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
