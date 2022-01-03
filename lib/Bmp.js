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
   * @return {String} path to image
   */
  _whichPlatform() {
    if (process.platform === "win32") {
      return "\\";
    } else {
      return "/";
    }
  }

  /**
   *  Return the name of the file based on the image
   * @api private
   * @param {String} imagePath
   * @return {String} path to image
   */
  #getFileName(imagePath) {
    const pathSplit = String(imagePath).split(this.#dirSeparator);
    const fileName = pathSplit[pathSplit.length - 1];
    const fileTitle = fileName.split(".")[0];
    return fileTitle;
  }

  /**
   *  Return the data of the image based on its header and body
   * @api private
   * @param {String} imagePath
   * @return {Object} {header, width, height, body, bitDepth}
   */
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

  /**
   *  Output the altered image and return the path to the image
   * @api private
   * @param {String} imagePath
   * @param {String} imageData
   * @param {String} format
   * @return {Object} {header, width, height, body, bitDepth}
   */
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
   *      convert.bmp.sephia(pathToImage)
   *
   *      // Get the path to the image
   *      const outputPath = convert.bmp.sephia(pathToImage) // /dist/imageName-sephia.bmp
   *
   * @api public
   * @param {String} imagePath
   * @method bmp.sephia
   * @return {String} path to image
   */
  sephia(imagePath) {
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
   *      convert.bmp.greyscale(pathToImage)
   *
   *      // Get the path to the image
   *      const outputPath = convert.bmp.greyscale(pathToImage) // /dist/imageName-bnw.bmp
   * @api public
   * @param {String} imagePath
   * @method bmp.greyscale
   * @return {String} path to image
   */
  greyscale(imagePath) {
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

    return this.#printImage(imagePath, wholeFile, "greyscale");
  }

  /**
   * Invert bmp image horizontally
   * return the path of the image
   *
   * ### Use example:
   *
   *      const convert = require('image-convert');
   *      const path = require('path');
   *
   *      // Flipping the image horizontally
   *      convert.bmp.invert(pathToImage)
   *
   *      // Get the path to the image
   *      const outputPath = convert.bmp.invert(pathToImage) // /dist/imageName-bnw.bmp
   * @api public
   * @param {String} imagePath
   * @method bmp.greyscale
   * @return {String} path to image
   */
  // TODO: 24 depth
  invert(imagePath) {
    if (!imagePath) throw new SyntaxError("Please provide image path");

    const { body, header, bitDepth } = this.#processImage(imagePath);
    const arr = [];

    // In order to transform an image into bnw format
    // First we find the average of ff00ff color [255, 0, 255] which is 170
    // Then we transform 170 into 3 individual pieces, [170, 170, 170] and turn it into hex again which is b1b1b1
    // For 32-bit type, we dont include Alpha number at end, so its value remain the same
    body.forEach((row) => {
      row.forEach((pixel) => {
        let newHex = [];
        pixel.forEach((byte, index) => {
          if (index === 3) {
            newHex.push(byte);
          } else {
            newHex.push(decimalToHex(255 - hexToDecimal(byte)));
          }
        });
        arr.push(newHex);
      });
    });

    // Join the header and  body into one buffer
    const wholeFile = header.join("") + arr.flat(1).join("");

    return this.#printImage(imagePath, wholeFile, "invert");
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
   * @param {String} imagePath
   * @method bmp.reflect
   * @return {String} path to image
   */
  // TODO: reflect vertical
  // TODO: 24 depth
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
   * Blur the bmp image based on the blur amount
   * return the path of the image
   *
   * ### Use example:
   *
   *      const convert = require('image-convert');
   *      const path = require('path');
   *
   *      // Blur the image based on a specific level
   *      // There are 3 level to pick (small, medium, large)
   *      convert.bmp.blur(pathToImage, level)
   *
   *      // Get the path to the image
   *      const outputPath = convert.bmp.blur(pathToImage, level) // /dist/imageName-bnw.bmp
   * @api public
   * @param {String} imagePath
   * @param {"light" | "medium" | "heavy"} blurAmount
   * @method bmp.blur
   * @return {String} path to image
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

  /**
   * Detect the image of an image
   * return the path of the image
   *
   * ### Use example:
   *
   *      const convert = require('image-convert');
   *      const path = require('path');
   *
   *      // Detecting the edge image
   *      convert.bmp.edge(pathToImage)
   *
   *      // Get the path to the image
   *      const outputPath = convert.bmp.edge(pathToImage) // /dist/imageName-bnw.bmp
   * @api public
   * @param {String} imagePath
   * @method bmp.edge
   * @return {String} path to image
   */
  //TODO: 24 depth
  edge(imagePath) {
    const { body, header, bitDepth } = this.#processImage(imagePath);

    let arr = [];
    const edgeSobel = [
      [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
      ],
      [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1],
      ],
    ];
    /**
     * In finding the edge of an image, we use a method called sobel operator
     * You can understand the method better by accessing the link below
     * https://cs50.harvard.edu/college/2021/fall/psets/4/filter/more/sobel.png
     * Similiar to filter the image into blur
     * Instead of averaging the whole 3x3 pixel wide, we calculate it based on sobel operator
     * Then we take is sum for Gx and Gy
     * The way we calculate the new point is finding the square root of Gx^2 + Gy^2
     * If the a pixel is in the corner, you can assume that it also has a border of 0,0,0
     * Makes it 3x3 for all pixel
     */
    body.forEach((row, i) => {
      row.forEach((pixel, index) => {
        let edge = [
          { blue: 0, green: 0, red: 0 },
          { blue: 0, green: 0, red: 0 },
        ];

        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            if (!body[i + x] || !body[i + x][index + y]) continue;

            if (bitDepth === 4 && body[i + x][index + y].length < bitDepth) {
              break;
            }

            edge[0].blue +=
              hexToDecimal(body[i + x][index + y][0]) *
              edgeSobel[0][x + 1][y + 1];
            edge[0].green +=
              hexToDecimal(body[i + x][index + y][1]) *
              edgeSobel[0][x + 1][y + 1];
            edge[0].red +=
              hexToDecimal(body[i + x][index + y][2]) *
              edgeSobel[0][x + 1][y + 1];

            edge[1].blue +=
              hexToDecimal(body[i + x][index + y][0]) *
              edgeSobel[1][x + 1][y + 1];
            edge[1].green +=
              hexToDecimal(body[i + x][index + y][1]) *
              edgeSobel[1][x + 1][y + 1];
            edge[1].red +=
              hexToDecimal(body[i + x][index + y][2]) *
              edgeSobel[1][x + 1][y + 1];
          }
        }

        let newHex = { blue: 0, green: 0, red: 0 };

        newHex.blue = Math.floor(
          Math.sqrt(Math.pow(edge[0].blue, 2) + Math.pow(edge[1].blue, 2))
        );

        newHex.green = Math.floor(
          Math.sqrt(Math.pow(edge[0].green, 2) + Math.pow(edge[1].green, 2))
        );

        newHex.red = Math.floor(
          Math.sqrt(Math.pow(edge[0].red, 2) + Math.pow(edge[1].red, 2))
        );

        if (newHex.blue > 255) newHex.blue = 255;
        if (newHex.green > 255) newHex.green = 255;
        if (newHex.red > 255) newHex.red = 255;

        newHex.blue = decimalToHex(newHex.blue);
        newHex.green = decimalToHex(newHex.green);
        newHex.red = decimalToHex(newHex.red);

        if (bitDepth === 4)
          return arr.push([newHex.blue, newHex.green, newHex.red, pixel[3]]);
        arr.push([newHex.blue, newHex.green, newHex.red]);
      });
    });

    // Join the header and  body into one buffer and return the path to the image
    const wholeFile = header.join("") + arr.flat(1).join("");
    return this.#printImage(imagePath, wholeFile, "edge");
  }
  scale(imagePath, scale) {
    //TODO: Scale up image by taking scale as params
    return imagePath;
  }
  rotate(imagePath) {
    //TODO: Rotate image by by degree
    return imagePath;
  }
}

module.exports = Bmp;
