const Bmp = require("./Bmp");

class Convert {
  constructor() {
    this.bmp = this.#formatBmp();
  }
  #formatBmp() {
    const bmpClass = new Bmp();
    return bmpClass;
  }
}

module.exports = Convert;
