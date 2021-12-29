const convert = require("./lib/converter");
const path = require("path");

const imagePath = path.join(__dirname, "bocil.bmp");
convert.bmp.toBnW(imagePath);
