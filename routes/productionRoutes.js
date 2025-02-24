const express = require("express");
const router = express.Router();
const { insertPunchingData, getPunchingData } = require("../controllers/PunchingController");



// GET and POST route to insert Punching data
router.post("/data", insertPunchingData);
router.get("/punching", getPunchingData);

// GET and POST for Cutting and Drilling Machine
router.post("/postCnD", insertCnDData);
router.get("/getCnD", getCnDData);




module.exports = router;
