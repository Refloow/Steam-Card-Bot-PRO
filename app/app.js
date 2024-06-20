
// Copyright notice:

/*--------------------------------------------------------------------------------------------- 
* Original work: Copyright (c) 2020-2021-2022-2023 Refloow All rights reserved.

* Code origin: https://github.com/Refloow/Steam-Card-Bot-PRO
* Developer name: Veljko Vuckovic
* Licensed under the MIT License. See LICENSE in the project root for license information.
* Published License: https://github.com/Refloow/Steam-Card-Bot-PRO/master/LICENSE

* Contact information:
  Discord Support Server: https://discord.gg/D8WCtDD
  Main developer steam: https://steamcommunity.com/id/MajokingGames/ 
  Mail: refloowlibrarycontact@gmail.com

* Donations:
  Crypto: https://refloow.com/cdonate
  Steam: https://steamcommunity.com/tradeoffer/new/?partner=994828078&token=XEUdbqp6
 --------------------------------------------------------------------------------------------*/

 /* 

// legal advice: PERMISSIONS AND RIGHTS

* License does not prohibit modification, distribution, private/commercial use or sale of copies as long as the original LICENSE file
 and authors copyright notice are left as they are in the project files.
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
    SteamUser = require("steam-user");
    SteamTotp = require("steam-totp");
    TradeOfferManager = require("steam-tradeoffer-manager");
    SteamCommunity = require("steamcommunity");
    fs = require("graceful-fs");
// Catching error    
} catch (ex) {
  // Loging error 
    console.log('\n\n\n | [Modules] |: Missing dependencies. Run install.bat file or use npm install.\n\n\n');
    console.log(ex);
    process.exit(1);
}

// Importing other files & variables

let Utils = require("../app/utils.js"),
    method = require('./methods'),
    CONFIG = require("../app/SETTINGS/config.js"),
    logcolors = require("console-master"),
    f = require("../app/functions.js"),
    allCards = {},
    botSets = {},
    users = {},
    userMsgs = {},
    SID64REGEX = new RegExp(/^[0-9]{17}$/),
    chatLogs = "",
    userLogs = {},
    logid=1,
    totalBotSets = 0,
    setsThatShouldntBeSent = [];


// Setting client

let refloow = new SteamUser(),
    manager = new TradeOfferManager({
        "steam": refloow,
        "language": "en",
        "pollInterval": "10000",
        "cancelTime": "7200000" // 2 hours in ms
    }),
    community = new SteamCommunity();

// Checking for correct version (updates) for bot on github (On app start)

method.check();

// Checking for new version every 2 hours and display alert only if update available.

setInterval(function(){ method.checkaswego(); }, 7200000);

// Running validatelogininfo method to check if username and password were set in config

method.validatelogininfo();

// Reading users data from users file to remove inactive friends

fs.readFile("./app/[DB] UserData/Users.json", (ERR, DATA) => {
    if (ERR) {
        logcolors.fail("| [Friends] |: An error occurred while getting Users: " + ERR);
    } else {
        users = JSON.parse(DATA);
    }
});

// Reading Card Sets data

Utils.getCardsInSets((ERR, DATA) => {
    if (!ERR) {
        allCards = DATA;
        logcolors.info("| [Steam] |: Card data loaded. [" + Object.keys(DATA).length + "]");
    } else {
        logcolors.fail("| [Steam] |: An error occurred while getting card data: " + ERR);
    }
});

// Loging on

function logon() {
logid+=1;
refloow.logOn({
    accountName: CONFIG.USERNAME,
    password: CONFIG.PASSWORD,
    twoFactorCode: SteamTotp.getAuthCode(CONFIG.SHAREDSECRET),
  logonID:logid
});
}

// Calling the login function

logon();


// Logged on events

refloow.on("loggedOn", (details, parental) => {
    refloow.getPersonas([refloow.steamID], (personas) => {
        logcolors.true("| [Steam] |: Logged on steam as #" + refloow.steamID + "");
    });
    refloow.setPersona(1);
});

// Setting web session

refloow.on("webSession", (sessionID, cookies) => {
    manager.setCookies(cookies, (ERR) => {
        if (ERR) {
            logcolors.fail("| [WebSession] |: An error occurred while setting cookies.");
        } else {
            logcolors.true('| [WebSession] |: Websession Created And Cookies Set. \n\n');

            logcolors.info('/////////////////////////////////////////////////////////////////////////// \n');
            logcolors.fail('| [Refloow] |: Looks like the bot has been successfully set up on the account !');
            logcolors.fail('| [Refloow] |: To support the project for more updates leave an star on github repository:\n');
            logcolors.fail('| [GitHub] |: https://github.com/Refloow/Steam-Card-Bot-PRO');
	    logcolors.true('| [Refloow] |: Steam-Card-Bot-ULTRA is now out, next gen software available for 27 tf2 keys at: https://discord.gg/4enDY8yhuS\n\n');
            logcolors.info('/////////////////////////////////////////////////////////////////////////// \n');

        }
    
    // Add people that added the bot while bot was offline.

    logcolors.info(`| [Start] |: Checking for offline friend requests.`);
    for (let i = 0; i < Object.keys(refloow.myFriends).length; i++) {
        if (refloow.myFriends[Object.keys(refloow.myFriends)[i]] == 2) {
            refloow.addFriend(Object.keys(refloow.myFriends)[i]);
        }
    }
    manager.apiKey = `${CONFIG.STEAMAPIKEY}`
    community.setCookies(cookies);
    community.startConfirmationChecker(10000, CONFIG.IDENTITYSECRET);
    Utils.getInventory(refloow.steamID.getSteamID64(), community, (ERR, DATA) => {
        logcolors.info("| [Inventory] |: Debug Inventory Loaded");
        if (!ERR) {
            let s = DATA;
            Utils.getSets(s, allCards, (ERR, DATA) => {
                logcolors.info("| [Inventory] |: Debug Sets Loaded");
                if (!ERR) {
                    botSets = DATA;
                    logcolors.info("| [Inventory] |: All card sets loaded");
                    let botNSets = 0;
                    for (let i = 0; i < Object.keys(botSets).length; i++) {
                        botNSets += botSets[Object.keys(botSets)[i]].length;
                    }
                    totalBotSets = botNSets;
                    let playThis = CONFIG.PLAYGAMES;
                    if (CONFIG.PLAYGAMES && typeof(CONFIG.PLAYGAMES) == "string") {
                        playThis = parseString(playThis, totalBotSets);
                    }
                    refloow.gamesPlayed(playThis);
                    logcolors.true(`| [Start] |: Successfully checked for offline friend requests.`)
                } else {
                    logcolors.fail("| [Inventory] |: An error occurred while getting bot sets: " + ERR);
                    logon();
                }
            });
        } else {
            logcolors.fail("| [Inventory] |: An error occurred while getting bot inventory: " + ERR);
	   }
	});
    });
});

// Preform relog if session expire

community.on("sessionExpired", (ERR) => {
  logid+=1;
  if(refloow.steamID)
  {
    logcolors.info("| [WebSession] |: Session Expired. Relogging.");
    refloow.webLogOn();
  }
 
});
  
    
refloow.on("error",(SteamID,ERR) =>
{
	logid+=1;
	refloow.logOn({
    accountName: CONFIG.USERNAME,
    password: CONFIG.PASSWORD,
    twoFactorCode: SteamTotp.getAuthCode(CONFIG.SHAREDSECRET),
	logonID:logid
});
});


// Responding to the friend requests and inviting user to the selected group

refloow.on("friendRelationship", (SENDER, REL) => {
    if (REL === 2) {
      logcolors.info(`| [Steam] | FRIEND |: USER ID: ${SENDER.getSteamID64()} added us on the friendlist.`)
        refloow.addFriend(SENDER);
    } else if (REL === 3) {
        if(method.FriendRequestGoupInviteEnabled()) {
            if (CONFIG.INVITETOGROUPID) {
                 refloow.inviteToGroup(SENDER, CONFIG.INVITETOGROUPID);
            }
        }
        if(method.SendingWelcomeMessage()) {
            refloow.chatMessage(SENDER, CONFIG.WELCOME);
        }
    }
});


// Showing in logs when someone is removed from bots friendlist

refloow.on('friendRelationship', function (SENDER, REL) {
  if (REL == 0) {
    logcolors.fail(`| [Steam] | FRIEND |: USER ID: ${SENDER.getSteamID64()} is no longer on our friendlist.`);
  }
});

// Showing in logs when someone adds bot to friendlist

refloow.on('friendRelationship', function (SENDER, REL) {
  if (REL == 3) {
    logcolors.true(`| [Steam] | FRIEND |: USER ID: ${SENDER.getSteamID64()} is now on our friendlist.`);
  }
});


// Removing inactive friends

if(method.removingInactiveFriendsEnabled()) {
    setInterval(() => {
        for (let i = 0; i < Object.keys(users).length; i++) {
            if (users[Object.keys(users)[i]].idleforhours >= CONFIG.MAXHOURSADDED) {
                if(method.SendingMessageToRemovedInactive()) {
                    refloow.chatMessage(Object.keys(users)[i], CONFIG.REMOVEDINACTIVE);
                }
                refloow.removeFriend(Object.keys(users)[i]);
                delete users[Object.keys(users)[i]];
                fs.writeFile("./app/[DB] UserData/Users.json", JSON.stringify(users), (ERR) => {
                    if (ERR) {
                        logcolors.error("| |UserData| |: An error occurred while writing UserData file: " + ERR);
                    }
                });
            } else {
                users[Object.keys(users)[i]].idleforhours += 1;
                fs.writeFile("./app/[DB] UserData/Users.json", JSON.stringify(users), (ERR) => {
                    if (ERR) {
                        logcolors.error("| |UserData| |: An error occurred while writing UserData file: " + ERR);
                    }
                });
            }
        }
    }, 1000 * 60 * 60);
}

// Code for declining random group invites

if(method.DecliningRandomGroupInvites()) {
  refloow.on('groupRelationship', function(sid, REL) {
      if (REL == SteamUser.EClanRelationship.Invited) {
          logcolors.info('| [Steam] |: We were asked to join steam group #'+sid );  //cyan
          refloow.respondToGroupInvite(sid, false);
          logcolors.false('| [Steam] |: Declined incoming group invite.');
      }
  });
}

// Code for accepting random group invites

if(method.AcceptingRandomGroupInvites()) {
  refloow.on('groupRelationship', function(sid, REL) {
      if (REL == SteamUser.EClanRelationship.Invited) {
          logcolors.info('| [Steam] |: We were asked to join steam group #'+sid );  //cyan
          refloow.respondToGroupInvite(sid, true);
          logcolors.true('| [Steam] |: Accepting incoming group invite.');
      }
  });
}

// Spam protection logic

if(method.ChatSpamProtectionEnabled()) {
   setInterval(() => {
          for (let i = 0; i < Object.keys(userMsgs).length; i++) {
           if (userMsgs[Object.keys(userMsgs)[i]] > CONFIG.MAXMSGPERSEC) {
                if(method.SpamRemoveMessageEnabled()) {
                  refloow.chatMessage(Object.keys(userMsgs)[i], CONFIG.SPAMREMOVEMESSAGE);
                }
               refloow.removeFriend(Object.keys(userMsgs)[i]);
               for (let j = 0; j < CONFIG.ADMINS.length; j++) {
                   if(method.SpamAdminNotification()) {
                       refloow.chatMessage(CONFIG.ADMINS[j], "User #" + Object.keys(userMsgs)[i] + " has been removed for spamming. To block him use !block [STEAMID64] (Command will work after adding admin commands to system.)");
                    }
                }
           }
       }
       userMsgs = {};
   }, 1000);
}

// Messages & Commands

refloow.on("friendMessage", (SENDER, MSG) => {
  if(method.RefloowChat()) {
    logcolors.new("| [RefloowChat] |: " + SENDER.getSteamID64() + " |: " + MSG)
  }
    if (userLogs[SENDER.getSteamID64()]) {
        userLogs[SENDER.getSteamID64()].push(MSG);
    } else {
        userLogs[SENDER.getSteamID64()] = [];
        userLogs[SENDER.getSteamID64()].push(MSG);
    }
    if(method.ChatLogsForEachUserEnabled()) {
        fs.writeFile("./app/[DB] ChatLogs/UserLogs/" + SENDER.getSteamID64() + "-log-" + new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear() + ".json", JSON.stringify({ logs: userLogs[SENDER.getSteamID64()] }), (ERR) => {
            if (ERR) {
                logcolors.fail("| [Users] |: An error occurred while writing UserLogs file: " + ERR);
            }
        });
    }
    if(method.DailyChatLogsEnabled()) {
        chatLogs += SENDER.getSteamID64() + " : " + MSG + "\n";
  
        fs.writeFile("./app/[DB] ChatLogs/FullLogs/log-" + new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear() + ".txt", chatLogs, (ERR) => {
            if (ERR) {
                logcolors.fail("| [Users] |: An error occurred while writing FullLogs file: " + ERR);
            }
        });
    }
    if (Object.keys(users).indexOf(SENDER.getSteamID64()) < 0) {
        users[SENDER.getSteamID64()] = {};
        users[SENDER.getSteamID64()].idleforhours = 0;
        fs.writeFile("./app/[DB] UserData/Users.json", JSON.stringify(users), (ERR) => {
            if (ERR) {
                logcolors.fail("| [Users] |: An error occurred while writing UserData file: " + ERR);
            }
        });
    } else {
        users[SENDER.getSteamID64()].idleforhours = 0;
    }
    if (userMsgs[SENDER.getSteamID64()]) {
        userMsgs[SENDER.getSteamID64()]++;
    } else {
        userMsgs[SENDER.getSteamID64()] = 1;
    }

  
   // !commands, !help command 

    switch (MSG.toUpperCase()) {
    case "!COMMANDS":
    case "!HELP": 
    {
        var startMessage="/code <--------------------------- General Commands --------------------------->\n\n";
          
       
       
       startMessage+="!owner - display owner profile\n";
       startMessage+="!stats - get current bot stock for all currencies\n";
       startMessage+="!rate - current bot prices\n";
       startMessage+="!price - current bot prices\n";
       startMessage+="!level [your dream level] - calculates how many sets and how many keys, gems it will cost to reach your desired level\n";
	     startMessage+="!check - shows how many sets the bot has available for you and also total bot sets and price in TF2 key\n";
       startMessage+="!check [amount] - shows how many sets and which level you will reach for a specific amount of any keys\n";
	     startMessage+="!reminder on/off - turning this on, you will receive notification whenever new sets are added\n";
     
      
      startMessage+=             "\n<--------------------------- Buying  Commands --------------------------->\n\n"
            
       var optionalMessages="";
       
        if(method.BuyCheckingOne()) { 
         optionalMessages+= "!buyonecheck [amount] - shows how many sets bot have from games that you dont have badge for (Counting only 1 set from each game) \n";
        }
        if(method.BuyCheckingAny()) { 
          optionalMessages+= "!buyanycheck command unavailable \n";
        }
                  

        if(method.UserBuying()) {
          
        
      optionalMessages+="!buy [amount of keys] - use this to buy card sets with main bot currency which is set. \n"
        }
        if(method.UserBuyingAny()) { 
           
       optionalMessages+="!buyany [amount of CS:GO keys] - use this to buy that amount of CS:GO keys for any sets, even from badges that has already been crafted, following the current bot rate \n"
        } 
        if(method.UserBuyingOne()) { 
         optionalMessages+= "!buyone [amount of CS:GO keys] - only use this if you are a badge collector. The bot will send one set of each game, by the current bot rate \n";
        } 
                

        if(method.UserBuyingWithRef()) {
         optionalMessages+= "!buyref [amount of REF] - use this to buy sets you have not crafted yet for that amount of ref, following the current bot rate \n";
        }
        if(method.UserBuyingWithHydra()) { 
          
      optionalMessages+="!buyhydra [amount of CS:GO Hydra keys] - buy sets for your hydra key(s) \n";
        } 
        if(method.UserBuyingWithCSGO()) {  
          optionalMessages+= "!buycs [amount of CS:GO keys] - buy sets for your CS:GO key(s) \n";
     
        } 
        if(method.UserBuyingWithTF2()) {
          
      optionalMessages+="!buytf [amount of TF keys] - buy sets for your TF key(s) \n";
        } 
        if(method.UserBuyingWithGems()) {  
         optionalMessages+= "!buygems [amount of sets] - buy sets with your gems \n";
        } 
        if(method.UserBuyingWithPUBG()) {   
           optionalMessages+= "!buypubg - command unavailable \n";
        }
                 

        if(method.UserBuyingOneWithRef()) {
         optionalMessages+= "!buyoneref - command unavailable \n";
        }
        if(method.UserBuyingOneWithHydra()) { 
         optionalMessages+= "!buyonehydra - command unavailable \n";
        }
        if(method.UserBuyingOneWithCSGO()) { 
           optionalMessages+= "!buyonecsgo - command unavailable \n";
        }
        if(method.UserBuyingOneWithTF2()) { 
         optionalMessages+= "!buyonetf2 - command unavailable \n";
        }
        if(method.UserBuyingOneWithGems()) { 
       optionalMessages+= "!buyonegems - command unavailable \n";
        }
        if(method.UserBuyingOneWithPUBG()) { 
         optionalMessages+= "!buyonepubg - command unavailable \n";
        }
    if(method.UserBuyingAnyWithRef()) {
        optionalMessages+= "!buyanyref - command unavailable \n";
        }
        if(method.UserBuyingAnyWithHydra()) { 
          optionalMessages+= "!buyanyhydra - command unavailable \n";
        }
        if(method.UserBuyingAnyWithCSGO()) { 
           optionalMessages+= "!buyanycsgo - command unavailable \n";
        }
        if(method.UserBuyingAnyWithTF2()) { 
          optionalMessages+= "!buyanytf2 - command unavailable \n";
        }
        if(method.UserBuyingAnyWithGems()) { 
          optionalMessages+= "!buyanygems - command unavailable \n";
        }
        if(method.UserBuyingAnyWithPUBG()) { 
         optionalMessages+= "!buyanypubg - command unavailable \n";
        }
    
    optionalMessages+=             "\n<-------------------------- Selling  Commands --------------------------->\n\n";
    
     if(method.SellChecking()) {
          
      optionalMessages+="!sellcheck command - info about bot \n";
        }
        if(method.UserSell()) {
         
      optionalMessages+="!sell - [amount of keys] - sell your sets for BOT MAIN CURRENCY key(s) \n";
        } 
        if(method.UserSellingWithRef()) {
         optionalMessages+= "!sellref - command unavailable \n";
        } 
        if(method.UserSellingWithHydra()) { 
         
      optionalMessages+="!sellhydra [amount of CS:GO Hydra keys] - sell your sets for Hydra key(s) \n";
        } 
        if(method.UserSellingWithCSGO()) {  
        
     optionalMessages+="!sellcs [amount of CS:GO keys] - sell your sets for CS:GO key(s) \n";
        } 
        if(method.UserSellingWithTF2()) { 
         
     optionalMessages+="!selltf [amount of TF keys] - sell your sets for TF key(s) \n";
        } 
    
        if(method.UserSellingWithGems()) {
        optionalMessages+= "!sellgems [amount of sets] - sell your sets for gems \n";
        } 
        if(method.UserSellingWithPUBG()) {  
         optionalMessages+= "!sellpubg - command unavailable";
        }
    refloow.chatMessage(SENDER,startMessage+optionalMessages);
       
       
      }
    break 
  }

// !Owner command

if (MSG.toUpperCase() == "!OWNER") {
        refloow.chatMessage(SENDER, CONFIG.OWNER);

}

  // !PRICE, !PRICES, !RATE commands

  else if(MSG.toUpperCase() == "!PRICE" || MSG.toUpperCase() == "!PRICES" || MSG.toUpperCase() == "!RATE")
   {

        refloow.chatMessage(SENDER, `/code The current prices are:\n` +
									"________________________\n"+
									"|____ME___|_____YOU_____|\n"+
                                  "| " + CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS + ` sets ` + "|"  + ` 1 CSGO key ` + " |\n" +
                                "| " +    CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSHYDRA + ` sets ` + "|" + ` 1 Hydra key ` + "|\n" +
                                 "| " +   CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSTF2 + ` sets ` + "|" + ` 1 TF 2 key ` + " |\n" +
								 "| " +     `01 set ⠀` + "| " +  CONFIG.CARDS.BUY1GEMSFORAMOUNTOFSETS+ ` gems ` + "   |\n\n" +
					
									"_________________________\n"+
									"|___YOU___|_____ME______|\n"+
				
                                 "| " +   CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETS + ` sets ` + "|" + ` 1 CSGO key ` + " |\n" +
                                "| "  +    CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETSHYDRA + ` sets ` + "|" + ` 1 Hydra key ` + "|\n" +
                                 "| " +   CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETSTF2 + ` sets ` + "|" + ` 1 TF 2 key ` + " |\n"+
									"| " +     `01 set ⠀` + "| " +  CONFIG.CARDS.GIVE1GEMSFORAMOUNTOFSETSGEMS+ ` gems ` + "   |\n" );
    
}

// This will log when this commands were executed

else if (MSG.toUpperCase() == "!PRICE") {
  if(method.LogsCalledCommandsEnabled()) {
        logcolors.true('| [Refloow] |: Displaying prices, !PRICE command called by '  + SENDER.getSteamID64() ); 
  }
}

else if (MSG.toUpperCase() == "!PRICES") {
  if(method.LogsCalledCommandsEnabled()) {
        logcolors.true('| [Refloow] |: Displaying prices, !PRICES command called by '  + SENDER.getSteamID64() ); 
  }
}

else if (MSG.toUpperCase() == "!RATE") {
  if(method.LogsCalledCommandsEnabled()) {
        logcolors.true('| [Refloow] |: Displaying prices, !RATE command called by '  + SENDER.getSteamID64() ); 
  }
}

else if (MSG.toUpperCase() == "!HELP") {
  if(method.LogsCalledCommandsEnabled()) {
        logcolors.true('| [Help] |: Displaying all commands, !help command called by '  + SENDER.getSteamID64() ); 
  }

}

else if (MSG.toUpperCase() == "!COMMANDS") {
  if(method.LogsCalledCommandsEnabled()) {
        logcolors.true('| [Help] |: Displaying all commands, !commands command called by '  + SENDER.getSteamID64() ); 
  }
}

// !Stats command

else if (MSG.toUpperCase() === "!STATS") {
		logcolors.info("| [Refloow] |: !stats command called by " + SENDER.getSteamID64());
        f.getCurrencyStocks(manager,SENDER,refloow);
} 

// !Level command

else if (MSG.toUpperCase().indexOf("!LEVEL") >= 0) {
        let n = parseInt(MSG.toUpperCase().replace("!LEVEL ", ""));
        if(method.LogsCalledCommandsEnabled()) {
        logcolors.true('| [Refloow] |: !Level ' + n + ' command called by '  + SENDER.getSteamID64() ); 
        }
        if (!isNaN(n) && parseInt(n) > 0) {
            if (n <= CONFIG.MAXLEVEL) {
				 f.getBadges(SENDER,n , (response) =>{
				 
				refloow.chatMessage(SENDER,response);
				 });
            } else {
                refloow.chatMessage(SENDER, "/pre ⚠️ Please try a lower level.");
            }
        } else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please provide a valid level.");
        }
     } 
		
		else if (MSG.toUpperCase() == "!CHECK") {
         logcolors.true('| [Refloow] |: Starting to process !check request.'); 
          if (Object.keys(botSets).length == 0)  {
            refloow.chatMessage(SENDER, "/pre Bot doesn't have any sets at the moment, please check later.")
            logcolors.true('| [Refloow] |: Finished processing !check request bot doenst have any sets in the inventory');
          }
          if (Object.keys(botSets).length > 0) {
          refloow.chatMessage(SENDER, "/me ⚆ Loading badges...");
          Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
			  //console.log(DATA);
          logcolors.true('| [Refloow] |: Processing !check request...');
        if (!ERR) {
		  f.MaxSets(DATA,botSets , (hisMaxSets,botNSets) => {
			  
          totalBotSets = botNSets;
		  
          logcolors.true('| [Refloow] |: Finished processing of !check request');
		  logcolors.summary('| [Summary] |: Bot has '+hisMaxSets+'/'+botNSets + ' sets for him');
		refloow.chatMessage(SENDER, "/pre There are currently " + hisMaxSets + "/" + botNSets + " sets available which you have not fully crafted yet.Buying all of them will cost you -\n" 
		+ "- "+parseInt((hisMaxSets / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSTF2 )) + " TF2 keys.\n"
		+ "- "+parseInt((hisMaxSets / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS )) + " CS:GO keys.\n"
		+ "- "+parseInt((hisMaxSets * CONFIG.CARDS.BUY1GEMSFORAMOUNTOFSETS )) + " Gems.")});
        } else {
          refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while getting your badges. Please try again.");
          logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
        }
      });
    }
		
    }

   // !checkone command
   
    else if (MSG.toUpperCase().indexOf("!CHECKONE") >= 0) {
            refloow.chatMessage(SENDER, "/me Loading badges...");
            Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                if(method.LogsCalledCommandsEnabled()) {
                logcolors.true('| [Refloow] |: Processing !Checkone request');
                
                if (!ERR) {
                    
                    f.MaxSets(DATA,botSets , (hisMaxSets,botNSets) => {
                        botNSets += botSets[Object.keys(botSets)[i]].length;
                    
                    totalBotSets = botNSets;
                    
				refloow.chatMessage(SENDER, "/code There are currently sets from " + Object.keys(botSets).length + " different games, of which you have not crafted " + hisMaxSets + ". This would cost " + parseInt(hisMaxSets / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS * 100) / 100 + " keys.")});
				
                } else {
                    refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while getting your badges. Please try again.");
                    logcolors.fail(SENDER, "| [Steam] |: An error occurred while loading badges: " + ERR);
                }
				}
				else
				{
					refloow.chatMessage(SENDER,"/pre ⚠️ An error occurred, command has been disabled by admin");
				}
            });
			
        }

  // Reminder command
		
	else if(MSG.toUpperCase().indexOf("!REMINDER") >= 0)
	{
		var type = MSG.toUpperCase().replace("!REMINDER ","");
		logcolors.info("| [Refloow] |: Processing !reminder " + type + " command by " + SENDER.getSteamID64());
		if(type=="ON")
		{
			fs.readFile("./app/[DB] UserData/reminder.json",(ERR,DATA) => 
			{
				if(ERR)
					logcolors.fail("| [Debug] | An error occurred while reading file " + ERR );
				else
				{
				  try{
						let ids = JSON.parse(DATA);
						ids.IDS.push(SENDER.getSteamID64());
						ids.IDS = ids.IDS.filter(function(item,pos) {
								return ids.IDS.indexOf(item)== pos;
							});
						let jsonString = JSON.stringify(ids);
						fs.writeFile("./app/[DB] UserData/reminder.json",jsonString,(ERR) =>
							{
								if(ERR)
									logcolors.fail("| [Debug] | An error occurred while writing to file " + ERR );
								else
									refloow.chatMessage(SENDER.getSteamID64(),"/pre Successfully added your steamID to list!");
							}
						);
						
					}
					catch(err)
					{
						logcolors.fail("| [Debug] | An error occurred while parsing string " + err);
					}
				}
			});
		}
		else if(type=="OFF")
		{
			fs.readFile("./app/[DB] UserData/reminder.json",(ERR,DATA) => 
			{ 
				let bool = false;
				if(ERR)
					logcolors.fail("| [Debug] | An error occurred while reading file " + ERR );
				else
				{
				  try{
						let ids = JSON.parse(DATA);
						for( let i =0 ;i< ids.IDS.length ; i++)
						{
							if(ids.IDS[i]==SENDER.getSteamID64())
							{
								ids.IDS.splice(i,1);
								bool=true;
							}
						}
						if(bool)
						{
							let jsonString = JSON.stringify(ids);
							fs.writeFile("./app/[DB] UserData/reminder.json",jsonString,(ERR) =>
							{
								if(ERR)
									logcolors.fail("| [Debug] | An error occurred while writing to file " + ERR );
								else
									refloow.chatMessage(SENDER.getSteamID64(),"/pre Successfully removed your steamID from list!");
							});
						}
						else
							refloow.chatMessage(SENDER.getSteamID64(),"/pre Could not find your steamID in list");
					}
					catch(err)
					{
						logcolors.fail("| [Debug] | An error occurred while parsing string " + err);
					}
				}
			});
		}
		else
		{
			refloow.chatMessage(SENDER.getSteamID64(),"/pre Please select valid option!");
		}
	}


    // !SELLCHECK COMMAND

    else if (MSG.toUpperCase().indexOf("!SELLCHECK") >= 0) {
        let n = parseInt(MSG.toUpperCase().replace("!SELLCHECK ", ""));
        refloow.chatMessage(SENDER, "/me Loading inventory...");

        Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
         if(method.LogsCalledCommandsEnabled()) {
         logcolors.true('| [Refloow] |: Processing !checksell requested by '   + SENDER.getSteamID64() );
         }
           logcolors.info("| [Debug] |: Inventory Loaded");
            if (!ERR) {
                let s = DATA;
                Utils.getSets(s, allCards, (ERR, DATA) => {
                    logcolors.info("| [Debug] |: Sets Loaded");
                    if (!ERR) {
                        botNSets =0;
                    for (let i = 0; i < Object.keys(DATA).length; i++) {
						
						if(botSets[Object.keys(DATA)[i]])
						{
							if(botSets[Object.keys(DATA)[i]].length >=CONFIG.MAXSTOCKSETSPERGAME)
							{
								continue;
							}
							var total = botSets[Object.keys(DATA)[i]].length + DATA[Object.keys(DATA)[i]].length;
							if(total>CONFIG.MAXSTOCKSETSPERGAME)
							{
								if(DATA[Object.keys(DATA)[i]].length >= CONFIG.MAXSTOCKSETSPERGAME)
								{
									botNSets+= CONFIG.MAXSTOCKSETSPERGAME-botSets[Object.keys(DATA)[i]].length;
								}
								else
								{
									var left = CONFIG.MAXSTOCKSETSPERGAME - DATA[Object.keys(DATA)[i]].length;
									botNSets += (left>DATA[Object.keys(DATA)[i]].length) ? DATA[Object.keys(DATA)[i]].length:left;
									
								}
						    }
							else
							{
							
								botNSets+=DATA[Object.keys(DATA)[i]].length;
																				
							}
                        }
						else
						{
							
								botNSets += Math.min(DATA[Object.keys(DATA)[i]].length,CONFIG.MAXSTOCKSETSPERGAME);
							
						}
                    }
					var remain = botNSets - ( botNSets % CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETSTF2);
                        refloow.chatMessage(SENDER, "/pre You currently have " + botNSets + " sets available which I can buy. I will pay you:\n" 
						+ (parseInt(botNSets / CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETSTF2)) + " TF2 keys" + " for " + (botNSets - ( botNSets % CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETSTF2)) + " sets " + "("+(CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETSTF2)+":1)\n"
						+ (parseInt(botNSets / CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETS)) + " CS:GO keys" + " for " + (botNSets - ( botNSets % CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETS)) + " sets " + "("+(CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETS)+":1)\n"
						+ (parseInt(botNSets * CONFIG.CARDS.GIVE1GEMSFORAMOUNTOFSETSGEMS)) + " Gems" + " for " + (botNSets) + " sets " +"("+(CONFIG.CARDS.GIVE1GEMSFORAMOUNTOFSETSGEMS)+":1)" );
                        logcolors.true('| [Refloow] |: User has ' + botNSets + ' sets available to sell');
						
						f.getCurrencyStocks(manager,SENDER,refloow);
                    } else {
                        logcolors.fail("| [Inventory] |: An error occurred while getting user sets: " + ERR);
						refloow.chatMessage("An error occurred while getting your inventory. Please try again later");
                    }
                });
            } else {
                logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
            }
        });
  }

    // !Check command

    else if (MSG.toUpperCase().indexOf("!CHECK") >= 0) {

      let n = parseInt(MSG.toUpperCase().replace("!CHECK ", ""));
          if (!isNaN(n) && parseInt(n) > 0) {
              if(method.LogsCalledCommandsEnabled()) {
              logcolors.true('| [Refloow] |: Processing !check requested by '   + SENDER.getSteamID64() );
            
			Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA, CURRENTLEVEL, XPNEEDED) => {
				
				f.levelReached(n,CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS,CURRENTLEVEL, (cslevel) => {
					f.levelReached(n,CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSTF2,CURRENTLEVEL, (tflevel) => {
						f.levelReached(n,CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSHYDRA,CURRENTLEVEL, (hydralevel) => {
							refloow.chatMessage(SENDER, "/code ✔️ With " + n + " CS:GO keys you can get " + n*CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS + " sets and reach level " + cslevel +
							"\n✔️ With " + n + " TF2 keys you can get " + n*CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSTF2 + " sets and reach level " + tflevel +
							"\n✔️ With " + n + " Hydra keys you can get " + n*CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSHYDRA + " sets and reach level " + hydralevel );
						});
					});
				});
			});
          }} else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please provide a valid amount of keys.");
            logcolors.true('| [Refloow] |: Command was sent without check number indicator');
          } 
    }

  // !Donatesets command

  else if (MSG.toUpperCase().indexOf("!DONATESETS") >= 0) {
		if (botSets) {
			   let n = parseInt(MSG.toUpperCase().replace("!DONATESETS ", "")),
					amountofsets = n;
					
					f.donateSets(n,manager,SENDER,amountofsets,setsThatShouldntBeSent,refloow,community,allCards,(callback) => {
							logcolors.true('| [Refloow] |: Finished processing !donateSets request');
		});
				 
  }else {
			refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
		}


  }



//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*

//---------------------------------------------------------------------------------------------------------------------//
//                                                                                                                     //
//                                    FROM HERE IS SECTION WITH BUY COMMANDS                                           //
//                                                                                                                     //
//---------------------------------------------------------------------------------------------------------------------// 

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*



// HERE IS SECTION WITH SIMPLE BUY COMMANDS USING MAIN BOT CURRENCY SET IN CONFIG (!BUY, !BUYANY, !BUYONE)


         else if (MSG.toUpperCase().indexOf("!BUYANY") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYANY ", ""),
                amountofsets = parseInt(n) * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS;
        if(method.UserBuyingAny()) {
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    n = parseInt(n);
                    let theirKeys = [];
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                            refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while getting your trade holds. Please try again");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            refloow.chatMessage(SENDER, "/me ⚠️ Processing your request.");
                           logcolors.true('| [Refloow] |: Processing of !buyany request');
                            manager.getUserInventoryContents(SENDER.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                    refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while loading your inventory. Please try later");
                                } else {
                                    let amountofB = amountofsets;
                                    for (let i = 0; i < INV.length; i++) {
                                        if (theirKeys.length < n && CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
                                            theirKeys.push(INV[i]);
                                        }
                                    }
                                    if (theirKeys.length != n) {
                                        refloow.chatMessage(SENDER, "/pre ⚠️ You do not have enough keys.");
                                    } else {
                                        sortSetsByAmount(botSets, (DATA) => {
                                            let setsSent = {};
                                            firstLoop: for (let i = 0; i < DATA.length; i++) {
                                                console.log(setsSent);
                                                console.log(DATA[i]);
                                                if (botSets[DATA[i]]) {
                                                    for (let j = 0; j < botSets[DATA[i]].length; j++) {
                                                        if (amountofB > 0) {
                                                            if ((setsSent[DATA[i]] && setsSent[DATA[i]] > -1) || !setsSent[DATA[i]]) {
                                                                t.addMyItems(botSets[DATA[i]][j]);
                                                                logcolors.info("| [Debug] |: loop #2 CONTINUE: ITEM ADD");
                                                                amountofB--;
                                                                if (!setsSent[DATA[i]]) {
                                                                    setsSent[DATA[i]] = 1;
                                                                } else {
                                                                    setsSent[DATA[i]] += 1;
                                                                }
                                                            } else {
                                                                logcolors.info("| [Debug] |: loop #2 CONTINUE: RETURN");
                                                                continue firstLoop;
                                                            }
                                                        } else {
                                                            logcolors.info("| [Debug] |: loop #2 CONTINUE: RETURN");
                                                            continue firstLoop;
                                                        }
                                                    }
                                                } else {
                                                    logcolors.info("| [Debug] |: loop #2 CONTINUE: RETURN");
                                                    continue firstLoop;
                                                }
                                            }
                                        });
                                    }
                                    if (amountofB > 0) {
                                        refloow.chatMessage(SENDER, "/pre ⚠️ There are not enough sets. Please try again later.");
                                    } else {
                                        logcolors.info("| [Debug] |: -SENDING");
                                        t.addTheirItems(theirKeys);
                                        t.data("commandused", "BuyAny");
                                        t.data("amountofsets", amountofsets.toString());
                                        t.data("amountofkeys", n);
                                        t.data("index", setsThatShouldntBeSent.length);
                                        setsThatShouldntBeSent.push(t.itemsToGive);
                                        t.send((ERR, STATUS) => {
                                            if (ERR) {
                                                refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                            } else {
                                                refloow.chatMessage(SENDER, "/me ✔️ Trade Sent! Confirming it...");
                                                logcolors.info("| [Steam] |: Trade offer sent!");
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            refloow.chatMessage(SENDER, "/pre ⚠️ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    refloow.chatMessage(SENDER, "/pre ⚠️ Please try a lower amount of keys.");
                }
            } else {
                refloow.chatMessage(SENDER, "/pre ⚠️ Please provide a valid amount of keys.");
            }
        } else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }


        } else if (MSG.toUpperCase().indexOf("!BUYONE") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYONE ", ""),
                amountofsets = parseInt(n) * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS;
        if(method.UserBuyingOne()) {
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                            refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while getting your trade holds. Please try again");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            n = parseInt(n);
                            let theirKeys = [];
                            logcolors.true('| [Refloow] |: Processing of !buyone request');
                            refloow.chatMessage(SENDER, "/me ⚠️ Processing your request.");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                    refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while loading your inventory. Please try later");
                                } else {
                                    logcolors.info("| [Debug] |: Inventory Loaded");
                                    if (!ERR) {
                                        logcolors.info("| [Debug] |: Inventory Loaded 2");
                                        for (let i = 0; i < INV.length; i++) {
                                            if (theirKeys.length < n && CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
                                                theirKeys.push(INV[i]);
                                            }
                                        }
                                        if (theirKeys.length != n) {
                                            refloow.chatMessage(SENDER, "/pre ⚠️ You do not have enough keys.");
                                        } else {
                                            Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                                                if (!ERR) {
                                                    logcolors.info("| [Debug] |: DEBUG#BADGE LOADED");
                                                    if (!ERR) {
                                                        let b = {}; // List with badges that CAN still be crafted
                                                        if (DATA) {
                                                            for (let i = 0; i < Object.keys(DATA).length; i++) {
                                                                if (DATA[Object.keys(DATA)[i]] < 6) {
                                                                    b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                                                }
                                                            }
                                                        } else {
                                                            refloow.chatMessage(SENDER.getSteamID64(), "/pre Your badges are empty, sending an offer without checking badges.");
                                                        }
                                                        console.log(DATA);
                                                        console.log(b);
                                                        // TODO: COUNT AMOUNT OF SETS BOT CAN GIVE HIM
                                                        // 1: GET BOTS CARDS. DONE
                                                        // 2: GET PLAYER's BADGES. DONE
                                                        // 3: MAGIC
                                                        let hisMaxSets = 0,
                                                            botNSets = 0;
                                                        // Loop for sets he has partially completed
                                                        for (let i = 0; i < Object.keys(b).length; i++) {
                                                            if (botSets[Object.keys(b)[i]] && botSets[Object.keys(b)[i]].length >= 5 - b[Object.keys(b)[i]].length) {
                                                                hisMaxSets += 5 - b[Object.keys(b)[i]].length;
                                                            }
                                                        }
                                                        logcolors.info("| [Debug] |: Loop 1 DONE");
                                                        // Loop for sets he has never crafted
                                                        for (let i = 0; i < Object.keys(botSets).length; i++) {
                                                            if (Object.keys(b).indexOf(Object.keys(botSets)[i]) < 0) {
                                                                if (botSets[Object.keys(botSets)[i]].length >= 5) {
                                                                    hisMaxSets += 5;
                                                                } else {
                                                                    hisMaxSets += botSets[Object.keys(botSets)[i]].length;
                                                                }
                                                            }
                                                            botNSets += botSets[Object.keys(botSets)[i]].length;
                                                        }
                                                        totalBotSets = botNSets;
                                                        
                                                        logcolors.info("| [Debug] |: Loop 2 DONE");
                                                        // HERE
                                                        if (amountofsets <= hisMaxSets) {
                                                            hisMaxSets = amountofsets;
                                                            logcolors.info("| [Debug] |: Trade Created");
                                                            sortSetsByAmount(botSets, (DATA) => {
                                                                logcolors.info("| [Debug] |:" + DATA);
                                                                logcolors.info("| [Debug] |: Sets Sorted")
                                                                firstLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    if (b[DATA[i]] == 0) {
                                                                        continue firstLoop;
                                                                    } else {
                                                                        logcolors.info("| [Debug] |: DEBUG#" + i);
                                                                        logcolors.info("| [Debug] |: DEBUG FOR LOOP ITEMS");
                                                                        if (hisMaxSets > 0) {
                                                                            logcolors.info("| [Debug] |: DEBUG# MAXSETSMORETHAN1");
                                                                            if (!b[DATA[i]] && botSets[DATA[i]].length > 0) { // TODO NOT FOR LOOP WITH BOTSETS. IT SENDS ALL
                                                                                // BOT HAS ENOUGH SETS AND USER NEVER CRAFTED THIS
                                                                                bLoop: for (let j = 0; j < botSets[DATA[i]].length; j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        logcolors.info("| [Debug] |: loop #1 CONTINUE: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                        continue firstLoop;
                                                                                    } else {
                                                                                        logcolors.info("| [Debug] |: DEBUG#LOOP #1: " + botSets[DATA[i]][j]);
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                        } else {
                                                                            logcolors.info("| [Debug] |: loop #1 CONTINUE: RETURN");
                                                                            break firstLoop;
                                                                        }
                                                                    }
                                                                }
                                                                if (hisMaxSets > 0) {
                                                                    refloow.chatMessage(SENDER, "/pre ⚠️ There are not enough sets. Please try again later.");
                                                                } else {
                                                                    logcolors.info("| [Debug] |: -SENDING");
                                                                    t.addTheirItems(theirKeys);
                                                                    t.data("commandused", "BuyOne");
                                                                    t.data("amountofkeys", n);
                                                                    t.data("amountofsets", amountofsets.toString());
                                                                    t.data("index", setsThatShouldntBeSent.length);
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                            logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                           refloow.chatMessage(SENDER, "/me ✔️ Trade Sent! Confirming it...");
                                                                            logcolors.info("| [Steam] |: Trade offer sent!");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            refloow.chatMessage(SENDER, "/pre ⚠️ There are currently not enough sets that you have not used in stock for this amount of keys. Please try again later. If you want the bot to ignore your current badges use !buyany.");
                                                        }
                                                    } else {
                                                        logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while getting your badges. Please try again.");
                                                    logcolors.fail(SENDER, "| [Steam] |: An error occurred while loading badges: " + ERR);
                                                }
                                            });
                                        }
                                    } else {
                                        logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            });
                        } else {
                            refloow.chatMessage(SENDER, "/pre ⚠️ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    refloow.chatMessage(SENDER, "/pre ⚠️ Please try a lower amount of keys.");
                }
            } else {
                refloow.chatMessage(SENDER, "/pre ⚠️ Please provide a valid amount of keys.");
            }
        } else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------//





    // HERE IS SECTION WITH BUY COMMANDS USING OTHER CURRENCYS (!BUYREF, !BUYHYDRA, !BUYCSGO, !BUYTF2, !BUYGEMS, !BUYPUBG)



    } else if (MSG.toUpperCase().indexOf("!BUYREF") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYREF ", ""),
                amountofsets = parseInt(n) / CONFIG.CARDS.BUY1SETFORAMOUNTOFREF; 
                refloow.chatMessage(SENDER, "/pre You can get " + amountofsets + " set(s) for " + n + " Refined Metal");
        if(method.UserBuyingWithRef()) {
            if (parseInt(n)%2 == 0) {   
                if (!isNaN(n) && parseInt(n) > 0) {
                    if (n <= CONFIG.MAXBUYREF) {
                        let t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                                refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while getting your trade holds. Please try again");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                n = parseInt(n);
                                let theirRef = [];
                                logcolors.true('| [Refloow] |: Processing of !buyref request');
                                refloow.chatMessage(SENDER, "/me Processing your request.");
                                manager.getUserInventoryContents(SENDER.getSteamID64(), 440, 2, true, (ERR, INV, CURR) => {
                                    if (ERR) {
                                        logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while loading your inventory. Please try later");
                                    } else {
                                        logcolors.info("| [Debug] |: Inventory Loaded");
                                        if (!ERR) {
                                            logcolors.info("| [Debug] |: Inventory Loaded");
                                            for (let i = 0; i < INV.length; i++) {
                                                if (theirRef.length < n && INV[i].market_hash_name == "Refined Metal") {
                                                    theirRef.push(INV[i]);
                                                }
                                            }
                                            if (theirRef.length != n) {
                                                refloow.chatMessage(SENDER, "/pre ⚠️ You do not have enough Refined Metal.");
                                            } else {
                                                Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                                                    if (!ERR) {
                                                        logcolors.info("| [Debug] |: DEBUG#BADGE LOADED");
                                                        if (!ERR) {
                                                            let b = {}; // List with badges that CAN still be crafted
                                                            if (DATA) {
                                                                for (let i = 0; i < Object.keys(DATA).length; i++) {
                                                                    if (DATA[Object.keys(DATA)[i]] < 6) {
                                                                        b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                                                    }
                                                                }
                                                            } else {
                                                                refloow.chatMessage(SENDER.getSteamID64(), "/pre Your badges are empty, sending an offer without checking badges.");
                                                            }
                                                            console.log(DATA);
                                                            console.log(b);
                                                            // TODO: COUNT AMOUNT OF SETS BOT CAN GIVE HIM
                                                            // 1: GET BOTS CARDS. DONE
                                                            // 2: GET PLAYER's BADGES. DONE
                                                            // 3: MAGIC
                                                            let hisMaxSets = 0,
                                                                botNSets = 0;
                                                            // Loop for sets he has partially completed
                                                            for (let i = 0; i < Object.keys(b).length; i++) {
                                                                if (botSets[Object.keys(b)[i]] && botSets[Object.keys(b)[i]].length >= 5 - b[Object.keys(b)[i]].length) {
                                                                    hisMaxSets += 5 - b[Object.keys(b)[i]].length;
                                                                }
                                                            }
                                                            logcolors.info("| [Debug] |: Loop 1 DONE");
                                                            // Loop for sets he has never crafted
                                                            for (let i = 0; i < Object.keys(botSets).length; i++) {
                                                                if (Object.keys(b).indexOf(Object.keys(botSets)[i]) < 0) {
                                                                    if (botSets[Object.keys(botSets)[i]].length >= 5) {
                                                                        hisMaxSets += 5;
                                                                    } else {
                                                                        hisMaxSets += botSets[Object.keys(botSets)[i]].length;
                                                                    }
                                                                }
                                                                botNSets += botSets[Object.keys(botSets)[i]].length;
                                                            }
                                                            logcolors.info("| [Debug] |: Loop 2 DONE");
                                                            // HERE
                                                            if (amountofsets <= hisMaxSets) {
                                                                hisMaxSets = amountofsets;
                                                                logcolors.info("| [Debug] |: Trade Created");
                                                                sortSetsByAmount(botSets, (DATA) => {
                                                                    logcolors.info("| [Debug] |:" + DATA);
                                                                    logcolors.info("| [Debug] |: Sets Sorted");
                                                                    firstLoop: for (let i = 0; i < DATA.length; i++) {
                                                                        if (b[DATA[i]] == 0) {
                                                                            continue firstLoop;
                                                                        } else {
                                                                            logcolors.info("| [Debug] |: DEBUG#" + i);
                                                                            logcolors.info("| [Debug] |: DEBUG FOR LOOP ITEMS");
                                                                            if (hisMaxSets > 0) {
                                                                                logcolors.info("| [Debug] |: DEBUG# MAXSETSMORETHAN1");
                                                                                if (b[DATA[i]] && botSets[DATA[i]].length >= b[DATA[i]]) {
                                                                                    // BOT HAS ENOUGH SETS OF THIS KIND
                                                                                    logcolors.info("| [Debug] |: Loop 2");
                                                                                    sLoop: for (let j = 0; j < 5 - b[DATA[i]]; j++) {
                                                                                        if (j + 1 < b[DATA[i]] && hisMaxSets > 0) {
                                                                                            logcolors.info("| [Debug] |: loop #1 CONTINUE: ITEM ADD");
                                                                                            logcolors.info("| [Debug] |: DEBUG#LOOP #1: " + botSets[DATA[i]][j]);
                                                                                            t.addMyItems(botSets[DATA[i]][j]);
                                                                                            hisMaxSets--;
                                                                                            console.log(hisMaxSets);
                                                                                        } else {
                                                                                            logcolors.info("| [Debug] |: loop #1 CONTINUE: RETURN");
                                                                                            continue firstLoop;
                                                                                        }
                                                                                    }
                                                                                } else if (b[DATA[i]] && botSets[DATA[i]].length < b[DATA[i]]) {
                                                                                    // BOT DOESNT HAVE ENOUGH SETS OF THIS KIND
                                                                                    logcolors.info("| [Debug] |: loop #1 CONTINUE");
                                                                                    continue; // *
                                                                                } else if (!b[DATA[i]] && botSets[DATA[i]].length < 5 && botSets[DATA[i]].length - b[DATA[i]] > 0) { // TODO NOT FOR LOOP WITH BOTSETS. IT SENDS ALL
                                                                                    // BOT HAS ENOUGH SETS AND USER NEVER CRAFTED THIS
                                                                                    bLoop: for (let j = 0; j < botSets[DATA[i]].length - b[DATA[i]]; j++) {
                                                                                        if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                            t.addMyItems(botSets[DATA[i]][j]);
                                                                                            logcolors.info("| [Debug] |: loop #2 CONTINUE: ITEM ADD");
                                                                                            hisMaxSets--;
                                                                                        } else {
                                                                                            logcolors.info("| [Debug] |: loop #2 CONTINUE: RETURN");
                                                                                            continue firstLoop;
                                                                                        }
                                                                                    }
                                                                                }
                                                                                else if (hisMaxSets < 5) {
                                                                                    // BOT DOESNT HAVE CARDS USER AREADY CRAFTED, IF USER STILL NEEDS 5 SETS:
                                                                                    logcolors.info("| [Debug] |: loop #2 CONTINUE: RETURN");
                                                                                    tLoop: for (let j = 0; j != hisMaxSets; j++) {
                                                                                        if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                            t.addMyItems(botSets[DATA[i]][j]);
                                                                                            logcolors.info("| [Debug] |: loop #2 CONTINUE: ITEM ADD");
                                                                                            hisMaxSets--;
                                                                                            console.log(hisMaxSets);
                                                                                        } else {
                                                                                            logcolors.info("| [Debug] |: loop #2 CONTINUE: RETURN");
                                                                                            continue firstLoop;
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    // BOT DOESNT HAVE CARDS USER AREADY CRAFTED, IF USER STILL NEEDS LESS THAN 5 SETS:
                                                                                    logcolors.info("| [Debug] |: Loop 2");
                                                                                    xLoop: for (let j = 0; j != 5; j++ && hisMaxSets > 0) {
                                                                                        if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                            t.addMyItems(botSets[DATA[i]][j]);
                                                                                            logcolors.info("| [Debug] |: loop #2 CONTINUE: ITEM ADD");
                                                                                            hisMaxSets--;
                                                                                            console.log(hisMaxSets);
                                                                                        } else {
                                                                                            logcolors.info("| [Debug] |: loop #2 CONTINUE: RETURN");
                                                                                            continue firstLoop;
                                                                                        }
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                logcolors.info("| [Debug] |: RETURN");
                                                                                break firstLoop;
                                                                            }
                                                                        }
                                                                    }
                                                                    if (hisMaxSets > 0) {
                                                                        refloow.chatMessage(SENDER, "/pre ⚠️ There are not enough sets. Please try again later.");
                                                                    } else {
                                                                        logcolors.info("| [Debug] |: -SENDING");
                                                                        t.addTheirItems(theirRef);
                                                                        t.data("commandused", "Buy");
                                                                        t.data("amountofref", n);
                                                                        t.data("amountofsets", amountofsets.toString());
                                                                        t.data("index", setsThatShouldntBeSent.length);
                                                                        setsThatShouldntBeSent.push(t.itemsToGive);
                                                                        t.send((ERR, STATUS) => {
                                                                            if (ERR) {
                                                                                refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                                logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                            } else {
                                                                                refloow.chatMessage(SENDER, "/me ✔️ Trade Sent! Confirming it...");
                                                                                logcolors.info("| [Steam] |: Trade offer sent!");
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            } else {
                                                                refloow.chatMessage(SENDER, "/pre There are currently not enough sets that you have not used in stock for this amount of Refined Metal.");
                                                            }
                                                            // TO HERE
                                                        } else {
                                                            logcolors.fail("| [Steam] |: An error occurred while getting badges: " + ERR);
                                                        }
                                                    } else {
                                                        refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while getting your badges. Please try again.");
                                                        logcolors.fail("| [Steam] |: An error occurred while loading badges: " + ERR);
                                                    }
                                                });
                                            }
                                        } else {
                                            logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                            refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while loading your inventory, please make sure it's set to public.");
                                        }
                                    }
                                });
                            } else {
                                refloow.chatMessage(SENDER, "/pre ⚠️ Please make sure you don't have a trade hold!");
                            }
                        });
                    } else {
                        refloow.chatMessage(SENDER, "/pre ⚠️ Please try a lower amount of Refined Metal.");
                    }
                } else {
                    refloow.chatMessage(SENDER, "/pre ⚠️ Please provide a valid amount of Refined Metal.");
                }
            } else {
                refloow.chatMessage(SENDER, "/pre ⚠️ Each set costs 2 ref. Try again using an even amount of Refined Metal.");
            }
        } else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }


    } else if (MSG.toUpperCase().indexOf("!BUYHYDRA") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYHYDRA ", ""),
                amountofsets = parseInt(n) * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSHYDRA;
        if(method.UserBuyingWithHydra()) {
			
           var marketName=CONFIG.HYDRAKEY;
		   
							f.getHisKeys(n,manager,SENDER,730,2,botSets,amountofsets,setsThatShouldntBeSent,refloow,marketName,MSG,(callback) =>
							{
								logcolors.true('| [Refloow] |: Finished processing of buyhydra command!');
								
							});
                        
        } else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
		
    }

		
	} else if (MSG.toUpperCase().indexOf("!BUYCS") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYCS ", ""),
                amountofsets = parseInt(n) * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS;
        if(method.UserBuyingWithCSGO()) {
			var marketName=CONFIG.ACCEPTEDKEYS;
		   
							f.getHisKeys(n,manager,SENDER,730,2,botSets,amountofsets,setsThatShouldntBeSent,refloow,marketName,MSG,(callback) =>
							{
								logcolors.true('| [Refloow] |: Finished processing of buycs command!');
							});
		}
            else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

        } else if (MSG.toUpperCase().indexOf("!BUYTF") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYTF ", ""),
                amountofsets = parseInt(n) * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSTF2;
        if(method.UserBuyingWithTF2()) {
            var marketName=CONFIG.TF2KEY;
		   
							f.getHisKeys(n,manager,SENDER,440,2,botSets,amountofsets,setsThatShouldntBeSent,refloow,marketName,MSG,(callback) =>
							{
								logcolors.true('| [Refloow] |: Finished processing of buytf command!');
							});
        } else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

        } else if (MSG.toUpperCase().indexOf("!BUYGEMS") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYGEMS ", ""),
                amountofgems = parseInt(n) * CONFIG.CARDS.BUY1GEMSFORAMOUNTOFSETS;
        if(method.UserBuyingWithGems()) {
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                            refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while getting your trade holds. Please try again");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            n = parseInt(n);
                            let theirGems = [];
                            logcolors.true('| [Refloow] |: Processing of !buyGems request');
                            refloow.chatMessage(SENDER, "/me Processing your request.");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), 753, 6, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                    refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while loading your inventory. Please try later");
                                } else {
                                    logcolors.info("| [Debug] |: Inventory Loaded");
                                    if (!ERR) {
                                        
                                        INV = INV.filter((ITEM) => ITEM.getTag("item_class").internal_name == "item_class_7");
                    if(INV==null || INV.length==0)
                    {
                    logcolors.info("| [Debug] |: User does not have any gems at all.");
                    refloow.chatMessage(SENDER.getSteamID64(),"/pre ⚠️ Looks like your inventory doesn't have any gems at all. Please try after you have them.");
                    }
                    else{
                    
                      if (INV[0].amount < amountofgems) {
                      logcolors.fail("| [Debug] |: User does not have enough gems." );
                                            refloow.chatMessage(SENDER, "/pre ⚠️ Please make sure you have enough unpacked gems.");

                      } 
                    
                    else {
                      INV[0].amount=amountofgems.toString();
                      theirGems.push(INV[0]);
                                            Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                                                if (!ERR) {
                                                    logcolors.info("| [Debug] |: DEBUG#BADGE LOADED");
                                                    if (!ERR) {
                                                        let b = {}; // List with badges that CAN still be crafted
                                                        if (DATA) {
                                                            for (let i = 0; i < Object.keys(DATA).length; i++) {
                                                                if (DATA[Object.keys(DATA)[i]] < 6) {
                                                                    b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                                                }
                                                            }
                                                        } else {
                                                            refloow.chatMessage(SENDER.getSteamID64(), "/pre Your badges are empty, sending an offer without checking badges.");
                                                        }
                                                        
                                                        
                                                        
          // TODO: COUNT AMOUNT OF SETS BOT CAN GIVE HIM
          // 1: GET BOTS CARDS. DONE
          // 2: GET PLAYER's BADGES. DONE
          // 3: MAGIC
          let hisMaxSets = 0,
            botNSets = 0;
          // Loop for sets he has partially completed
		  
          for (let i = 0; i < Object.keys(b).length; i++) {
			 
            if (botSets[Object.keys(b)[i]] && Object.values(b)[i]>0) {
              hisMaxSets += Math.min(5,botSets[Object.keys(b)[i]].length,Object.values(b)[i]);
        
            }
          }
          // Loop for sets he has never crafted
          for (let i = 0; i < Object.keys(botSets).length; i++) {
			   
            if (Object.keys(b).indexOf(Object.keys(botSets)[i]) < 0) {
              if (botSets[Object.keys(botSets)[i]].length >= 5) {
                hisMaxSets += 5;
              } else {
                hisMaxSets += botSets[Object.keys(botSets)[i]].length;
              }
            }
            botNSets += botSets[Object.keys(botSets)[i]].length;
          }
		  //console.log("Number of sets:"+n);
		  //console.log("His max sets:"+hisMaxSets);
		  //logcolors.info("| [Debug] |: Number of sets:"+n ");
                                                        logcolors.info("| [Debug] |: Loop 2 DONE");
                                                        // HERE
                                                        if (n <= hisMaxSets) {
                                                            hisMaxSets = n;
                                                            logcolors.info("| [Debug] |: Trade Created");
                                                            sortSetsByAmount(botSets, (DATA) => {
                                                                logcolors.info("| [Debug] |:" + DATA);
                                                                logcolors.info("| [Debug] |: Sets Sorted");
                                                                firstLoop: for (let i = 0; i < DATA.length; i++) {
																	
                                                                    if (b[DATA[i]] == 0) {
                                                                        continue firstLoop;
                                                                    } else {
                                                                        logcolors.info("| [Debug] |: DEBUG#" + i);
                                                                        logcolors.info("| [Debug] |: DEBUG FOR LOOP ITEMS");
                                                                        if (hisMaxSets > 0) {
                                                                            logcolors.info("| [Debug] |: DEBUG# MAXSETSMORETHAN1");
                                                                            if (b[DATA[i]] && botSets[DATA[i]].length >= b[DATA[i]]) {
																				
                                                                                // BOT HAS ENOUGH SETS OF THIS KIND
                                                                                logcolors.info("| [Debug] |: Loop 1");
                                                                                sLoop: for (let j = 0; j < b[DATA[i]]; j++) {
                                                                                   if(hisMaxSets>0){
                                                                                        logcolors.info("| [Debug] |: loop #1 CONTINUE: ITEM ADD");
                                                                                        logcolors.info("| [Debug] |: DEBUG#LOOP #1: " + botSets[DATA[i]][j]);
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        hisMaxSets--;
																				   }
                                                                                        
                                                                                    
                                                                                }
                                                                            } else if (b[DATA[i]] && botSets[DATA[i]].length < b[DATA[i]]) {
                                                                                // BOT DOESNT HAVE ENOUGH SETS OF THIS KIND
                                                                                sLoop: for (let j = 0; j < botSets[DATA[i]].length; j++) {
                                                                                   if(hisMaxSets>0){
                                                                                        logcolors.info("| [Debug] |: loop #1 CONTINUE: ITEM ADD");
                                                                                        logcolors.info("| [Debug] |: DEBUG#LOOP #1: " + botSets[DATA[i]][j]);
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        hisMaxSets--;
																				   }
                                                                                    
                                                                                } // *
                                                                            } else if (!b[DATA[i]]) { // TODO NOT FOR LOOP WITH BOTSETS. IT SENDS ALL
                                                                                // BOT HAS ENOUGH SETS AND USER NEVER CRAFTED THIS
																				
                                                                                bLoop: for (let j = 0; j < Math.min(5,botSets[DATA[i]].length); j++) {
                                                                                    if (botSets[DATA[i]][j] && hisMaxSets > 0) {
                                                                                        t.addMyItems(botSets[DATA[i]][j]);
                                                                                        logcolors.info("| [Debug] |: loop #2 CONTINUE: ITEM ADD");
                                                                                        hisMaxSets--;
                                                                                    } else {
                                                                                        logcolors.info("| [Debug] |: loop #2 CONTINUE: RETURN");
                                                                                        continue firstLoop;
                                                                                    }
                                                                                }
                                                                            }
                                                                            
                                                                        } else {
                                                                            logcolors.info("| [Debug] |: RETURN");
                                                                            break firstLoop;
                                                                        }
																	}
                                                                }
                                                                if (hisMaxSets > 0) {
                                                                    refloow.chatMessage(SENDER, "/pre ⚠️ There are not enough sets. Please try again later.");
                                                                } else {
                                                                    logcolors.info("| [Debug] |: -SENDING");
                                                                    t.addTheirItems(theirGems);
                                                                    t.data("commandused", MSG);
                                                                    t.data("quantity", amountofgems);
                                                                    t.data("amountofsets", n.toString());
                                                                    t.data("index", setsThatShouldntBeSent.length);
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                            logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            refloow.chatMessage(SENDER, "/me ✔️ Trade Sent! Confirming it...");
                                                                            logcolors.info("| [Steam] |: Trade offer sent!");
																			logcolors.summary("| [Summary] |: Bot sent " + n + " set(s) for his " + amountofgems + " gems");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            refloow.chatMessage(SENDER, "/pre ⚠️ There are currently not enough sets that you have not used in stock for this amount of Gems.");
                                                        }
                                                        // TO HERE
                                                    } else {
                                                        logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while getting your badges. Please try again.");
                                                    logcolors.fail(SENDER, "| [Steam] |: An error occurred while loading badges: " + ERR);
                                                }
                                            });
                                         }
                    }
                                    } else {
                                        logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            });
                        } else {
                            refloow.chatMessage(SENDER, "/pre ⚠️ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    refloow.chatMessage(SENDER, "/pre ⚠️ Please try a lower amount of Gems.");
                }
            } else {
                refloow.chatMessage(SENDER, "/pre ⚠️ Please provide a valid amount of Sets.");
            }
        } else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

        } else if (MSG.toUpperCase().indexOf("!BUY") >= 0) {
			
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUY ", ""),
                amountofsets = parseInt(n) * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS;
        if(method.UserBuying()) {
            var marketName=CONFIG.ACCEPTEDKEYS;
		   
							f.getHisKeys(n,manager,SENDER,730,2,botSets,amountofsets,setsThatShouldntBeSent,refloow,marketName,(callback) =>
							{
								logcolors.true('| [Refloow] |: Finished processing of buy command!');
							});
		}							else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }





//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*

//---------------------------------------------------------------------------------------------------------------------//
//                                                                                                                     //
//                                    FROM HERE IS SECTION WITH SELL COMMANDS                                          //
//                                                                                                                     //
//---------------------------------------------------------------------------------------------------------------------// 

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*






// SELL COMMAND WHICH USES HYDRA AS CURRENCY TO PAY WITH

    } else if (MSG.toUpperCase().indexOf("!SELLHYDRA") >= 0) {
        if (botSets) {
               let n = parseInt(MSG.toUpperCase().replace("!SELLHYDRA ", "")),
                    amountofsets = n * CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETSHYDRA;
            if(method.UserSellingWithHydra()) {
                var marketName=CONFIG.HYDRAKEY;
		   
							f.getHisSets(n,manager,SENDER,730,2,botSets,amountofsets,setsThatShouldntBeSent,refloow,marketName,community,allCards,MSG,(callback) =>
							{
								logcolors.true('| [Refloow] |: Finished processing of sellhydra command!');
							});
        } else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

// !SELLCSGO COMMAND THAT USES CS GO KEYS AS CURRENCY TO PAY WITH      

        } else if (MSG.toUpperCase().indexOf("!SELLCS") >= 0) {
        if (botSets) {
               let n = parseInt(MSG.toUpperCase().replace("!SELLCS ", "")),
                    amountofsets = n * CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETS;
            if(method.UserSellingWithCSGO()) {
               var marketName=CONFIG.ACCEPTEDKEYS;
		   
							f.getHisSets(n,manager,SENDER,730,2,botSets,amountofsets,setsThatShouldntBeSent,refloow,marketName,community,allCards,MSG,(callback) =>
							{
								logcolors.true('| [Refloow] |: Finished processing of sellcs command!');
							});
        } else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

// !SELLTF2 COMMAND THAT USES TF2 KEYS AS CURRENCY TO PAY WITH  

    } else if (MSG.toUpperCase().indexOf("!SELLTF") >= 0) {
        if (botSets) {
                let n = parseInt(MSG.toUpperCase().replace("!SELLTF ", "")),
                    amountofsets = n * CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETSTF2;
			
            if(method.UserSellingWithTF2()) {
                var marketName=CONFIG.TF2KEY;
		   
							f.getHisSets(n,manager,SENDER,440,2,botSets,amountofsets,setsThatShouldntBeSent,refloow,marketName,community,allCards,MSG,(callback) =>
							{
								logcolors.true('| [Refloow] |: Finished processing of selltf command!');
							});
        } else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

      } else if (MSG.toUpperCase().indexOf("!SELLGEMS") >= 0) {
        if (botSets) {
               let n = parseInt(MSG.toUpperCase().replace("!SELLGEMS ", "")),
                    amountofgems = n * CONFIG.CARDS.GIVE1GEMSFORAMOUNTOFSETSGEMS;
            if(method.UserSellingWithGems) {
                if (!isNaN(n) && parseInt(n) > 0) {
                    if (n <= CONFIG.MAXSELL) {
                      logcolors.true('| [Refloow] |: Processing of !sellgems request');
                        refloow.chatMessage(SENDER, "/me ✔️ Processing your request.");
                        let botGems = [],
                            t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                                refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while getting your trade holds. Please try again");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                manager.getUserInventoryContents(refloow.steamID.getSteamID64(), 753, 6, true, (ERR, INV, CURR) => {
                                    if (ERR) {
                                        logcolors.fail("| [Steam] |: An error occurred while getting bot inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while loading the bot's inventory. Please try again.");
                                    } else {
                    
										INV = INV.filter((ITEM) => ITEM.getTag("item_class").internal_name == "item_class_7");
                                        
                                        if (INV[0]==null) {
											logcolors.info("| [Debug] |: We do not have enough gems for this trade");
                                            refloow.chatMessage(SENDER, "/pre ⚠️ The bot does not have enough gems for this trade.");
                                        } else {
                      if(INV[0].amount>=amountofgems)
                      {
                      INV[0].amount=amountofgems;
                      botGems.push(INV[0]);
                                            let amountofB = n;
                                            Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
                                                if (!ERR) {
                                                    let s = DATA;
                                                    Utils.getSets(s, allCards, (ERR, DDATA) => {
                                                        if (!ERR) {
                                                            sortSetsByAmountB(s, (DATA) => {
															
                                                                let setsSent = {};
                                                                firsttLoop: for (let i = 0; i < DATA.length; i++) {
                                                                   // console.log(setsSent);
                                                                    //console.log(DATA[i]);
																	var loop;
                                                                    if (DDATA[DATA[i]]) {
																		if(botSets[DATA[i]])
																		{	
																			if(botSets[DATA[i]].length>=CONFIG.MAXSTOCKSETSPERGAME)
																			{
																				continue;
																			}
																			else
																			{
																				var total = botSets[DATA[i]].length + DDATA[DATA[i]].length;
																				if(total>CONFIG.MAXSTOCKSETSPERGAME)
																				{
																					if(DDATA[DATA[i]].length >= CONFIG.MAXSTOCKSETSPERGAME)
																						{
																							loop= CONFIG.MAXSTOCKSETSPERGAME-botSets[DATA[i]].length;
																						}
																					else
																					{
																						var left = CONFIG.MAXSTOCKSETSPERGAME - DDATA[DATA[i]].length;
																						loop = (left>DDATA[DATA[i]].length) ? DDATA[DATA[i]].length:left;
																					}
																				}
																				else
																				{
																					loop=DDATA[DATA[i]].length;
																				}
																			}
																		}
																		else
																		{
																			loop = Math.min(DDATA[DATA[i]].length,CONFIG.MAXSTOCKSETSPERGAME);
																		}
																			
                                                                        for (let j = 0; j < loop; j++) {
                                                                            if (amountofB > 0) {
                                                                                if ((setsSent[DATA[i]] && setsSent[DATA[i]] < CONFIG.MAXSETSELL ) || !setsSent[DATA[i]]) {
                                                                                    t.addTheirItems(DDATA[DATA[i]][j]);
                                                                                    logcolors.info("| [Debug] |: loop #2 CONTINUE: ITEM ADD");
                                                                                    amountofB--;
                                                                                    if (!setsSent[DATA[i]]) {
                                                                                        setsSent[DATA[i]] = 1;
                                                                                    } else {
                                                                                        setsSent[DATA[i]] += 1;
                                                                                    }
                                                                                } else {
                                                                                    logcolors.info("| [Debug] |: loop #2 CONTINUE: RETURN");
                                                                                    continue firsttLoop;
                                                                                }
                                                                            } else {
                                                                                logcolors.info("| [Debug] |: loop #2 CONTINUE: RETURN");
                                                                                continue firsttLoop;
                                                                            }
                                                                        }
                                                                    } else {
                                                                        logcolors.info("| [Debug] |: loop #2 CONTINUE: RETURN 2");
                                                                        continue firsttLoop;
                                                                    }
                                                                }
                                                            });
                                                            if (amountofB > 0) {
                                                                refloow.chatMessage(SENDER, "/pre ⚠️ You do not have enough sets, (this bot only keeps total "+ CONFIG.MAXSTOCKSETSPERGAME+" games in stock at a time ). Please try again later.");
                                                            } else {
                                                                logcolors.info("| [Debug] |: -SENDING");
                                                                t.addMyItems(botGems);
                                                                t.data("commandused", MSG);
                                                                t.data("amountofsets", n.toString());
                                                                t.data("quantity", amountofgems);
                                                                t.send((ERR, STATUS) => {
                                                                    if (ERR) {
                                                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                        logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                    } else {
                                                                        refloow.chatMessage(SENDER, "/me ✔️ Trade Sent! Confirming it...");
                                                                        logcolors.info("| [Steam] |: Trade offer sent!");
																		logcolors.summary("| [Summary] |: Bot sent " + amountofgems + " gems for his " + n + " set(s)");
                                                                    }
                                                                });
                                                            }
                                                        } else {
                                                            logcolors.fail("| [Inventory] |: An error occurred while getting bot gems: " + ERR);
                                                        }
                                                    });
                                                } else {
                                                    logcolors.fail("| [Inventory] |: An error occurred while loading user inventory: " + ERR);
                                                }
                                            });
                                        
                      }
                      else
                      {
                        logcolors.fail("| [Inventory] |: An error occurred while getting bot gems: " + ERR);
                        refloow.chatMessage(SENDER, "/pre Bot does not have enough gems.Please try again later");
                      }
                      
                      }
                                    }
                                });
                            } else {
                                refloow.chatMessage(SENDER, "/pre ⚠️ Please make sure you don't have a trade hold!");
                            }
                        });
                    } else {
                        refloow.chatMessage(SENDER, "/pre ⚠️ Please try a lower amount of sets.");
                    }
                } else {
                    refloow.chatMessage(SENDER, "/pre ⚠️ Please enter a valid amount of sets!");
                }
        } else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

    // !SELL COMMAND - USSES MAIN BOT CURRENCY SET INSIDE OF THE CONFIG FILE TO PAY


    } else if (MSG.toUpperCase().indexOf("!SELL") >= 0) {
        if (botSets) {
               let n = parseInt(MSG.toUpperCase().replace("!SELL ", "")),
                    amountofsets = n * CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETS;
            if(method.UserSell()) {
                let n = parseInt(MSG.toUpperCase().replace("!SELLCSGO ", "")),
                    amountofsets = n * CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETS;
            if(method.UserSellingWithCSGO()) {
               var marketName=CONFIG.ACCEPTEDKEYS;
		   
							f.getHisSets(n,manager,SENDER,730,2,botSets,amountofsets,setsThatShouldntBeSent,refloow,marketName,allCards,(callback) =>
							{
								logcolors.true('| [Refloow] |: Finished processing of sellcsgo command!');
							});
        } else {
            refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }
		}
    
// START OF THE ADMIN COMMANDS 

    } else if (CONFIG.ADMINS.indexOf(SENDER.getSteamID64()) >= 0 || CONFIG.ADMINS.indexOf(parseInt(SENDER.getSteamID64())) >= 0) {
        // Admin commands.
        if (MSG.toUpperCase().indexOf("!BLOCK") >= 0) {
            let n = MSG.toUpperCase().replace("!BLOCK ", "").toString();
            if (SID64REGEX.test(n)) {
                refloow.chatMessage(SENDER, "/me ✔️ User blocked.");
                refloow.blockUser(n);
            } else {
                refloow.chatMessage(SENDER, "/pre ⚠️ Please provide a valid SteamID64");
            }
        }
		
		else if(MSG.toUpperCase().indexOf("!ADMINCOMMANDS") >=0)
		{
			var message="/code <--------------------------- Admin Commands --------------------------->\n\n";
			
			   message+="!block [steamID] - Block user with given steamID\n";
			   message+="!usercheck [steamID] - Check how many sets bot has, for user with given steamID\n";
			   message+="!withdraw - withdraw all TF2 keys\n";
         message+="!restart - restarts the bot\n";
         message+="!exit - stops the bot and exits gracefully\n";
         message+="!refresh - refreshes the bot\n";
         message+="!pause5m - pauses bot for 5 min and then proceed with an restart\n";
         message+="!pause10m - pauses bot for 10 min and then proceed with an restart\n";
         message+="!pause1h - pauses bot for 1 hour and then proceed with an restart\n";
         message+="!pause2h - pauses bot for 2 hours and then proceed with an restart\n";
			   message+="!donatesets - with this, you can donate sets to bot\n";
			   message+="!broadcastall - any message after this command will be sent to all users in bots's friendlist\n";
			   message+="!broadcast - only send message to users who have, done !reminder ON\n";
			   
			refloow.chatMessage(SENDER,message);
		}

		else if (MSG.toUpperCase().indexOf("!USERCHECK") >= 0) {
            let n = MSG.toUpperCase().replace("!USERCHECK ", "").toString();
            if (SID64REGEX.test(n)) {
                if (Object.keys(botSets).length > 0) {
                    refloow.chatMessage(SENDER, "/me ✔️ Loading badges...");
                    Utils.getBadges(n, (ERR, DATA) => {
                        if (!ERR) {
                            let b = {}; // List with badges that CAN still be crafted
                            if (DATA) {
                                for (let i = 0; i < Object.keys(DATA).length; i++) {
                                    if (DATA[Object.keys(DATA)[i]] < 6) {
                                        b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                    }
                                }
                            } else {
                                refloow.chatMessage(SENDER.getSteamID64(), n + "'s badges are empty, sending an offer without checking badges.");
                            }
                            // console.log(b);
                            // TODO: COUNT AMOUNT OF SETS BOT CAN GIVE HIM
                            // 1: GET BOTS CARDS. DONE
                            // 2: GET PLAYER's BADGES. DONE
                            // 3: MAGIC
                            let hisMaxSets = 0,
                                botNSets = 0;
                            // Loop for sets he has partially completed
                            for (let i = 0; i < Object.keys(b).length; i++) {
                                if (botSets[Object.keys(b)[i]] && botSets[Object.keys(b)[i]].length >= 5 - b[Object.keys(b)[i]].length) {
                                    hisMaxSets += 5 - b[Object.keys(b)[i]].length;
                                }
                            }
                            // Loop for sets he has never crafted
                            for (let i = 0; i < Object.keys(botSets).length; i++) {
                                if (Object.keys(b).indexOf(Object.keys(botSets)[i]) < 0) {
                                    if (botSets[Object.keys(botSets)[i]].length >= 5) {
                                        hisMaxSets += 5;
                                    } else {
                                        hisMaxSets += botSets[Object.keys(botSets)[i]].length;
                                    }
                                }
                                botNSets += botSets[Object.keys(botSets)[i]].length;
                            }
                            refloow.chatMessage(SENDER, "/pre There are currently " + hisMaxSets + "/" + botNSets + " sets available which " + n + " has not fully crafted yet. Buying all of them will cost " + parseInt(hisMaxSets / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS * 100) / 100 + " keys.");
                        } else {
                            refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while getting " + n + "'s badges. Please try again.");
                            logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
                        }
                    });
                } else {
                    refloow.chatMessage(SENDER, "/pre ⚠️ Please try again later.");
                }
            } else {
                refloow.chatMessage(SENDER, "/pre ⚠️ Please provide a valid SteamID64.");
            }
        }

    // Withdraw command

		else if (MSG.toUpperCase() == "!WITHDRAW") {
			let t = manager.createOffer(SENDER.getSteamID64());
            manager.getInventoryContents(440, 2, true, (ERR, INV, CURR) => {
                if (ERR) {
                    refloow.chatMessage(SENDER, "/pre ⚠️ An error occurred while loading the bot's inventory.");
                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                } else {
					refloow.chatMessage(SENDER, "/me ✔️ Bot's inventory loaded.");
                    logcolors.info("| [Inventory] |: Bot's inventory loaded.");
                    
                    for (let i = 0; i < INV.length; i++) {
						
                        if (CONFIG.TF2KEY.indexOf(INV[i].market_hash_name) >= 0) {
                            t.addMyItem(INV[i]);
							logcolors.info("| [Offer] |: Key added to trade ");
						}
					}
					t.send();
                }
            });
      }
	  
		

    // Admin command RESTART

    else if (MSG.toUpperCase().indexOf("!RESTART") >= 0) {
      logcolors.true('| [Refloow] |: Restarting the bot...');
      refloow.logOff();
      logcolors.info('| [Refloow] |: Logged off... Waiting 15 sec for exceed limit');
      setTimeout(() => {
      logon();
      }, 15000);
    }
    
    // Admin command !EXIT (Stops bot totally from functioning by logging it off of an account)

    else if (MSG.toUpperCase().indexOf("!EXIT") >= 0) {
      logcolors.true('| [Refloow] |: Received forcestop command, exiting...');
            refloow.logOff();
    }

    else if (MSG.toUpperCase().indexOf("!REFRESH") >= 0) {
      logcolors.true('| [Refloow] |: Refreshing the bot...');
          refloow.setPersona(1);
    }

    // Admin command !pause (Pauses bot for 2 hours and then restart)

    else if (MSG.toUpperCase().indexOf("!PAUSE5M") >= 0) {
      logcolors.true('| [Refloow] |: Pausing the bot for next 5 min ...');
      refloow.logOff();
      logcolors.info('| [Refloow] |: Bot does not respond on any requests in next 5 min after that it will restart.');
      setTimeout(() => {
      logon();
      }, 300000); // Timer is set to 5 min
    }

    else if (MSG.toUpperCase().indexOf("!PAUSE10M") >= 0) {
      logcolors.true('| [Refloow] |: Pausing the bot for next 10 min ...');
      refloow.logOff();
      logcolors.info('| [Refloow] |: Bot does not respond on any requests in next 10 min after that it will restart.');
      setTimeout(() => {
      logon();
      }, 600000); // Timer is set to 10 min
    }

    else if (MSG.toUpperCase().indexOf("!PAUSE1H") >= 0) {
      logcolors.true('| [Refloow] |: Pausing the bot for next 1 hours ...');
      refloow.logOff();
      logcolors.info('| [Refloow] |: Bot does not respond on any requests in next 1 hour after that it will restart.');
      setTimeout(() => {
      logon();
      }, 3600000); // Timer is set to 1 hour
    }

    else if (MSG.toUpperCase().indexOf("!PAUSE2H") >= 0) {
      logcolors.true('| [Refloow] |: Pausing the bot for next 2 hours ...');
      refloow.logOff();
      logcolors.info('| [Refloow] |: Bot does not respond on any requests in next 2 hours after that it will restart.');
      setTimeout(() => {
      logon();
      }, 7200000); // Timer is set to 2 hours
    }

		 
	 else if (MSG.toUpperCase().indexOf("!DONATESETS") >= 0) {
			if (botSets) {
				let n = parseInt(MSG.toUpperCase().replace("!DONATESETS ", "")),
					amountofsets = n;
					
					f.donateSets(n,manager,SENDER,amountofsets,setsThatShouldntBeSent,refloow,community,allCards,(callback) => {
							logcolors.true('| [Refloow] |: Finished processing !donateSets request');
		});
			}

  // Broadcastall command - sends an message to everyone in the friendlist 
	
	} else if (MSG.indexOf("!broadcastall") >=0)
	{
		var msg = MSG.replace("!broadcastall ","");
		
		var friends = refloow.myFriends
		Object.keys(friends).forEach( ( id ) => 
		{
			refloow.chatMessage(id,msg);
		});
	}
	
  // Broadcast reminder command - broadcasts the reminder to everyone when called

	else if (MSG.indexOf("!broadcast") >=0)
	{
		var msg = MSG.replace("!broadcast ","");
		
		fs.readFile("./app/[DB] UserData/reminder.json",(ERR,ids) =>
			{
				let steamids=JSON.parse(ids).IDS;
				steamids.forEach((id) => {
					refloow.chatMessage(id,msg);
				});
			}	
		);
	}
	
	else {

 // This is displayed to admins when command is not recognized.
    
     refloow.chatMessage(SENDER, "/pre ⚠️ Command not recognized. Type !commands or !admincommands to see all the commands.");;
    }
	
}
	
	
// This is displayed to normal users when command is not recognized.

	else {
     refloow.chatMessage(SENDER, "/pre ⚠️ Command not recognized. Type !commands or !help to see all the commands.");;
  } 
});		









manager.on("sentOfferChanged", (OFFER, OLDSTATE) => {
    if (OFFER.state == 2) {
        refloow.chatMessage(OFFER.partner, "Trade confirmed! Click here to accept it: https://www.steamcommunity.com/tradeoffer/" + OFFER.id);
    } else if (OFFER.state == 3) {
        Utils.getInventory(refloow.steamID.getSteamID64(), community, (ERR, DATA) => {
            if (!ERR) {
                let s = DATA;
                Utils.getSets(s, allCards, (ERR, DATA) => {
                    if (!ERR) {
                        botSets = DATA;
                        logcolors.info("| [Steam] |: Bot's sets loaded.");
                    } else {
                        logcolors.fail("| [Inventory] |: An error occurred while getting bot sets: " + ERR);
                    }
                    let botNSets = 0;
                    for (let i = 0; i < Object.keys(botSets).length; i++) {
                        botNSets += botSets[Object.keys(botSets)[i]].length;
                    }
                    totalBotSets = botNSets;
                    let playThis = CONFIG.PLAYGAMES;
                    if (CONFIG.PLAYGAMES && typeof(CONFIG.PLAYGAMES) == "string") {
                        playThis = parseString(playThis, totalBotSets);
                    }
                    refloow.gamesPlayed(playThis);
                });
            } else {
                logcolors.fail("| [Steam] |: An error occurred while getting bot inventory: " + ERR);
            }
        });
        if (CONFIG.INVITETOGROUPID) {
            refloow.inviteToGroup(OFFER.partner, CONFIG.INVITETOGROUPID);
        }
        let d = "" + OFFER.data("commandused") + "";
        d += "\nSets: " + OFFER.data("amountofsets");
        d += "\nQuantity: " + OFFER.data("quantity");
        d += "\nSteamID: " + OFFER.partner.getSteamID64();
        fs.writeFile("./app/[DB] TradesAccepted/" + OFFER.id + "-" + OFFER.partner.getSteamID64() + ".txt", d, (ERR) => {
            if (ERR) {
                logcolors.fail("| [Steam] |: An error occurred while writing trade file: " + ERR);
            }
        });
			for(var i=0;i<CONFIG.ADMINS.length;i++)
			{
				refloow.chatMessage(CONFIG.ADMINS[i],"New trade accepted!\n"
				+ d + "\n" + "https://steamcommunity.com/profiles/"+ OFFER.partner.getSteamID64()+"/");
			}
        community.getSteamUser(OFFER.partner, (ERR, USER) => {
            if (ERR) {
                logcolors.fail("| [Steam] |: An error occurred while getting user profile: " + ERR);
                refloow.chatMessage(OFFER.partner, "An error occurred while getting your profile (to comment).");
            } else {
                if(method.TradeCommentEnabled()) {
                    USER.comment(CONFIG.COMMENTAFTERTRADE, (ERR) => {
                        if (ERR) {
                            logcolors.fail("| [Steam] |: An error occurred while commenting on user profile: " + ERR);
                            refloow.chatMessage(OFFER.partner, "An error occurred while getting commenting on your profile.");
                        } else {
                            refloow.chatMessage(OFFER.partner, "Thanks for trading! :D");
                        }
                    });
                }
            }
        });
    } else if (OFFER.state == 6) {
        refloow.chatMessage(OFFER.partner, "Hey, you did not accept the offer. Please try again if you wish to receive sets!");
    }
});

manager.on("newOffer", (OFFER) => {
    if (CONFIG.ADMINS.indexOf(OFFER.partner.getSteamID64()) >= 0 || CONFIG.ADMINS.indexOf(parseInt(OFFER.partner.getSteamID64())) >= 0) {
        OFFER.getUserDetails((ERR, ME, THEM) => {
            if (ERR) {
                logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                refloow.chatMessage(OFFER.partner, "An error occurred while getting your trade holds. Please try again");
              
            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                OFFER.accept((ERR) => {
                    if (ERR) {
                        logcolors.fail("| [Steam] |: An error occurred while declining trade: " + ERR);
                        
                    } else {
                        refloow.chatMessage(OFFER.partner, "Offer accepted!");
                        logcolors.true("| [Offers] |: New offer has been accepted !");
                    }
                });
            } else {
                refloow.chatMessage(OFFER.partner, "Please make sure you don't have a trade hold!");
            }
        });
    } else if (OFFER.itemsToGive.length == 0) {
        OFFER.accept((ERR) => {
            logcolors.true("| [Donations] |: DONATION ACCEPT");
        });
    } else {
        OFFER.decline((ERR) => {
            if (ERR) {
                logcolors.fail("| [Steam] |: An error occurred while declining trade: " + ERR);
            }
        });
    }
});

community.on("newConfirmation", (CONF) => {
    logcolors.info("| [Steam] |: New confirmation.");
    community.acceptConfirmationForObject(CONFIG.IDENTITYSECRET, CONF.id, (ERR) => {
        if (ERR) {
            logcolors.fail("| [Steam] |: An error occurred while accepting confirmation: " + ERR);
        } else {
            logcolors.info("| [Steam] |: Confirmation accepted.");
        }
    });
});

function sortSetsByAmount(SETS, callback) {
    callback(Object.keys(SETS).sort((k1, k2) => SETS[k1].length - SETS[k2].length).reverse());
}

function sortSetsByAmountB(SETS, callback) {
    callback(Object.keys(SETS).sort((k1, k2) => SETS[k1].length - SETS[k2].length));
}


function parseString(INPUT, SETS) {
    return INPUT.replace(":sets:", SETS);
}


// Copyright notice:

/* Original work: Copyright (c) 2020-2021 Refloow All rights reserved.
  Code origin (Free GitHub publish): https://github.com/Refloow/Steam-Card-Bot-PRO*/
