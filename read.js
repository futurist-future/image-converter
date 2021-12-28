const fs = require("fs");
const path = require("path");

// const pathToFile = path.join(__dirname, "bmp.txt");

// const imageData = fs.readFileSync(pathToFile, "utf8");
// const pathToOuput = path.join(__dirname, `imagebmp.json`);

// fs.writeFileSync(pathToOuput, JSON.stringify(imageData));

const pathToFile = path.join(__dirname, "imagebmp.json");
const imageData = fs.readFileSync(pathToFile, "utf8");
const pathToOuput = path.join(__dirname, `imagebmpdata.json`);

const imageParse = JSON.parse(imageData);
const header = imageParse.slice(0, 108);
const body = imageParse.slice(108);
const bodyString = new String(body);

let counter = 0;
let LENGTH = 6;
const arr = [];
for (let i = 0; i < bodyString.length; i++) {
  let current = bodyString.slice(counter, counter + LENGTH);
  arr.push(current);
}

fs.writeFileSync(pathToOuput, JSON.stringify(arr));

// const bodyParse = JSON.parse(body);
// console.log(bodyParse.length / 6);

// fs.writeFileSync(pathToOuput, JSON.stringify(body.split("19ff49")));
// const imageDataArr = new Array(JSON.parse(imageData))[0];
// console.log(imageDataArr.filter((data) => data.startsWith("da")));

// console.log(
//   "424df6ee0500000000003600000028000000e00100000e0100000100180000000000c0ee0500c40e0000c40e00000000000000000000"
//     .length
// );
