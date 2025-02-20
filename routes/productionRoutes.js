const express = require("express");
const router = express.Router();
const { insertProductionData, getProductionData } = require("../controllers/productionController");

// POST route to insert data
router.post("/data", insertProductionData);

// GET route to retrieve data
router.get("/punching", getProductionData);

module.exports = router;
