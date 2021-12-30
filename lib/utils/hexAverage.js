const splitPerIndex = require("./splitPerIndex");
const { hexToDecimal, decimalToHex } = require("./hexConverter");

// Calculate the average point of RGB.
// This function can be used to turn image into greyscale
const hexAverage = (hexInput, headerLength) => {
  // For now, any hex digit that represent number will throw error cause I currently dont have any converter for that lolll
  if (typeof hexInput !== "object") {
    throw new SyntaxError("Hex must be in array");
  }

  const hexArr = hexInput;

  const RGB_LENGTH = headerLength === 124 ? 4 : 3;

  if (hexArr.length !== RGB_LENGTH) {
    return;
  }

  // Turn array of hex code into array of decimals to find average
  const decimalArr = hexArr.map((value, index) => {
    if (index === 3) return value;
    return hexToDecimal(value);
  });

  if (RGB_LENGTH === 8) {
    const newArr = [decimalArr[0], decimalArr[1], decimalArr[2]];
    const totalDecimal = newArr.reduce((prev, current) => prev + current);
    const averageDecimal = Math.round(totalDecimal / 3);
    const hexAverage = decimalToHex(averageDecimal);
    return hexAverage + hexAverage + hexAverage + decimalArr[3];
  }

  // Calculate the total decimal of array and find its average
  const totalDecimal = decimalArr.reduce((prev, current) => prev + current);
  const averageDecimal = Math.round(totalDecimal / 3);

  // Turn back the decimal number into hex
  const hexAverage = decimalToHex(averageDecimal);
  return hexAverage + hexAverage + hexAverage;
};

module.exports = hexAverage;
