
// This here is for dev log chat colors and formating at all in CMD logs.

const winston = require('winston');
const level ={
  false: 0,
  true: 1,
  fail: 2,
  new: 3,
  info: 4
};
const colors = {
    false: 'bold red',
    true: 'bold green',
    fail: 'red',
    new: 'underline green',
    info: 'yellow'};

winston.addColors(colors);
const logger = module.exports = winston.createLogger({
  levels: level,
  format: winston.format.combine(
    winston.format.colorize({message: true}),
    winston.format.timestamp({
      format: 'HH:mm:ss'
    }),
    winston.format.printf(info => `${info.timestamp}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console()
  ],
  level: 'info'
});