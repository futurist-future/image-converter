const path = require("path");
const fs = require("fs");
const convert = require("./lib/converter");

const imagePath = path.join(__dirname, "bocil.bmp");
convert.bmp.toSephia(imagePath);
