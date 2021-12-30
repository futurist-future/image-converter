const assert = require("assert");
const { hexToDecimal } = require("../lib/utils/hexConverter");

describe("Convert hex to Nominal", () => {
  const numbers = [0xff, 0xaf, 0x00, 0x000000, 0xaaaa, 0x123];

  afterEach(() => {
    assert.equal(typeof hexToDecimal("0xff"), "number");
  });

  it("Test with hex", () => {
    numbers.forEach((number) => {
      assert.equal(hexToDecimal(number), number);
    });
  });

  it("Test hex with string", () => {
    assert.equal(hexToDecimal("0xff"), 255);
  });
});
