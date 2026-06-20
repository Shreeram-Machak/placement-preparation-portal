const express = require("express");
const { getDashboardData, getProgressData } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getDashboardData);
router.get("/progress", protect, getProgressData);

module.exports = router;
