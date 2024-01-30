const baseSampleServices = require("../services/BaseSample.services");

exports.getBaseSample = async function (req, res) {
  try {
    const result = await baseSampleServices.getBaseSample(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.addBaseSample = async function (req, res) {
  try {
    const result = await baseSampleServices.addBaseSample(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.editBaseSample = async function (req, res) {
  try {
    const result = await baseSampleServices.editBaseSample(
      req.params.id,
      req.body
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
