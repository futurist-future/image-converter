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

  return arr;
};

module.exports = splitPerIndex;
