const path = require("path");
const fs = require("fs");
const convert = require("./lib/converter");
const { splitIntoPart } = require("./lib/utils/splitPerIndex");
const { decimalToHex } = require("./lib/utils/hexConverter");

const imagePath = path.join(__dirname, "images", "sike.bmp");
convert.bmp.toSephia(imagePath);

// console.log(decimalToHex(16));
// console.log(splitIntoPart([1, 2, 3, 4, 5, 6, 7, 8, 9,  10], 4));

// See inside image
// const imageData = fs.readFileSync(imagePath, { encoding: "hex" });
// const outputpath = path.join(__dirname, "place32.txt");
// fs.writeFileSync(outputpath, imageData, { encoding: "utf-8" });
