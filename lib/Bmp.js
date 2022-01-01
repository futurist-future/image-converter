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
    const body = dataHex.slice(startData);

    const width = hexToDecimal(littleEndian(header.slice(18, 22).join("")));
    const height = hexToDecimal(littleEndian(header.slice(22, 26).join("")));
    // The 24-bit bmp file format color contain of BGR(Blue , Green , Red) Hex Color.
    // The 32-bit bmp file format color contain of BGRA(Blue , Green , Red, Alpha) Hex Color. For those who are wondering, Alpha is opactity in hex color
    const bitDepth = hexToDecimal(littleEndian(header.slice(28, 30).join("")));

    const rows = splitIntoPart(body, height);
    const rowsColor = rows.map((row) => {
      return splitPerIndex(row, bitDepth / 8);
    });

    return {
      header,
      width,
      height,
      body: rowsColor,
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

  /**
   * Flip bmp image horizontally
   * return the path of the image
   *
   * ### Use example:
   *
   *      const convert = require('image-convert');
   *      const path = require('path');
   *
   *      // Flip the image horizontally
   *      convert.bmp.reflect(pathToImage)
   *
   *      // Get the path to the image
   *      const outputPath = convert.bmp.blur(pathToImage) // /dist/imageName-bnw.bmp
   * @api public
   * @method bmp.reflect
   * @returns string
   */
  reflect(imagePath) {
    const { body, header, bitDepth } = this.#processImage(imagePath);

    let arr = [];
    let reserved;

    // We get the last element of the row and makes it the first element
    body.forEach((row, i) => {
      row.forEach((pixel, index) => {
        if (bitDepth === 3 && index == 0) {
          return;
        }
        arr.push(row[row.length - index - 1]);
      });
      if (bitDepth === 3) arr.push(row[row.length - 1]);
    });

    // Join the header and  body into one buffer and return the path to the image
    const wholeFile = header.join("") + arr.flat(1).join("");
    return this.#printImage(imagePath, wholeFile, "reflect");
  }

  /**
   * Blur the bmp image
   * return the path of the image
   *
   * ### Use example:
   *
   *      const convert = require('image-convert');
   *      const path = require('path');
   *
   *      // Blur the image
   *      convert.bmp.blur(pathToImage)
   *
   *      // Get the path to the image
   *      const outputPath = convert.bmp.blur(pathToImage) // /dist/imageName-bnw.bmp
   * @api public
   * @method bmp.reflect
   * @returns string
   */
  blur(imagePath, blurAmount) {
    const { body, header, bitDepth } = this.#processImage(imagePath);

    let amount = blurAmount || 2;
    let arr = [];
    let c = 0;

    // The way blur works is that it average the color of surrounding pixel in 3x3 radius
    // If the pixel happen to be in the corner, than it average its surrounding (can be 4 or 6)
    body.forEach((row, i) => {
      row.forEach((pixel, index) => {
        c += pixel.length;
        let average = { blue: 0, green: 0, red: 0 };
        let counter = 0;
        for (let x = -amount; x <= amount; x++) {
          for (let y = -amount; y <= amount; y++) {
            if (!body[i + x] || !body[i + x][index + y]) continue;

            // console.log(body[i + x][index + y]);

            if (bitDepth === 4 && body[i + x][index + y].length < bitDepth) {
              break;
            }
            average.blue += hexToDecimal(body[i + x][index + y][0]);
            average.green += hexToDecimal(body[i + x][index + y][1]);
            average.red += hexToDecimal(body[i + x][index + y][2]);
            counter++;
          }
        }
        // console.log(counter, `row: ${i}, column:${index}`);

        average.blue = decimalToHex(Math.floor(average.blue / counter));
        average.green = decimalToHex(Math.floor(average.green / counter));
        average.red = decimalToHex(Math.floor(average.red / counter));

        if (bitDepth === 4)
          return arr.push([average.blue, average.green, average.red, pixel[3]]);
        arr.push([average.blue, average.green, average.red]);
      });

      // console.log(`currently on: `, c);
      // console.log(arr.flat(1).length);

      if (bitDepth === 3) arr.push(row[row.length - 1]);
    });

    // console.log(arr.flat(1));

    // Join the header and  body into one buffer and return the path to the image
    const wholeFile = header.join("") + arr.flat(1).join("");
    return this.#printImage(imagePath, wholeFile, "blur");
  }
}

module.exports = Bmp;
