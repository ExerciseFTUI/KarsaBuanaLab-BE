const Express = require("express");
const router = Express.Router();
const inventoryControllers = require("../controllers/Inventory.controllers");
const projectMiddleware = require("../middlewares/Projects.middlewares");

router.get("/get-all-inventory", inventoryControllers.getAllInventory);
router.post("/create-inventory", inventoryControllers.createInventory);
router.get(
  "/get-inventory-by-id/:id",
  inventoryControllers.getInventoryItemById
);
router.post("/update-inventory", inventoryControllers.updateInventory);
router.post("/delete-file", inventoryControllers.deleteFileFromInventory);
router.get("/get-users", inventoryControllers.getUsers);
router.get("/get-vendor", inventoryControllers.getVendor);
router.post("/create-vendor", inventoryControllers.createVendor);
router.delete("/delete-vendor", inventoryControllers.deleteVendor);
router.get("/deleteall",inventoryControllers.deleteAllInventory);
router.get("/get-inventory-by-pic/:id",inventoryControllers.getInventoryByPIC);

router.post(
  "/add-file",
  projectMiddleware.uploadFiles,
  inventoryControllers.addFile
);
module.exports = router;
