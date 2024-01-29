const express = require("express");
const router = express.Router();

const clientsControllers = require("../controllers/Clients.controllers");

router.post("/login", clientsControllers.login);
router.get("/get-sample-status", clientsControllers.getSampleStatus);
router.get("/get-analysis-status", clientsControllers.getAnalysisStatus);
router.get("/get-payment-status", clientsControllers.getPaymentStatus);

module.exports = router;
