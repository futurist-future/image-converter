const path = require("path");
const fs = require("fs");
const convert = require("./lib/converter");
const { splitIntoPart } = require("./lib/utils/splitPerIndex");
const { decimalToHex } = require("./lib/utils/hexConverter");

const imagePath = path.join(__dirname, "images", "place24.bmp");
convert.bmp.toSephia(imagePath);

