const jwt = require("jsonwebtoken");

exports.authenticateToken = function (req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) return res.status(401).json({message: "Unauthorized access"});

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({message: "Invalid/Expired token"});
        req.user = user;
        next();
    });
}