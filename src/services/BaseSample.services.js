const { BaseSample } = require("../models/BaseSample.models");
const { Regulation } = require("../models/Regulation.models");

exports.getBaseSample = async function (body) {
  const result = await BaseSample.findOne({ _id: body._id });
  if (!result) {
    throw new Error("Base sample not found");
  }
  return { message: "Base sample found", result };
};

exports.addBaseSample = async function (body) {
  const regulationObj = body;
  const dupCheck = await BaseSample.findOne({
    sample_name: regulationObj.sample_name,
  });
  if (dupCheck) {
    throw new Error("Base sample already exists");
  }
  const arrOfRegulation = await Promise.all(
    regulationObj.regulation.map(async (reg) => {
      const regulation = new Regulation({
        regulation_name: reg.regulation_name,
        default_param: reg.default_param,
      });
      await regulation.save();
      return regulation;
    })
  );

  const result = new BaseSample({
    sample_name: regulationObj.sample_name,
    file_id: regulationObj.file_id,
    file_safety_id: regulationObj.file_safety_id,
    param: regulationObj.param,
    regulation: arrOfRegulation,
  });
  await result.save();
  return { message: "Base sample created", result };
};

exports.editBaseSample = async function (id, body) {
  const regulationObj = body;

  const arrOfRegulation = await Promise.all(
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

  const result = await BaseSample.findOneAndUpdate(
    { _id: id },
    {
      sample_name: regulationObj.sample_name,
      file_id: regulationObj.file_id,
      file_safety_id: regulationObj.file_safety_id,
      param: regulationObj.param,
      regulation: arrOfRegulation,
    },
    { new: true }
  );

  return { message: "Base sample updated", result };
};
