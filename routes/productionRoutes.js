const express = require("express");
const router = express.Router();
const { insertProductionData } = require("../controllers/productionController");

router.post("/data", insertProductionData);

module.exports = router;