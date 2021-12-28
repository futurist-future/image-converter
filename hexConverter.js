const hexNominal = {
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
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
};

// Convert hex into decimals
const hexToDecimal = (hex) => {
  if (typeof hex === "string" && hex.startsWith("0x")) {
    const hexNumber = Number(hex);
    if (!hexNumber) throw new SyntaxError("must be hex");
    return hexNumber;
  }

  if (typeof hex === "number") {
    return hex;
  }
  // const hexLength = hex.length;
  // const arr = [];
  // const HEX_LENGTH = 2;

  // if (hexLength < HEX_LENGTH) {
  //   const hexUpperCase = new String(hex).toUpperCase();
  //   return hexNominal[hexUpperCase];
  // }

  // if (hexLength === HEX_LENGTH) {
  //   if (!hexNominal[hex[0]]) throw new SyntaxError("must be hex");
  // }

  let total = 0;

  const hexString = String(hex);
  const hexArr = hexString.split("");
  hexArr.forEach((value, index) => {
    total +=
      hexNominal[value.toUpperCase()] * 16 ** (hexArr.length - index - 1);
  });

  console.log(totali);

  return total;
};

const utf = hexToDecimal("ff");

// const utf = hexToDecimal("19ff49");

console.log(utf);
