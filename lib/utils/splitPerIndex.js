const splitPerIndex = (input, indexInput) => {
  let word;
  if (typeof input === "string") {
    word = String(input);
  } else {
    word = input;
  }

  const index = Number(indexInput) || 2;

  let arr = [];
  let counter = 0;

  for (let i = 0; i < word.length; i += index) {
    arr.push(word.slice(counter, index + counter));
    counter += index;
  }
  counter = 0;

  return arr;
};

const splitIntoPart = (input, splitPart) => {
  let part = splitPart || 2;
  let arr = [];

  if (input.length < splitPart) {
    throw new SyntaxError("The input length is less than split part");
  }

  if (input.length % part !== 0) {
    for (let i = 0; i < part; i++) {
      let insideArr = [];
      for (let j = 0; j < Math.floor(input.length / part); j++) {
        insideArr.push(input[i * Math.floor(input.length / part) + j]);
      }
      if (i === part - 1) {
        for (let j = 0; j < input.length % part; j++) {
          insideArr.push(
            input[
              i * Math.floor(input.length / part) +
                j +
                Math.floor(input.length / part)
            ]
          );
        }
      }
      arr.push(insideArr);
      insideArr = [];
    }
  } else {
    for (let i = 0; i < part; i++) {
      let insideArr = [];
      for (let j = 0; j < input.length / part; j++) {
        insideArr.push(input[(i * input.length) / part + j]);
      }
      arr.push(insideArr);
      insideArr = [];
    }
  }

  return arr;
};

module.exports = { splitPerIndex, splitIntoPart };
