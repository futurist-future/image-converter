const splitPerIndex = (wordInput, indexInput) => {
  let word = String(wordInput);
  let index = Number(indexInput);

  let arr = [];
  let counter = 0;

  for (let i = 0; i < word.length; i += index) {
    arr.push(word.slice(counter, index + counter));
    counter += index;
  }

  return arr;
};

module.exports = splitPerIndex;
