const express = require("express");
const router = express.Router();
const { insertPunchingData, getPunchingData } = require("../controllers/PunchingController");
const { insertCnDData, getCnDData } = require("../controllers/CnDController");
const { insertMach3Data, getMach3Data } = require("../controllers/CutterController");

// GET and POST route to insert Punching data
router.post("/data", insertPunchingData);
router.get("/punching", getPunchingData);

// GET and POST for Cutting and Drilling Machine
router.post("/postCnD", insertCnDData);
router.get("/getCnD", getCnDData);

//GET and POST for machine 3
router.post("/postCutter", insertCutterData);
router.get("/getCutter", getCutterData);


module.exports = router;
