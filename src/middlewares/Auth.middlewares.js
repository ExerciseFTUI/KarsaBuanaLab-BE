const jwt = require("jsonwebtoken");

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
    return (req, res, next) => {
        if (!req.body.role) {
            res.status(403).json({message: "You don't have any role"});
        }
        if (permissions.includes(req.body.role)) {
            next();
        } else {
            res.status(401).json({message: "You don't have permission to access this resource"});
        }
    }
}