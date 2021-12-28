const assert = require("assert");
const hexToDecimal = require("../hexConverter");

describe("Convert hex to Nominal", () => {
  it("1+1 = 2", () => {
    assert.equal(1 + 1, 2);
  });

  it("Test with string", () => {
    const number = 0xff;

    assert.equal(hexToDecimal(number), 255);
    assert.equal(typeof hexToDecimal(number), "number");
  });

  it("Test hex with string", () => {
    assert.equal(hexToDecimal("0xff"), 255);
    assert.equal(typeof hexToDecimal("0xff"), "number");
  });
});
