const authServices = require('../services/Auth.services');

exports.refreshTokens = async function (req, res) {
    try {
      const result = await authServices.refreshTokens(req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
}
  
exports.getUser = async function (req, res) {
    try {
        const result = await authServices.getUser(req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.register = async function (req, res) {
    try {
        const { username, email } = req.body;

        // Check if username already exists
        if (await authServices.findUserByUsername(username))
        return res.status(409).json({ message: 'Username already taken' });

        // Check if email already exists
        if (await authServices.findUserByEmail(email))
        return res.status(409).json({ message: 'Email already taken' });

        const result = await authServices.register(req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

exports.login = async function login(req, res) {
    try {
        const result = await authServices.login(req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}
  
exports.logout = async function (req, res) {
    try {
        const result = await authServices.logout(req.body);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}
