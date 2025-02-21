const express = require("express");
const router = express.Router();
const { insertPunchingData, getPunchingData } = require("../controllers/PunchingController");
const { insertCnDData, getCnDData } = require("../controllers/CnDController");

// POST route to insert data
router.post("/data", insertPunchingData);

// GET route to retrieve data
router.get("/punching", getPunchingData);

// GET and POST for Cutting and Drilling Machine
router.post("/postCnD", insertCnDData);
router.get("/getCnD", getCnDData);

module.exports = router;
