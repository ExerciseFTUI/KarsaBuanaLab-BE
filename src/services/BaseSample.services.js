const { BaseSample } = require("../models/BaseSample.models");
const { Regulation } = require("../models/Regulation.models");
const projectsUtils = require("../utils/Projects.utils");
const drivesServices = require("../services/Drives.services");
const { Param } = require("../models/Param.models");

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

  if (!regulationObj.sample_name || !regulationObj.param || !regulationObj.regulation) throw new Error("Please fill all the fields");
  if (dupCheck) throw new Error("Base sample already exists");

  let new_folder = null;
  let regulationParam = [];

  try {
    new_folder = await drivesServices.createFolder({
      folder_name: regulationObj.sample_name,
      root_folder_id: process.env.FOtLDER_ID_BASE_SAMPLE,
    });
    const files_object_list = await projectsUtils.uploadFilesToDrive(
      files,
      new_folder.result.id
    );

    regulationObj.param.forEach(async (param) => {
      const paramBaseSample = new Param({
        param: param.param,
        method: param.method || null,
        unit: param.unit || null,
        operator: param.operator || null,
        baku_mutu: param.baku_mutu || null,
      });

      await paramBaseSample.save();
      regulationParam.push(paramBaseSample);
    });

    const result = new BaseSample({
      sample_name: regulationObj.sample_name,
      file_id: files_object_list[0].file_id,
      file_safety_id: files_object_list[1].file_id,
      param: regulationParam,
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
  let arrOfParam = [];

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

  if (regulationObj.param) {
    arrOfParam = await Promise.all(
      regulationObj.param.map(async (param, index) => {
        const search = await Param.findOne({
          param: param.param,
        });
        if (!search) {
          const oldParam = new Param({
            param: param.param,
            method: param.method || null,
            unit: param.unit || null,
            operator: param.operator || null,
            baku_mutu: param.baku_mutu || null,
          });
          await oldParam.save();
          return oldParam;
        }

        const newParam = Param.findOneAndUpdate(
          { _id: search._id },
          {
            param: param.param,
            method: param.method || null,
            unit: param.unit || null,
            operator: param.operator || null,
            baku_mutu: param.baku_mutu || null,
          },
          { new: true }
        );
        return newParam;
      })
    );
  }

  // check duplicate param and regulation using Set()
  const setOfRegulation = new Set(arrOfRegulation);
  const setOfParam = new Set(arrOfParam);

  if (setOfRegulation.size !== arrOfRegulation.length) {
    throw new Error("Duplicate regulation found");
  }

  if (setOfParam.size !== arrOfParam.length) {
    throw new Error("Duplicate param found");
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
