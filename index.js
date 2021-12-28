const fs = require("fs");
const path = require("path");

const pathToFile = path.join(__dirname, "duck.bmp");
const imageData = fs.readFileSync(pathToFile, { encoding: "hex" });
fs.writeFileSync("z.bmp", imageData);

