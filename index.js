const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const db = require("./src/config/db");
const authRoutes = require("./src/routes/Auth.routes");
const sheetsRoutes = require("./src/routes/Sheets.routes");
const drivesRoutes = require("./src/routes/Drives.routes");
const projectsRoutes = require("./src/routes/Projects.routes");
const marketingRoutes = require("./src/routes/Marketing.route");

const app = express();
dotenv.config();
db.connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CORS_ORIGINS.split(", "),
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

// Routes used in the app
app.use("/auth", authRoutes);
app.use("/sheets", sheetsRoutes);
app.use("/drive", drivesRoutes);
app.use("/projects", projectsRoutes);
app.use("/marketing", marketingRoutes);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
