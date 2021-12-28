const fs = require("fs");
const path = require("path");

const pathToFile = path.join(__dirname, "image.bmp");
const pathToOutput = (formatting) => {
  return path.join(__dirname, `bmp.txt`);
};

const imageData = fs.readFileSync(pathToFile, "hex");
fs.writeFileSync(pathToOutput("hex"), imageData);
