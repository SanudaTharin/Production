const express = require("express");
const router = express.Router();
const { insertPunchingData, getPunchingData, getpunchingShift, punchpermonth} = require("../controllers/PunchingController");
const { insertCnDData, getCnDData, getCnDShift, CnDpermonth } = require("../controllers/CnDController");
const { insertCuttingData, getCuttingData, getcuttingShift, cutpermonth } = require("../controllers/CuttingController");
const { insertCuttingTwoData, getCuttingTwoData, getCuttingTwoShift, CuttingTwopermonth} = require("../controllers/Cuttingmachine2Controller");
const { insertNutData, getNutData, getnutShift, nutpermonth} = require("../controllers/NutmacController");

// GET and POST route to insert Punching data
router.post("/data", insertPunchingData);
router.get("/punching", getPunchingData);
router.get("/shiftPunching",getpunchingShift);
router.get("/monthPunching",punchpermonth);

// GET and POST for Cutting and Drilling Machine
router.post("/postCnD", insertCnDData);
router.get("/getCnD", getCnDData);
router.get("/shiftCnD",getCnDShift);
router.get("/monthCnD",CnDpermonth);

router.post("/postCutting", insertCuttingData);
router.get("/getCutting", getCuttingData);
router.get("/shiftCutting",getcuttingShift);
router.get("/monthCutting",cutpermonth);

router.post("/postCuttingTwo", insertCuttingTwoData);
router.get("/getCuttingTwo", getCuttingTwoData);
router.get("/shiftCuttingTwo", getCuttingTwoShift);
router.get("/monthCuttingTwo",CuttingTwopermonth);

router.post("/postNut", insertNutData);
router.get("/getCuttingTwo", getNutData);
router.get("/shiftCuttingTwo", getnutShift);
router.get("/monthCuttingTwo",nutpermonth);


module.exports = router;
