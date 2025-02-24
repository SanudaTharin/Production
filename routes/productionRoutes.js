const express = require("express");
const router = express.Router();
const { insertPunchingData, getPunchingData } = require("../controllers/PunchingController");
const { insertCnDData, getCnDData } = require("../controllers/CnDController");
const { insertCuttingData, getCuttingData } = require("../controllers/CuttingController");


// GET and POST route to insert Punching data
router.post("/data", insertPunchingData);
router.get("/punching", getPunchingData);

// GET and POST for Cutting and Drilling Machine
router.post("/postCnD", insertCnDData);
router.get("/getCnD", getCnDData);

router.post("/postCutting", insertCuttingData);
router.get("/getCutting", getCuttingData);


module.exports = router;
