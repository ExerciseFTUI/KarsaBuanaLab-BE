const samplingServices = require('../services/Sampling.services');

exports.getSampling = async function (req, res) {
    try {
        const result = await samplingServices.getSampling(req.params);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.getSampleByAcc = async function (req, res) {
    try {
        const result = await samplingServices.getSampleByAcc(req.params, req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.changeSampleStatus = async function (req, res) {
    try {
        const result = await samplingServices.changeSampleStatus(req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.sampleAssignment = async function (req, res) {
    try {
        const result = await samplingServices.sampleAssignment(req.params, req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.getUser = async function (req, res) {
    try {
        const result = await samplingServices.getUser(req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.getDashboardSampling = async function (req, res) {
    try {
        const result = await samplingServices.getDashboardSampling(req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.getSamplingDetails = async function (req, res) {
  try {
    const result = await samplingServices.getSamplingDetails(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

