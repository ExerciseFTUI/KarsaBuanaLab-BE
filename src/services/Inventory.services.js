const { Inventory } = require("../models/Inventory.models");
const { User } = require("../models/User.models");

exports.getAllInventory = async function (body) {
  const items = await Inventory.find().lean();

  for (const item of items) {
    const assignedUsersArray = await fetchAssignedUsers(item.assigned_user);

    const deadline = calculateDeadline(
      item.last_maintenance,
      item.maintenance_every
    );

    item.assigned_users = assignedUsersArray;
    item.deadline = deadline;
  }

  return { message: "success", items };
};

exports.createInventory = async function (body) {
  const newInventory = new Inventory(inventoryData);
  const createdInventory = await newInventory.save();
  return { message: "success", createdInventory };
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
