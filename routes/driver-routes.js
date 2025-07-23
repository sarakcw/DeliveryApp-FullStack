const express = require("express");
const driverCont = require("../controllers/driver-controller.js");

const router = express.Router();

router.post("/add", driverCont.createDriver); //insert one driver
router.get("/", driverCont.getAllDriver); //list all drivers
router.delete("/remove", driverCont.deleteDriver); //delete a driver
router.put("/update", driverCont.updateDriver); //update licence and department

module.exports = router;
