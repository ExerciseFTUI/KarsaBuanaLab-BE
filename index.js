const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const db = require("./src/config/db");
const authRoutes = require("./src/routes/Auth.routes");
const sheetsRoutes = require("./src/routes/Sheets.routes");
const drivesRoutes = require("./src/routes/Drives.routes");
const projectsRoutes = require("./src/routes/Projects.routes");
const marketingRoutes = require("./src/routes/Marketing.route");
const samplingRoutes = require("./src/routes/Sampling.routes");
const clientsRoutes = require("./src/routes/Clients.routes");
const baseSampleRoutes = require("./src/routes/BaseSample.routes");
const surveyRoutes = require("./src/routes/Survey.routes.js");
const labRoutes = require("./src/routes/Lab.routes");
const inventoryRoutes = require("./src/routes/Inventory.routes.js");
const morganMiddlewares = require('./src/middlewares/Logger.middlewares.js');
const app = express();
dotenv.config();
db.connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if(process.env.LOGGER === 'true') app.use(morganMiddlewares);
app.use(
  cors({
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  const htmlResponse = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Exercise FTUI Karsa Buana Lab Endpoint</title>
      <style>
        body {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background-color: #f0f0f0;
        }

        .container {
          text-align: center;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          background-color: #ffffff;
        }

        h1 {
          color: #333;
          font-size: 24px;
          margin-bottom: 20px;
        }

        p {
          color: #777;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to Exercise FTUI Karsa Buana Lab Endpoint</h1>
        <p>Unauthorized access is strictly prohibited!</p>
      </div>
    </body>
    </html>
    `;
  res.send(htmlResponse);
});

// Routes used in the app
app.use("/auth", authRoutes);
app.use("/sheets", sheetsRoutes);
app.use("/drive", drivesRoutes);
app.use("/projects", projectsRoutes);
app.use("/marketing", marketingRoutes);
app.use("/sampling", samplingRoutes);
app.use("/clients", clientsRoutes);
app.use("/base-sample", baseSampleRoutes);
app.use("/survey", surveyRoutes);
app.use("/lab", labRoutes);
app.use("/inventory", inventoryRoutes);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is running on port ${port} `);
});
