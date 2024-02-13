const { BaseSample } = require("../models/BaseSample.models");
const { Regulation } = require("../models/Regulation.models");
const projectsUtils = require("../utils/Projects.utils");
const drivesServices = require("../services/Drives.services");

exports.getBaseSample = async function (body) {
  const result = await BaseSample.findOne({ _id: body._id });
  if (!result) {
    throw new Error("Base sample not found");
  }
  return { message: "Base sample found", result };
};

exports.addBaseSample = async function (files, body) {
  const regulationObj = body;
  const dupCheck = await BaseSample.findOne({
    sample_name: regulationObj.sample_name,
  });
  if (dupCheck) {
    throw new Error("Base sample already exists");
  }
  let new_folder = null;
  try {
    new_folder = await drivesServices.createFolder({
      folder_name: regulationObj.sample_name,
      root_folder_id: process.env.FOLDER_ID_BASE_SAMPLE,
    });
    const files_object_list = await projectsUtils.uploadFilesToDrive(
      files,
      new_folder.result.id
    );
    const result = new BaseSample({
      sample_name: regulationObj.sample_name,
      file_id: files_object_list[0].file_id,
      file_safety_id: files_object_list[1].file_id,
      param: [],
      regulation: [],
    });
    await result.save();
    return { message: "Base sample created", result };
  } catch (error) {
    throw { message: error.message, new_folder_id: new_folder.result.id };
  }
};

exports.editBaseSample = async function (id, body) {
  const regulationObj = body;
  let arrOfRegulation = [];
  if (regulationObj.regulation) {
    arrOfRegulation = await Promise.all(
      regulationObj.regulation.map(async (reg, index) => {
        const search = await Regulation.findOne({
          regulation_name: reg.regulation_name,
        });
        if (!search) {
          const regulation = new Regulation({
            regulation_name: reg.regulation_name,
            default_param: reg.default_param,
          });
          await regulation.save();
          return regulation;
        }

        const regulation = Regulation.findOneAndUpdate(
          { _id: search._id },
          {
            regulation_name: reg.regulation_name,
            default_param: reg.default_param,
          },
          { new: true }
        );
        return regulation;
      })
    );
  }
  const updateFields = {};
  if (regulationObj.sample_name) {
    updateFields.sample_name = regulationObj.sample_name;
  }
  if (regulationObj.param) {
    updateFields.param = regulationObj.param;
  }
  if (regulationObj.regulation) {
    updateFields.regulation = regulationObj.regulation;
  }

  const result = await BaseSample.findOneAndUpdate({ _id: id }, updateFields, {
    new: true,
  });

  return { message: "Base sample updated", result };
};

exports.removeBaseSample = async function (body) {
  const result = await BaseSample.findOneAndDelete({ _id: body._id });
  if (!result) {
    throw new Error("Base sample not found");
  }
  await Promise.all(
    result.regulation.map(async (reg) => {
      await Regulation.findOneAndDelete({ _id: reg._id });
    })
  );
  return { message: "Base sample deleted", result };
};
