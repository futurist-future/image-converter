const spinner = () => {
  const spinning = ["|", "/", "-", "\\"];
  let counter = 0;
  return setInterval(() => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`${spinning[counter]} Processing Image`);

    if (counter > 2) {
      counter = 0;
    } else {
      counter++;
    }
  }, 100);
};

module.exports = spinner;
