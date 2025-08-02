const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: Token missing or malformed" });
    }

    const token = authHeader.split(" ")[1];
    console.log(token)

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log(decoded)
        req.user = decoded; // Attach user info to request
        // console.log(req.user)
        console.log("VERIFY JWT WITH:", process.env.JWT_SECRET);
        next();
    } catch (err) {
        console.error("Token verification failed:", err);
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};

module.exports = verifyToken;