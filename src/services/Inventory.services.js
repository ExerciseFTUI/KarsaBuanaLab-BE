const { Inventory } = require("../models/Inventory.models");
const { User } = require("../models/User.models");
const drivesServices = require("../services/Drives.services");
const projectsUtils = require("../utils/Projects.utils");

exports.getAllInventory = async function (body) {
  const items = await Inventory.find().lean();

  for (const item of items) {
    const assignedUsersArray = await fetchAssignedUsers(item.assigned_user);

    const deadline = calculateDeadline(
      item.last_maintenance,
      item.maintenance_every
    );

    item.assigned_users =
      assignedUsersArray.length > 0 ? assignedUsersArray[0] : [];

    item.deadline = deadline;
  }

  return { message: "success", items };
};

exports.createInventory = async function (body) {
  const {
    tools_name,
    description,
    last_maintenance,
    maintenance_history,
    maintenance_every,
    assigned_user,
    category,
    folder_id,
    inventory_file,
  } = body;

  // Check if required fields are missing
  if (!tools_name) {
    throw new Error("Tools name is required");
  }
  if (!description) {
    throw new Error("Description is required");
  }
  if (!last_maintenance) {
    throw new Error("Last maintenance date is required");
  }
  if (!maintenance_every) {
    throw new Error("Maintenance frequency is required");
  }
  if (!category) {
    throw new Error("Category is required");
  }
  // Create a new inventory instance
  const newInventory = new Inventory({
    tools_name,
    description,
    last_maintenance,
    maintenance_history,
    maintenance_every,
    assigned_user,
    category,
    folder_id,
    inventory_file,
  });

  // Save the new inventory to the database
  const savedInventory = await newInventory.save();

  return {
    message: "Inventory created successfully",
    inventory: savedInventory,
  };
};

exports.getInventoryItemById = async function (params) {
  const { id } = params;
  const item = await Inventory.findById(id);
  if (!item) throw new Error("Inventory item not found");
  return item;
};

exports.updateInventory = async function (body) {
  const { id, updates } = body;
  const updatedItem = await Inventory.findByIdAndUpdate(id, updates, {
    new: true,
  });
  return updatedItem;
};

exports.getUsers = async function () {
  const users = await User.find({ role: { $ne: "ADMIN" } });
  return { message: "success", users };
};

exports.addFile = async function (files, body) {
  const { inventoryId } = body;
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) {
    throw new Error("Inventory not found");
  }
  if (!inventory.folder_id) {
    // If not, create a new folder and store the folder_id in the inventory
    const newFolder = await drivesServices.createFolder({
      folder_name: inventory.tools_name,
      root_folder_id: process.env.INVENTORY_FOLDER, // Assuming you have a root folder ID for inventories
    });
    inventory.folder_id = newFolder.result.id;
    await inventory.save();
  }

  const uploadedFiles = await projectsUtils.uploadFilesToDrive(
    files, // Assuming the file parameter is an array
    inventory.folder_id
  );

  uploadedFiles.forEach((uploadedFile) => {
    // Create file metadata for each uploaded file
    const fileMetadata = {
      file_name: uploadedFile.file_name, // Assuming uploadedFile.originalname contains the original file name
      file_type: uploadedFile.file_type,
      file_id: uploadedFile.file_id,
      file_extension: uploadedFile.file_extension, // Assuming the file name has an extension
    };

    // Push the file metadata to the inventory's inventory_file array
    inventory.inventory_file.push(fileMetadata);
  });

  await inventory.save();

  return { message: "File uploaded successfully", inventory };
};

exports.deleteFileFromInventory = async function (body) {
  const { fileId, inventoryId } = body;

  // Find the inventory by ID
  const inventory = await Inventory.findById(inventoryId);
  if (!inventory) {
    throw new Error("Inventory not found");
  }

  // Find the index of the file with the given fileId in the inventory's inventory_file array
  const fileIndex = inventory.inventory_file.findIndex(
    (file) => file.file_id === fileId
  );
  if (fileIndex === -1) {
    throw new Error("File not found in inventory");
  }

  // Remove the file metadata from the inventory's inventory_file array
  inventory.inventory_file.splice(fileIndex, 1);

  // Save the updated inventory
  await inventory.save();

  return { message: "File deleted successfully" };
};

async function fetchAssignedUsers(userIdsArray) {
  try {
    const assignedUsersArray = await Promise.all(
      userIdsArray.map(async (userIds) => {
        const users = await User.find({ _id: { $in: userIds } });
        return users;
      })
    );

    return assignedUsersArray;
  } catch (error) {
    console.error("Error fetching assigned users:", error);
    throw error;
  }
}

function calculateDeadline(lastMaintenance, maintenanceFrequency) {
  if (!lastMaintenance || !maintenanceFrequency) return null;

  const maintenanceFrequencyMap = {
    "1 Month": 1,
    "2 Month": 2,
    "3 Month": 3,
    "4 Month": 4,
    "6 Month": 6,
    "1 Year": 12,
    "2 Year": 24,
  };

  const maintenanceMonths = maintenanceFrequencyMap[maintenanceFrequency];
  if (!maintenanceMonths) return null;

  const nextMaintenanceDate = new Date(lastMaintenance);
  nextMaintenanceDate.setMonth(
    nextMaintenanceDate.getMonth() + maintenanceMonths
  );

  return nextMaintenanceDate;
}
