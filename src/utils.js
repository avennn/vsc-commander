const { execFile } = require('child_process');

function runCommand(file, args) {
  return new Promise((resolve, reject) => {
    execFile(file, args, (error, stdout) => {
      if (error) {
        return reject(error);
      }
      return resolve(stdout);
    });
  });
}

const logger = {
  // eslint-disable-next-line no-console
  log: console.log,
  // eslint-disable-next-line no-console
  error: console.error,
};

module.exports = {
  runCommand,
  logger,
};
