const path = require("path");
const fs = require("fs");
const convert = require("./lib/converter");
const splitPerIndex = require("./lib/utils/splitPerIndex");

const imagePath = path.join(__dirname, "images", "bocil.bmp");
convert.bmp.toSephia(imagePath);
