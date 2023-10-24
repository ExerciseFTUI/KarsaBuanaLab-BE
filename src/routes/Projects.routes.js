const Express = require("express");
const { google } = require("googleapis");
const router = Express.Router();
const projectsControllers = require("../controllers/Projects.controllers");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
const upload = multer({ storage: storage });
router.post("/add-base-sample", projectsControllers.newBaseSample);
router.post("/create", upload.array('files', 10), projectsControllers.createProject);

module.exports = router;