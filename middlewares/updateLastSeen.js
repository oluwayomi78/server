const Admin = require("../models/adminModels");

const updateLastSeen = async (req, res, next) => {
    try {
        await Admin.findByIdAndUpdate(req.admin.id, { lastSeen: Date.now() });
    } catch (error) {
        console.error("Failed to update last seen:", error);
    }
    next();
};
