const samplingServices = require('../services/Sampling.services');

exports.getSampling = async function (req, res) {
    try {
        let result;
        if (req.body.status != null) {
            result = await samplingServices.changeSampleStatus(req.params, req.body);
        } else if (req.body.accountId != null) {
            result = await samplingServices.sampleAssignment(req.params, req.body);
        } else {
            result = await samplingServices.getSampling(req.params);
        }
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.getSampleByAcc = async function (req, res) {
    try {
        const result = await samplingServices.getSampleByAcc(req.params.tahun, req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}