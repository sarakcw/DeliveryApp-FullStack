const express = require("express");
const packageCont = require("../controllers/package-controller");

const router = express.Router();

router.post("/add", packageCont.createPackage); //add a package
router.get("/", packageCont.getAllPackage); //list all packages
router.delete("/remove", packageCont.deletePackage); //delete a package
router.put("/update", packageCont.updateDestination); // update package destination



module.exports = router; 