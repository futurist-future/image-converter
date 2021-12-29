const Bmp = require("./Bmp");

class Convert {
  constructor(imagePath) {
    this.path = imagePath;
    this.bmp = this.#formatBmp();
  }
  #formatBmp() {
    const bmpClass = new Bmp(this.path);
    return bmpClass;
  }
}

module.exports = Convert;
