const marketingServices = require('../services/Marketing.services');

exports.dashboard = async function (req, res) {
    try {
        const result = await marketingServices.dashboard();
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.getSample = async function (req, res) {
    try {
        const result = await marketingServices.getSample();
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.getProjectByStatus = async function (req, res) {
    try {
        const result = await marketingServices.getProjectByStatus(req.params);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.getProjectByStatusAndYear = async function (req, res) {
    try {
        const result = await marketingServices.getProjectByStatusAndYear(req.params);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.getProjectByID = async function (req, res) {
    try {
        const result = await marketingServices.getProjectByID(req.params);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}