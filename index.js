
// Copyright notice:

/*--------------------------------------------------------------------------------------------- 
* Original work: Copyright (c) 2020-2021 Refloow All rights reserved.

* Code origin: https://github.com/OSL-Works/Steam-Card-Bot-PRO
* Developer name: Veljko Vuckovic
* Licensed under the MIT License. See LICENSE in the project root for license information.
* Published License: https://github.com/OSL-Works/Steam-Card-Bot-PRO/master/LICENSE

* Contact information:
  Discord Support Server: https://discord.gg/D8WCtDD
  Main developer steam: https://steamcommunity.com/id/MajokingGames/ 
  Mail: refloowlibrarycontact@gmail.com

* Donations:
  Donate: https://ko-fi.com/refloow
 --------------------------------------------------------------------------------------------*/

 /* 

// legal advice: PERMISSIONS AND RIGHTS

* License does not prohibit modification, distribution, private/commercial use or sale of copies as long as the original LICENSE file
 and authors copyright notice are left ass they are in the project files.
* Copyright notice could be included ones or multiple times within the file.
* Copyright notice should not be removed even within the larger works (Larger modifications applied).
* Original file tags cannot be removed without creators exclusive permission.
* Adding own tags in files is possible in case of modification - even in that case original tags must be kept.
* Year on the copyright notice breakdown:
* Generally, the “year of first publication of the work” refers to the year in which the work was first distributed to the public (first year mentioned)
* Any year after represents the year of added modifications.
* Copyright cannot expire so therefore you cannot remove copyright notice if its not updated to the latest year.
* Editing existing copyright notice(s) is also prohibited.

===================================================================================
Removing copyright notice & distributing, using or selling the software without
the original license and copyright notice is licence agreement breach and its considered criminal offense and piracy.
===================================================================================

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
const config = require('./app/SETTINGS/config.js');
const v = package.version;

function initialize() {
// Basic display information on app start

// ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
/////////////////////////////////////////////////////////////////////

// COPYRIGHT NOTICE. DO NOT EDIT & REMOVE
//  ONES AGAIN:

//       Removing copyright notice & distributing, using or selling the software without
// the original license and notice above is license agreement breach and its considered criminal offense.

console.log('8888888b.          .d888888                              '.cyan);
console.log('888   Y88b        d88P" 888                              '.cyan);
console.log('888    888        888   888                              '.cyan);
console.log('888   d88P .d88b. 888888888 .d88b.  .d88b. 888  888  888'.cyan);
console.log('8888888P" d8P  Y8b888   888d88""88bd88""88b888  888  888'.cyan); 
console.log('888 T88b  88888888888   888888  888888  888888  888  888'.cyan); 
console.log('888  T88b Y8b.    888   888Y88..88PY88..88PY88b 888 d88P '.cyan);
console.log('888   T88b "Y8888 888   888 "Y88P"  "Y88P"  "Y8888888P" \n\n'.cyan); 
console.log('▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀\n' .red);                             
console.log('This bot was developed by MajokingGames [Dev] at - Refloow and published for free at OSL-Works GitHub org'.cyan);
console.log('Code origin: https://github.com/OSL-Works/Steam-Card-Bot-PRO' .red);
console.log('Original work: Copyright (c) 2020-2021 Refloow All rights reserved.\n ' .green);
console.log('Copyright (c) 2020-2021 Refloow official version of the bot is free with regular updates, we wont suggest buying \n "upgraded" copies since they might contain a backdoor. For any feature request just open a issue on github repo \n feel free to donate the money instead of being scammed!')
console.log('▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀\n' .red);
console.log('Removing copyright notice above & distributing, using or selling the software without \n the original license and notice above is licence agreement breach and its considered criminal offense.\n\n\n' .yellow);
console.log('Please read the notice above, app will start in 15 secounds (restarting app fast can result in being rate limited by steam)\n');

/////////////////////////////////////////////////////////////////////
// ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
  
}

function resume() {
console.log(`Verision v${v} PRO` .cyan);
console.log('Loading config file...'.green );
console.log('Starting LevelUp bot...'.green );
console.log('If bot doesnt start in next 1 minute steam is down.\n'.green );

console.log('If you are running app for the first time wait a bit for app to initialize.\n\n'.cyan);

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
}

// Starting the app
initialize();

// Do not recommend changing
// Awaiting a little bit in case of app restarting itself or restarting by command, it will wait some time before accessing steam to prevent steam blocking connection
setTimeout(resume, config.STARTAWAIT);


// Copyright notice:

/* Original work: Copyright (c) 2020-2021 Refloow All rights reserved.
  Code origin (Free GitHub publish): https://github.com/OSL-Works/Steam-Card-Bot-PRO*/

