// Steam-Card-Bot-PRO built by Refloow (-MajokingGames)


/*

Want active support and updates with new features all for free?

Leave an star on github repo its free ( we push updates based on the engagement )
Repo link: https://github.com/OSL-Works/Steam-Card-Bot-PRO 

*/



/* 
  Here is contact info: refloowlibrarycontact@gmail.com
  Discord Support Server: https://discord.gg/D8WCtDD     (Open an ticket)
  or main dev steam: https://steamcommunity.com/id/MajokingGames/

*/

// This here is for dev log chat colors and formating at all in CMD logs.

try {
    // Checking if module winston is correctly installed
    winston = require('winston');
} catch (ex) {
  // Loging error 
    console.log('\n\n\n | [Modules] |: Missing dependencies. Run install.bat file or use npm install.\n\n\n');
    console.log(ex);
    process.exit(1);
}

const level ={
  false: 0,
  true: 1,
  fail: 2,
  new: 3,
  info: 4,
  summary:5
};
const colors = {
    false: 'bold red',
    true: 'bold green',
    fail: 'red',
    new: 'underline gray',
    info: 'yellow',
	summary: 'cyan'
	};

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
    new winston.transports.Console({level:'summary'})
  ],
  level: 'info'
});

// Steam-Card-Bot-PRO built by Refloow (-MajokingGames)


/*

Want active support and updates with new features all for free?

Leave an star on github repo its free ( we push updates based on the engagement )
Repo link: https://github.com/OSL-Works/Steam-Card-Bot-PRO 

*/



/* 
  Here is contact info: refloowlibrarycontact@gmail.com
  Discord Support Server: https://discord.gg/D8WCtDD     (Open an ticket)
  or main dev steam: https://steamcommunity.com/id/MajokingGames/

*/
