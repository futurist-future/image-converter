const { hexToDecimal, decimalToHex } = require("./hexConverter");
const {splitPerIndex} = require("./splitPerIndex");

const littleEndian = (hex) => {
  const diviedHex = splitPerIndex(hex).map((value) => hexToDecimal(value));
  const sortedHex = diviedHex.sort((a, b) => a - b);
  const filteredHex = sortedHex.filter((value) => value !== 0);
  const newHex = filteredHex.map((value) => decimalToHex(value)).join("");
  return newHex;
};

module.exports = littleEndian;
