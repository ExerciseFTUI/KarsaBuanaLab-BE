const Express = require("express");
const router = Express.Router();
const inventoryControllers = require("../controllers/Inventory.controllers");

router.get("/get-all-inventory", inventoryControllers.getAllInventory);

module.exports = router;
