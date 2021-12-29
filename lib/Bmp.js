const fs = require("fs");
const path = require("path");
const hexAverage = require("./hexAverage");
const { hexToDecimal } = require("./hexConverter");

class Bmp {
  #dirSeparator;
  #fileName;
  constructor(imagePath) {
    this.path = imagePath;
    this.#dirSeparator = this.#whichPlatform();
    this.#fileName = this.#getFileName();
  }

  /**
   * This function try to identify which os the user use
   * The separator for directory on win and unix differ
   * Windows use \ as separator, and Unix use / as a separator
   * @api private
   * @returns string
   */
  #whichPlatform() {
    if (process.platform === "win32") {
      return "\\";
    } else {
      return "/";
    }
  }

  /**
   *
   * @api private
   * @returns string
   */
  #getFileName() {
    const pathSplit = String(this.path).split(this.#dirSeparator);
    const fileName = pathSplit[pathSplit.length - 1];
    const fileTitle = fileName.split(".")[0];
    return fileTitle;
  }

  /**
   * Turn BMP image into Black and White format
   * First you must identify the path to the file first and create a new Class
   * Then implement the .bmp.toBnW()
   *
   * ### Use example:
   *
   *      const Convert = require('image-convert');
   *      const path = require('path');
   *
   *      // Identify image path
   *      const pathToImage = path.join(__dirname, 'example.bmp');
   *      const image = new Convert(pathToImage);
   *
   *      // Turn image into black and white format to dist directory
   *      image.bmp.toBnW();
   * @method bmp.toBnW
   * @returns void
   */
  toBnW() {
    // Image format can be read with hex encoding
    const imageData = fs.readFileSync(this.path, "hex");
    const dataString = String(imageData);

    // The header length for bmp file can be found in index 28 to 29
    let headerLength;
    if (hexToDecimal(dataString.slice(28, 30)) === 124) {
      headerLength = 124;
    } else {
      headerLength = 108;
    }

    // The header differ from one bmp format to another. 24-bit bmp file header is 108 and 32-bit bmp file header is 124
    const header =
      headerLength === 124
        ? dataString.slice(0, 124)
        : dataString.slice(0, 108);
    const body =
      headerLength === 124 ? dataString.slice(124) : dataString.slice(108);

    let counter = 0;
    const arr = [];

    // The 24-bit bmp file format color contain of BGR(Blue , Green , Red) Hex Color.
    // The 32-bit bmp file format color contain of BGRA(Blue , Green , Red, Alpha) Hex Color. For those who are wondering, Alpha is opactity in hex color
    let LENGTH = headerLength === 124 ? 8 : 6;

    // At first we divide the body into individual hexcode color set (BGR or BGRA).
    // The we calculate the average point of the 3 hex color (Combining B G R into single point)
    // For example we have ff00ff as a color, which in decimal can be calculated as 255, 0, 255
    // Then we find the average of ff00ff color (255, 0, 255) which is 170
    // Then we transform 170  into 3 individual pieces, [170, 170, 170] and turn it into hex again which is b1b1b1
    // For 32-bit type, we dont include Alpha number at end, so its value remain the same
    for (let i = 0; i < body.length; i += LENGTH) {
      let current = body.slice(counter, counter + LENGTH);
      arr.push(hexAverage(current, headerLength));
      counter += LENGTH;
    }

    // Join the header and body into one buffer
    const wholeFile = header + arr.join("");
    const pathToOutput = path.resolve(__dirname, "..", "dist");

    // Check if user have output folder. If not create one
    if (!fs.existsSync(pathToOutput)) {
      fs.mkdirSync(pathToOutput, { recursive: true });
    }

    // Write the new image into dist directory with hex encoding again
    fs.writeFileSync(
      pathToOutput + `${this.#dirSeparator}${this.#fileName}BnW.bmp`,
      wholeFile,
      {
        encoding: "hex",
      }
    );
  }
}

module.exports = Bmp;