const path = require("path");
const convert = require("./lib/converter");

const imagePath = path.join(__dirname, "images", "bocil.bmp");
convert.bmp.toSephia(imagePath);

