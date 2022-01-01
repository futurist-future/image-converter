const fs = require("fs");
const path = require("path");
const littleEndian = require("./utils/endian");
const hexAverage = require("./utils/hexAverage");
const { hexToDecimal, decimalToHex } = require("./utils/hexConverter");
const { splitPerIndex, splitIntoPart } = require("./utils/splitPerIndex");

const sephiaCalculation = {
  red: [0.393, 0.769, 0.189],
  green: [0.349, 0.686, 0.168],
  blue: [0.272, 0.534, 0.131],
};

class Bmp {
  #dirSeparator;
  constructor() {
    this.#dirSeparator = this._whichPlatform();
  }

  /**
   * This function try to identify which os the user use
   * The separator for directory on win and unix differ
   * Windows use \ as separator, and Unix use / as a separator
   * @api private
   * @returns string
   */
  _whichPlatform() {
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
    if (!imagePath.endsWith(".bmp"))
      throw new SyntaxError("Image is not valid bmp format");

    // Image format can be read with hex encoding
    const imageData = fs.readFileSync(imagePath, "hex");
    const dataString = String(imageData);

    const dataHex = splitPerIndex(dataString, 2);
    const startData = hexToDecimal(
      littleEndian(dataHex.slice(10, 14).join(""))
    );

    // The header differ from one bmp format to another. 24-bit bmp file header is 108 and 32-bit bmp file header is 124
    const header = dataHex.slice(0, startData);

    const width = hexToDecimal(littleEndian(header.slice(18, 22).join("")));
    const height = hexToDecimal(littleEndian(header.slice(22, 26).join("")));
    // The 24-bit bmp file format color contain of BGR(Blue , Green , Red) Hex Color.
    // The 32-bit bmp file format color contain of BGRA(Blue , Green , Red, Alpha) Hex Color. For those who are wondering, Alpha is opactity in hex color
    const bitDepth = hexToDecimal(littleEndian(header.slice(28, 30).join("")));

    const body = dataHex.slice(startData);

    let adder = 1;
    for (let i = 1; i <= 32; i++) {
      if (((width + i) / 32) % 1 === 0) {
        adder = i;
        break;
      }
    }

    const bodyDivided = splitPerIndex(body, bitDepth / 8);
    const splited = splitIntoPart(bodyDivided, height);

    return {
      header,
      width,
      height,
      body: splited,
      bitDepth: bitDepth / 8,
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

    const { body, header, bitDepth } = this.#processImage(imagePath);

    const arr = [];

    // For example we have ff00ff as a color, which in decimal can be calculated as 255, 0, 255
    // Then the new value is presented below
    // sepiaRed = .393 * originalRed + .769 * originalGreen + .189 * originalBlue
    // sepiaGreen = .349 * originalRed + .686 * originalGreen + .168 * originalBlue
    // sepiaBlue = .272 * originalRed + .534 * originalGreen + .131 * originalBlue
    // If the value happen to be beyond 255, we make it saty on 255 to avoid error
    body.forEach((row) =>
      row.forEach((pixel) => {
        if (pixel.length < bitDepth) {
          return pixel;
        }
        const colorsDecimal = pixel.map((color, index, colors) => {
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
      })
    );

    // Join the header and body into one buffer
    const wholeFile = header.join("") + arr.join("");

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

    const { body, header, bitDepth } = this.#processImage(imagePath);
    const arr = [];

    // In order to transform an image into bnw format
    // First we find the average of ff00ff color [255, 0, 255] which is 170
    // Then we transform 170 into 3 individual pieces, [170, 170, 170] and turn it into hex again which is b1b1b1
    // For 32-bit type, we dont include Alpha number at end, so its value remain the same
    body.forEach((row) => {
      row.forEach((pixel) => {
        arr.push(hexAverage(pixel, bitDepth));
      });
    });

    // Join the header and  body into one buffer
    const wholeFile = header.join("") + arr.join("");

    return this.#printImage(imagePath, wholeFile, "bnw");
  }

  reflect(imagePath) {
    const { body, header, bitDepth, width, height } =
      this.#processImage(imagePath);

    let arr = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        arr.push(body[y][width - x - 1]);
      }
    }

    // Join the header and  body into one buffer
    const wholeFile = header.join("") + arr.flat(1).join("");

    return this.#printImage(imagePath, wholeFile, "reflect");
  }
}

module.exports = Bmp;
