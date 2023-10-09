const jwt = require("jsonwebtoken");
const User = require('../models/User.models');

exports.authenticateToken = function (req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) return res.status(401).json({message: "Unauthorized access"});

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({message: "Token is invalid or has expired"});
        req.user = user;
        next();
    });
}

exports.authenticateRoles = (permissions) => {
    return async (req, res, next) => {
        if (!req.body._id) {
            res.status(403).json({message: "No user id provided"});
            return;
        }
        try{
            const user = await User.findById(req.body._id);
            if (!user) {
                res.status(404).json({message: "User not found"});
                return;
            }
            if (!permissions.includes(user.role)) {
                res.status(401).json({message: "You don't have permission to access this resource"});
            }else{
                next();
            }
        }catch(err){
            res.status(500).json({message: "Failed to authenticate user"});
        }
    }
}