const hexCode = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  a: 10,
  b: 11,
  c: 12,
  d: 13,
  e: 14,
  f: 15,
};

// Convert hex into decimals integer
const hexToDecimal = (hex) => {
  if (typeof hex === "string" && hex.startsWith("0x")) {
    const hexNumber = Number(hex);
    if (!hexNumber) throw new SyntaxError("must be hex");
    return hexNumber;
  }

  if (typeof hex === "number") {
    return hex;
  }

  const hexString = String(hex);
  const hexArr = hexString.split("");

  const total = hexArr.reduce(
    (prev, current, index) =>
      prev +
      hexCode[current.toLocaleLowerCase()] * 16 ** (hexArr.length - index - 1),
    0
  );
  return total;
};


// Turn decimal number into hex
// Can only serve number below 256 for now
const decimalToHex = (numberInput) => {
  let number = Number(numberInput);
  const first = Math.floor(number / 16);
  const second = number % 16;

  const firstHex = Object.keys(hexCode).find((key) => hexCode[key] === first);
  const secondHex = Object.keys(hexCode).find((key) => hexCode[key] === second);

  if (first < 1) {
    return "00";
  }

  return `${firstHex}${secondHex}`;
};

module.exports = { hexToDecimal, decimalToHex };
