const fs = require("fs");
const path = require("path");
const hexAverage = require("./hexAverage");
const { hexToDecimal, decimalToHex } = require("./hexConverter");
const spinner = require("./spinner");
const slicePerIndex = require("./splitPerIndex");

const sephiaCalculation = {
  red: [0.393, 0.769, 0.189],
  green: [0.349, 0.686, 0.168],
  blue: [0.272, 0.534, 0.131],
};

class Bmp {
  #dirSeparator;
  constructor() {
    this.#dirSeparator = this.#whichPlatform();
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
  #getFileName(imagePath) {
    const pathSplit = String(imagePath).split(this.#dirSeparator);
    const fileName = pathSplit[pathSplit.length - 1];
    const fileTitle = fileName.split(".")[0];
    return fileTitle;
  }

  #processImage(imagePath) {
    if (!imagePath.endsWith(".bmp")) throw new SyntaxError("Image is not valid bmp format")


    // Image format can be read with hex encoding
    const imageData = fs.readFileSync(imagePath, "hex");
    const dataString = String(imageData);

    // The header length for bmp file can be found in index 28 to 29
    const headerLength =
      hexToDecimal(dataString.slice(28, 30)) === 124 ? 124 : 108;

    // The header differ from one bmp format to another. 24-bit bmp file header is 108 and 32-bit bmp file header is 124
    const header =
      headerLength === 124
        ? dataString.slice(0, 124)
        : dataString.slice(0, 108);
    const body =
      headerLength === 124 ? dataString.slice(124) : dataString.slice(108);

    // The 24-bit bmp file format color contain of BGR(Blue , Green , Red) Hex Color.
    // The 32-bit bmp file format color contain of BGRA(Blue , Green , Red, Alpha) Hex Color. For those who are wondering, Alpha is opactity in hex color
    const colorLength = header.length === 124 ? 8 : 6;

    return {
      header,
      body,
      colorLength,
    };
  }

  #printImage(imagePath, imageData, format) {
    // Image is stored in dist directory
    const pathToOutput = path.resolve(__dirname, "..", "dist");

    // Check if user have output folder. If not create one
    if (!fs.existsSync(pathToOutput)) {
      fs.mkdirSync(pathToOutput, { recursive: true });
    }

    const filePath =
      pathToOutput +
      `${this.#dirSeparator}${this.#getFileName(imagePath)}-${format}.bmp`;

    // Write the new image into dist directory with hex encoding again
    fs.writeFileSync(filePath, imageData, {
      encoding: "hex",
    });

    // Return the path to the image
    return filePath;
  }

  /**
   * Turn BMP image into Sephia format
   * Return the path of the image
   *
   * ### Use example:
   *
   *      const convert = require('image-convert');
   *      const path = require('path');
   *
   *      // Identify image path
   *      const pathToImage = path.join(__dirname, 'example.bmp');
   *
   *      // Turn image into Sephia format to dist directory
   *      convert.bmp.toSephia(pathToImage)
   *
   *      // Get the path to the image
   *      const outputPath = convert.bmp.toSephia(pathToImage) // /dist/imageName-sephia.bmp
   *
   * @api public
   * @method bmp.toBnW
   * @returns string
   */
  toSephia(imagePath) {
    if (!imagePath) throw new SyntaxError("Please provide image path");

    const { body, header, colorLength } = this.#processImage(imagePath);

    let counter = 0;
    const arr = [];

    // At first we divide the body into individual hexcode color set (BGR or BGRA).
    // The we calculate the new hex point of the 3 hex color (Combining B G R into single point)
    // For example we have ff00ff as a color, which in decimal can be calculated as 255, 0, 255
    // Then the new value is presented below
    // sepiaRed = .393 * originalRed + .769 * originalGreen + .189 * originalBlue
    // sepiaGreen = .349 * originalRed + .686 * originalGreen + .168 * originalBlue
    // sepiaBlue = .272 * originalRed + .534 * originalGreen + .131 * originalBlue
    // If the value happen to be above 255, we make it saty on 255 to avoid error
    for (let i = 0; i < body.length; i += colorLength) {
      let current = body.slice(counter, counter + colorLength);
      let colors = slicePerIndex(current, 2);
      const colorsDecimal = colors.map((color, index, colors) => {
        const currentColor =
          index === 0 ? "blue" : index === 1 ? "green" : "red";
        let sephia = Math.round(
          sephiaCalculation[currentColor][0] * hexToDecimal(colors[2]) +
            sephiaCalculation[currentColor][1] * hexToDecimal(colors[1]) +
            sephiaCalculation[currentColor][2] * hexToDecimal(colors[0])
        );

        if (sephia > 255) {
          sephia = 255;
        }

        return decimalToHex(sephia);
      });

      arr.push(colorsDecimal.join(""));
      counter += colorLength;
    }

    // Join the header and body into one buffer
    const wholeFile = header + arr.join("");

    // Return the path to the image
    return this.#printImage(imagePath, wholeFile, "sephia");
  }

  /**
   * Turn BMP image into Black and White format
   * return the path of the image
   *
   * ### Use example:
   *
   *      const convert = require('image-convert');
   *      const path = require('path');
   *
   *      // Turn image into black and white format to dist directory
   *      convert.bmp.toBnw(pathToImage)
   *
   *      // Get the path to the image
   *      const outputPath = convert.bmp.toBnw(pathToImage) // /dist/imageName-bnw.bmp
   * @api public
   * @method bmp.toBnW
   * @returns string
   */
  toBnW(imagePath) {
    if (!imagePath) throw new SyntaxError("Please provide image path");

    const { body, header, colorLength } = this.#processImage(imagePath);

    let counter = 0;
    const arr = [];

    // At first we divide the body into individual hexcode color set (BGR or BGRA).
    // The we calculate the average point of the 3 hex color (Combining B G R into single point)
    // For example we have ff00ff as a color, which in decimal can be calculated as 255, 0, 255
    // Then we find the average of ff00ff color (255, 0, 255) which is 170
    // Then we transform 170  into 3 individual pieces, [170, 170, 170] and turn it into hex again which is b1b1b1
    // For 32-bit type, we dont include Alpha number at end, so its value remain the same
    for (let i = 0; i < body.length; i += colorLength) {
      let current = body.slice(counter, counter + colorLength);
      arr.push(hexAverage(current, header.length));
      counter += colorLength;
    }

    // Join the header and  body into one buffer
    const wholeFile = header + arr.join("");
    return this.#printImage(imagePath, wholeFile, "bnw");
  }
}

module.exports = Bmp;
