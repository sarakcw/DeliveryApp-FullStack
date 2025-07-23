const express = require("express");
const sessionCont = require("../controllers/session-controller.js");

const router = express.Router();

router.post("/signup", sessionCont.signup);
router.post("/login", sessionCont.login);

module.exports = router;
