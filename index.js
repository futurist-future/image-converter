const Convert = require("./lib/converter");
const path = require("path");

const imagePath = path.join(__dirname, "bocil.bmp");
const image = new Convert(imagePath);

image.bmp.toBnW()