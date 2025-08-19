const jwt = require("jsonwebtoken");

// Admin verification middleware
module.exports = function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

        if (!decoded.isAdmin) {
            return res.status(403).json({ message: "Access denied: not an admin" });
        }

        req.admin = decoded; // Save token data to req for later use
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
