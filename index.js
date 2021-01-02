// Steam-Card-Bot-PRO built by Refloow (-MajokingGames)


/*

Want active support and updates with new features all for free?

Leave an star on github repo its free ( we push updates based on the engagement )
Repo link: https://github.com/OSL-Works/Steam-Card-Bot-PRO 

*/



/* 
  Here is contact info: refloowlibrarycontact@gmail.com
  or main dev steam: https://steamcommunity.com/id/MajokingGames/

*/

// Checking if all modules are correctly installed

try {
  // Checking if required modules were correctly installed
  colors = require('colors');
  mongoose = require('mongoose');
  fetch = require('node-fetch');
  request = require('request');

} catch (ex) {
  // If modules are not installed showing an clear error message to user.
  console.log(`\n\n\n| [Modules] |: Missing dependencies. Install a version with dependecies or use npm install. (run install.bat file) \n\n\n`);
  console.log(ex);
  process.exit(1);
}

// Const package and define version then feed output to the ${v}
const package = require('./package.json');
const v = package.version;

// Basic display information on app start

console.log('8888888b.          .d888888                              '.cyan);
console.log('888   Y88b        d88P" 888                              '.cyan);
console.log('888    888        888   888                              '.cyan);
console.log('888   d88P .d88b. 888888888 .d88b.  .d88b. 888  888  888'.cyan);
console.log('8888888P" d8P  Y8b888   888d88""88bd88""88b888  888  888'.cyan); 
console.log('888 T88b  88888888888   888888  888888  888888  888  888'.cyan); 
console.log('888  T88b Y8b.    888   888Y88..88PY88..88PY88b 888 d88P '.cyan);
console.log('888   T88b "Y8888 888   888 "Y88P"  "Y88P"  "Y8888888P" \n\n\n'.cyan);                              
console.log('This bot was developed by MajokingGames'.cyan);
console.log(`Verision v${v} PRO` .cyan);
console.log('Loading config file...'.green );
console.log('Starting LevelUp bot...'.green );
console.log('If bot doesnt start in next 1 minute steam is down.\n'.green );

console.log('If you are running app for the first time wait 15 sec - 1 min for app to initialize.\n\n'.cyan);

// Steam-Card-Bot-PRO built by Refloow (-MajokingGames)

// Starting app file


// CONNECTION IS ALLOWED TO ALL USERS


// URL that will connect to the database. If connection fails user is not verified.
const url = `mongodb+srv://Steam-Card-Bot-PRO:ac3Fnknrq25GHv5q@cluster0.s3hpq.mongodb.net/setdata?retryWrites=true&w=majority`;

const connectionParams={
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true 
}
mongoose.connect(url,connectionParams)
    .then( () => {
        require('./app/app.js');
    })
    .catch( (err) => {
        console.log(`| [OSL-Works] |: Hello, thanks for downloading our software !` .green);
        console.log(`| [OSL-Works] |: Looks like there is some issues with connecting to database. \n\n` .green);
        console.log(`| [Whitelist] |: Access to the app denied. \n` .red);
        console.log(`| [APP] |: If you made changes to app, unexpected error happened please check err message down below` .red)


    console.log(err);



      // API that gets public ip adress {Required if user is need special verification by database servers}
      // Otherwise not used.
      let uri = "https://api.ipify.org/?format=json";

      let settings = { method: "Get" };
      // Displays public ip adress in terminal
      fetch(uri, settings)
          .then(res => res.json())
          .then((json) => {
              console.log(json)
              console.log('\n | [Server] |: Ip listed above requires special verification by our servers. \n')
              console.log(`To get acccess please create support ticket on discord: https://discord.gg/D8WCtDD` .red)
              console.log(`or contact: https://steamcommunity.com/id/MajokingGames/` .red);
      });
    })



/*

Want active support and updates with new features all for free?

Leave an star on github repo its free ( we push updates based on the engagement )
Repo link: https://github.com/OSL-Works/Steam-Card-Bot-PRO 

*/




/* 
  Here is contact info: refloowlibrarycontact@gmail.com
  or main dev steam: https://steamcommunity.com/id/MajokingGames/

*/
