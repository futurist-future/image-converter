const path = require("path");
const convert = require("./lib/converter");
const { splitPerIndex } = require("./lib/utils/splitPerIndex");

const imagePath = path.join(__dirname, "images", "sike.bmp");
convert.bmp.toSephia(imagePath);