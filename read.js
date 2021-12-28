const fs = require("fs");
const path = require("path");
const hexAverage = require("./hexAverage");
const { hexToDecimal } = require("./hexConverter");
const splitPerIndex = require("./lib/splitPerIndex");

const pathToFile = path.join(__dirname, "image.bmp");
const imageData = fs.readFileSync(pathToFile, "hex");

const dataString = String(imageData);

const headerLength = hexToDecimal(dataString.slice(28, 30));
const header =
  headerLength < 124 ? dataString.slice(0, 108) : dataString.slice(0, 124);
const body = headerLength < 124 ? dataString.slice(108) : dataString.slice(124);

let counter = 0;
let LENGTH = headerLength < 124 ? 6 : 8;
const arr = [];
for (let i = 0; i < body.length; i += LENGTH) {
  let current = body.slice(counter, counter + LENGTH);
  arr.push(hexAverage(current, headerLength));
  counter += LENGTH;
}

const wholeFile = header + arr.join("");

const pathToOuput = path.join(__dirname, `imageBnW.bmp`);
fs.writeFileSync(pathToOuput, wholeFile, { encoding: "hex" });
