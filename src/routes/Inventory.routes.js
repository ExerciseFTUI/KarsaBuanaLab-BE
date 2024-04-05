const Express = require("express");
const router = Express.Router();
const inventoryControllers = require("../controllers/Inventory.controllers");

router.get("/get-all-inventory", inventoryControllers.getAllInventory);
router.post("/create-inventory", inventoryControllers.createInventory);



module.exports = router;
