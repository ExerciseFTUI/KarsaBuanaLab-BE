const { Inventory, Vendor } = require("../models/Inventory.models");
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
    current_vendor,
    description,
    last_maintenance,
    maintenance_history,
    maintenance_every,
    assigned_user,
    condition,
    folder_id,
    inventory_file,
  } = body;

  // Check if required fields are missing
  if (!tools_name) {
    throw new Error("Tools name is required");
  }
  if (!last_maintenance) {
    throw new Error("Last maintenance date is required");
  }
  if (!maintenance_every) {
    throw new Error("Maintenance frequency is required");
  }
  if (!condition) {
    throw new Error("Condition is required");
  }

  // Create a new inventory instance
  const newInventory = new Inventory({
    tools_name,
    last_maintenance,
    maintenance_every,
    condition,
    ...(current_vendor && { current_vendor }),
    ...(description && { description }),
    ...(maintenance_history && { maintenance_history }),
    ...(assigned_user && { assigned_user }),
    ...(folder_id && { folder_id }),
    ...(inventory_file && { inventory_file }),
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
  return item;};

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

exports.createVendor = async function (body) {
  try{
    const { vendor_name } = body;
    const newVendor = new Vendor({vendor_name});
    const savedVendor = await newVendor.save();
  
    return {
      success : true,
      message : "Success Creating Vendor",
      vendor : savedVendor
    }  
  }catch (error){
    console.log(error)
  }
};

exports.deleteVendor = async function (body) {
  try {
    const { vendor_id, vendor_name } = body;

    if (!vendor_id && !vendor_name) {
      return {
        success: false,
        message: "Vendor ID or Vendor name is required",
      };
    }

    let deletedVendor;
    if (vendor_id) {
      deletedVendor = await Vendor.findByIdAndDelete(vendor_id);
    } else if (vendor_name) {
      deletedVendor = await Vendor.findOneAndDelete({ vendor_name });
    }

    if (!deletedVendor) {
      return {
        success: false,
        message: "Vendor not found",
      };
    }

    return {
      success: true,
      message: "Success Deleting Vendor",
      result: deletedVendor,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Error Deleting Vendor",
      error: error.message,
    };
  }
};




exports.getVendor = async function () {
  try{
    const vendor = await Vendor.find().lean();
    return { 
          message: "success",
          success:true, 
          vendor 
      };
  }catch(error){
    console.log(error)
  }
};

exports.deleteAllInventory = async function () {
  try {
    const result = await Inventory.deleteMany({});

    return {
      success: true,
      message: "Success Deleting All Inventory",
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Error Deleting All Inventory",
      error: error.message,
    };
  }
};

exports.getInventoryByPIC = async function (params) {
  try {
    const {id} = params
    if (!id) {
      return {
        success: false,
        message: "User ID is required",
        results : null
      };
    }

    const inventoryItems = await Inventory.find({ assigned_user: id });

    if (!inventoryItems.length) {
      return {
        success: false,
        message: "No inventory items found for the given user ID",
        results : null,
      };
    }

    return {
      success: true,
      message: "Success Finding Inventory Items",
      inventory: inventoryItems,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Error Finding Inventory Items",
      error: error.message,
    };
  }

}



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


