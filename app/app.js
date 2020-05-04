// Steam-Card-Bot-PRO built by Refloow (-MajokingGames)

/* 
  Here is contact info: refloowlibrarycontact@gmail.com
  or main dev steam: https://steamcommunity.com/id/MajokingGames/

*/


// Checking if all modules are correctly installed

try {
    // Checking if module steam-user is correctly installed
    SteamUser = require("steam-user");
    // Checking if module steam-totp is correctly installed
    SteamTotp = require("steam-totp");
    // Checking if module steam-tradeoffer-manager is correctly installed
    TradeOfferManager = require("steam-tradeoffer-manager");
    // Checking if module steamcommunity is correctly installed 
    SteamCommunity = require("steamcommunity");
    // Checking if module fs is correctly installed
    fs = require("fs");
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
    logcolors= require("../app/logcolors.js")
    allCards = {},
    botSets = {},
    users = {},
    userMsgs = {},
    SID64REGEX = new RegExp(/^[0-9]{17}$/),
    chatLogs = "",
    userLogs = {},
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

// Checking for correct version (updates) for bot on github

method.check();

// Reading users data from users file to remove inactive friends

fs.readFile("./app/UserData/Users.json", (ERR, DATA) => {
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
        logcolors.info("| [Inventory] |: Card data loaded. [" + Object.keys(DATA).length + "]");
    } else {
        logcolors.fail("| [Inventory] |: An error occurred while getting cards: " + ERR);
    }
});

// Loging on

refloow.logOn({
    accountName: CONFIG.USERNAME,
    password: CONFIG.PASSWORD,
    twoFactorCode: SteamTotp.getAuthCode(CONFIG.SHAREDSECRET)
});

// Logged on

refloow.on("loggedOn", (details, parental) => {
    refloow.getPersonas([refloow.steamID], (personas) => {
        logcolors.true("| [Steam] |: Logged on steam as #" + refloow.steamID + " " + personas[refloow.steamID].player_name + "");
    });
    refloow.setPersona(1);
});

// Setting web session

refloow.on("webSession", (sessionID, cookies) => {
    manager.setCookies(cookies, (ERR) => {
        if (ERR) {
            logcolors.fail("| [WebSession] |: An error occurred while setting cookies.");
        } else {
            logcolors.true("| [WebSession] |: Websession Created And Cookies Set.");
        }
    }); 
    // Add people that added the bot while it was online.
    logcolors.info(`| [Start] |: Checking for offline friend requests.`);
    for (let i = 0; i < Object.keys(refloow.myFriends).length; i++) {
        if (refloow.myFriends[Object.keys(refloow.myFriends)[i]] == 2) {
            refloow.addFriend(Object.keys(refloow.myFriends)[i]);
        }
    }
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
                    if (CONFIG.PLAYGAMES && typeof(CONFIG.PLAYGAMES[0]) == "string") {
                        playThis[0] = parseString(playThis[0], totalBotSets);
                    }
                    refloow.gamesPlayed(playThis);
                    logcolors.true(`| [Start] |: Successfully checked for offline friend requests.`)
                } else {
                    logcolors.fail("| [Inventory] |: An error occurred while getting bot sets: " + ERR);
                    process.exit();
                }
            });
        } else {
            logcolors.fail("| [Inventory] |: An error occurred while getting bot inventory: " + ERR);
        }
    });
});

// Preform relog if session expire
community.on("sessionExpired", (ERR) => {
    logcolors.info("| [WebSession] |: Session Expired. Relogging.");
    refloow.webLogOn();
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
                fs.writeFile("./app/UserData/Users.json", JSON.stringify(users), (ERR) => {
                    if (ERR) {
                        logcolors.error("| |UserData| |: An error occurred while writing UserData file: " + ERR);
                    }
                });
            } else {
                users[Object.keys(users)[i]].idleforhours += 1;
                fs.writeFile("./app/UserData/Users.json", JSON.stringify(users), (ERR) => {
                    if (ERR) {
                        logcolors.error("| |UserData| |: An error occurred while writing UserData file: " + ERR);
                    }
                });
            }
        }
    }, 1000 * 60 * 60);
}

// Declining random group invites

if(method.DecliningRandomGroupInvites()) {
  refloow.on('groupRelationship', function(sid, REL) {
      if (REL == SteamUser.EClanRelationship.Invited) {
          logcolors.info('| [Steam] |: We were asked to join steam group #'+sid );  //cyan
          refloow.respondToGroupInvite(sid, false);
          logcolors.false('| [Steam] |: Declined incoming group invite.');
      }
  });
}

// Accepting random group invites

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
    if (userLogs[SENDER.getSteamID64()]) {
        userLogs[SENDER.getSteamID64()].push(MSG);
    } else {
        userLogs[SENDER.getSteamID64()] = [];
        userLogs[SENDER.getSteamID64()].push(MSG);
    }
    if(method.ChatLogsForEachUserEnabled()) {
        fs.writeFile("./app/ChatLogs/UserLogs/" + SENDER.getSteamID64() + "-log-" + new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear() + ".json", JSON.stringify({ logs: userLogs[SENDER.getSteamID64()] }), (ERR) => {
            if (ERR) {
                logcolors.fail("| [Users] |: An error occurred while writing UserLogs file: " + ERR);
            }
        });
    }
    if(method.DailyChatLogsEnabled()) {
        chatLogs += SENDER.getSteamID64() + " : " + MSG + "\n";
        fs.writeFile("./app/ChatLogs/FullLogs/log-" + new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear() + ".txt", chatLogs, (ERR) => {
            if (ERR) {
                logcolors.fail("| [Users] |: An error occurred while writing FullLogs file: " + ERR);
            }
        });
    }
    if (Object.keys(users).indexOf(SENDER.getSteamID64()) < 0) {
        users[SENDER.getSteamID64()] = {};
        users[SENDER.getSteamID64()].idleforhours = 0;
        fs.writeFile("./app/UserData/Users.json", JSON.stringify(users), (ERR) => {
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

    if (MSG.toUpperCase() == "!COMMANDS") {
         refloow.chatMessage(SENDER, "!commands - display list of availeble commands");
          refloow.chatMessage(SENDER, "!help - display list of availeble commands");  
           refloow.chatMessage(SENDER, "!owner - display owner profile"); 
            refloow.chatMessage(SENDER, "!info - info about bot ");

            refloow.chatMessage(SENDER, "!level [your dream level] - calculates how many sets and how many keys it will cost to reach your desired level");   
           refloow.chatMessage(SENDER, "!check [amount] - shows how many sets and which level you will reach for a specific amount of CS:GO keys"); 
        if(method.SellChecking()) {
          refloow.chatMessage(SENDER, "!sellcheck command - info about bot ");
        }
        if(method.BuyCheckingOne()) { 
          refloow.chatMessage(SENDER, "!buyonecheck [amount] - shows how many sets bot have from games that you dont have badge for (Counting only 1 set from each game) ");
        }
        if(method.BuyCheckingAny()) { 
          refloow.chatMessage(SENDER, "!buyanycheck command unavailable ");
        }
                      refloow.chatMessage(SENDER, "‎-\n");

        if(method.UserBuying()) {
           refloow.chatMessage(SENDER, "!buy [amount of keys] - use this to buy card sets with main bot currency which is set. ");
        }
        if(method.UserBuyingAny()) { 
           refloow.chatMessage(SENDER, "!buyany [amount of CS:GO keys] - use this to buy that amount of CS:GO keys for any sets, even from badges that has already been crafted, following the current bot rate ");
        }
        if(method.UserBuyingOne()) { 
           refloow.chatMessage(SENDER, "!buyone [amount of CS:GO keys] - only use this if you are a badge collector. The bot will send one set of each game, by the current bot rate ");
        } 
                       refloow.chatMessage(SENDER, "‎-\n");

        if(method.UserBuyingWithRef()) {
           refloow.chatMessage(SENDER, "!buyref [amount of REF] - use this to buy sets you have not crafted yet for that amount of ref, following the current bot rate ");
        }
        if(method.UserBuyingWithHydra()) { 
           refloow.chatMessage(SENDER, "!buyhydra - info about bot ");
        } 
        if(method.UserBuyingWithCSGO()) {  
           refloow.chatMessage(SENDER, "!buycsgo - info about bot ");
        } 
        if(method.UserBuyingWithTF2()) {
           refloow.chatMessage(SENDER, "!buytf2 [amount of TF keys] - the same as !buycsgo, but you pay with TF keys ");
        } 
        if(method.UserBuyingWithGems()) {  
           refloow.chatMessage(SENDER, "!buygems - command unavailable ");
        } 
        if(method.UserBuyingWithPUBG()) {   
           refloow.chatMessage(SENDER, "!buypubg - command unavailable ");
        }
                       refloow.chatMessage(SENDER, "‎-\n"); 

        if(method.UserBuyingOneWithRef()) {
           refloow.chatMessage(SENDER, "!buyoneref - command unavailable ");
        }
        if(method.UserBuyingOneWithHydra()) { 
           refloow.chatMessage(SENDER, "!buyonehydra - command unavailable ");
        }
        if(method.UserBuyingOneWithCSGO()) { 
           refloow.chatMessage(SENDER, "!buyonecsgo - command unavailable ");
        }
        if(method.UserBuyingOneWithTF2()) { 
           refloow.chatMessage(SENDER, "!buyonetf2 - command unavailable ");
        }
        if(method.UserBuyingOneWithGems()) { 
           refloow.chatMessage(SENDER, "!buyonegems - command unavailable ");
        }
        if(method.UserBuyingOneWithPUBG()) { 
           refloow.chatMessage(SENDER, "!buyonepubg - command unavailable ");
        }
                       refloow.chatMessage(SENDER, "‎-\n");

        if(method.UserBuyingAnyWithRef()) {
           refloow.chatMessage(SENDER, "!buyanyref - command unavailable ");
        }
        if(method.UserBuyingAnyWithHydra()) { 
           refloow.chatMessage(SENDER, "!buyanyhydra - command unavailable ");
        }
        if(method.UserBuyingAnyWithCSGO()) { 
           refloow.chatMessage(SENDER, "!buyanycsgo - command unavailable ");
        }
        if(method.UserBuyingAnyWithTF2()) { 
           refloow.chatMessage(SENDER, "!buyanytf2 - command unavailable ");
        }
        if(method.UserBuyingAnyWithGems()) { 
           refloow.chatMessage(SENDER, "!buyanygems - command unavailable ");
        }
        if(method.UserBuyingAnyWithPUBG()) { 
           refloow.chatMessage(SENDER, "!buyanypubg - command unavailable ");
        } 
                       refloow.chatMessage(SENDER, "‎-\n");

        if(method.UserSell()) {
           refloow.chatMessage(SENDER, "!sell - [amount of keys] - sell your sets for BOT MAIN CURRENCY key(s) ");
        } 
        if(method.UserSellingWithRef()) {
           refloow.chatMessage(SENDER, "!sellref - command unavailable ");
        } 
        if(method.UserSellingWithHydra()) { 
           refloow.chatMessage(SENDER, "!sellhydra [amount of CS:GO Hydra keys] - sell your sets for CS:GO Hydra key(s) ");
        } 
        if(method.UserSellingWithCSGO()) {  
           refloow.chatMessage(SENDER, "!sellcsgo [amount of CS:GO keys] - sell your sets for CS:GO key(s) ");
        } 
        if(method.UserSellingWithTF2()) { 
           refloow.chatMessage(SENDER, "!selltf2 [amount of TF keys] - sell your sets for TF key(s) ");
        } 
        if(method.UserSellingWithGems()) {
           refloow.chatMessage(SENDER, "!sellgems - command unavailable ");
        } 
        if(method.UserSellingWithPUBG()) {  
           refloow.chatMessage(SENDER, "!sellpubg - command unavailable ");
        }


      }  else if (MSG.toUpperCase() == "!HELP") {
         refloow.chatMessage(SENDER, "!commands - display list of availeble commands");
          refloow.chatMessage(SENDER, "!help - display list of availeble commands");  
           refloow.chatMessage(SENDER, "!owner - display owner profile"); 
            refloow.chatMessage(SENDER, "!info - info about bot ");

            refloow.chatMessage(SENDER, "!level [your dream level] - calculates how many sets and how many keys it will cost to reach your desired level");   
           refloow.chatMessage(SENDER, "!check [amount] - shows how many sets and which level you will reach for a specific amount of CS:GO keys"); 
        if(method.SellChecking()) {
          refloow.chatMessage(SENDER, "!sellcheck command - info about bot ");
        }
        if(method.BuyCheckingOne()) { 
          refloow.chatMessage(SENDER, "!buyonecheck [amount] - shows how many sets bot have from games that you dont have badge for (Counting only 1 set from each game) ");
        }
        if(method.BuyCheckingAny()) { 
          refloow.chatMessage(SENDER, "!buyanycheck command unavailable ");
        }
                      refloow.chatMessage(SENDER, "‎-\n");

        if(method.UserBuying()) {
           refloow.chatMessage(SENDER, "!buy [amount of keys] - use this to buy card sets with main bot currency which is set. ");
        }
        if(method.UserBuyingAny()) { 
           refloow.chatMessage(SENDER, "!buyany [amount of CS:GO keys] - use this to buy that amount of CS:GO keys for any sets, even from badges that has already been crafted, following the current bot rate ");
        }
        if(method.UserBuyingOne()) { 
           refloow.chatMessage(SENDER, "!buyone [amount of CS:GO keys] - only use this if you are a badge collector. The bot will send one set of each game, by the current bot rate ");
        } 
                       refloow.chatMessage(SENDER, "‎-\n");

        if(method.UserBuyingWithRef()) {
           refloow.chatMessage(SENDER, "!buyref [amount of REF] - use this to buy sets you have not crafted yet for that amount of ref, following the current bot rate ");
        }
        if(method.UserBuyingWithHydra()) { 
           refloow.chatMessage(SENDER, "!buyhydra - info about bot ");
        } 
        if(method.UserBuyingWithCSGO()) {  
           refloow.chatMessage(SENDER, "!buycsgo - info about bot ");
        } 
        if(method.UserBuyingWithTF2()) {
           refloow.chatMessage(SENDER, "!buytf2 [amount of TF keys] - the same as !buycsgo, but you pay with TF keys ");
        } 
        if(method.UserBuyingWithGems()) {  
           refloow.chatMessage(SENDER, "!buygems - command unavailable ");
        } 
        if(method.UserBuyingWithPUBG()) {   
           refloow.chatMessage(SENDER, "!buypubg - command unavailable ");
        }
                       refloow.chatMessage(SENDER, "‎-\n"); 

        if(method.UserBuyingOneWithRef()) {
           refloow.chatMessage(SENDER, "!buyoneref - command unavailable ");
        }
        if(method.UserBuyingOneWithHydra()) { 
           refloow.chatMessage(SENDER, "!buyonehydra - command unavailable ");
        }
        if(method.UserBuyingOneWithCSGO()) { 
           refloow.chatMessage(SENDER, "!buyonecsgo - command unavailable ");
        }
        if(method.UserBuyingOneWithTF2()) { 
           refloow.chatMessage(SENDER, "!buyonetf2 - command unavailable ");
        }
        if(method.UserBuyingOneWithGems()) { 
           refloow.chatMessage(SENDER, "!buyonegems - command unavailable ");
        }
        if(method.UserBuyingOneWithPUBG()) { 
           refloow.chatMessage(SENDER, "!buyonepubg - command unavailable ");
        }
                       refloow.chatMessage(SENDER, "‎-\n");

        if(method.UserBuyingAnyWithRef()) {
           refloow.chatMessage(SENDER, "!buyanyref - command unavailable ");
        }
        if(method.UserBuyingAnyWithHydra()) { 
           refloow.chatMessage(SENDER, "!buyanyhydra - command unavailable ");
        }
        if(method.UserBuyingAnyWithCSGO()) { 
           refloow.chatMessage(SENDER, "!buyanycsgo - command unavailable ");
        }
        if(method.UserBuyingAnyWithTF2()) { 
           refloow.chatMessage(SENDER, "!buyanytf2 - command unavailable ");
        }
        if(method.UserBuyingAnyWithGems()) { 
           refloow.chatMessage(SENDER, "!buyanygems - command unavailable ");
        }
        if(method.UserBuyingAnyWithPUBG()) { 
           refloow.chatMessage(SENDER, "!buyanypubg - command unavailable ");
        } 
                       refloow.chatMessage(SENDER, "‎-\n");

        if(method.UserSell()) {
           refloow.chatMessage(SENDER, "!sell - [amount of keys] - sell your sets for BOT MAIN CURRENCY key(s) ");
        } 
        if(method.UserSellingWithRef()) {
           refloow.chatMessage(SENDER, "!sellref - command unavailable ");
        } 
        if(method.UserSellingWithHydra()) { 
           refloow.chatMessage(SENDER, "!sellhydra [amount of CS:GO Hydra keys] - sell your sets for CS:GO Hydra key(s) ");
        } 
        if(method.UserSellingWithCSGO()) {  
           refloow.chatMessage(SENDER, "!sellcsgo [amount of CS:GO keys] - sell your sets for CS:GO key(s) ");
        } 
        if(method.UserSellingWithTF2()) { 
           refloow.chatMessage(SENDER, "!selltf2 [amount of TF keys] - sell your sets for TF key(s) ");
        } 
        if(method.UserSellingWithGems()) {
           refloow.chatMessage(SENDER, "!sellgems - command unavailable ");
        } 
        if(method.UserSellingWithPUBG()) {  
           refloow.chatMessage(SENDER, "!sellpubg - command unavailable ");
        }  
		
	} else if (MSG.toUpperCase() == "!OWNER") {
        refloow.chatMessage(SENDER, CONFIG.OWNER);
	
	} else if (MSG.toUpperCase() === "!INFO") {
        refloow.chatMessage(SENDER, CONFIG.INFO);
        if (CONFIG.CARDS.PEOPLETHATCANSELL.indexOf(SENDER.getSteamID64()) >= 0) {
            refloow.chatMessage(SENDER, CONFIG.SELLHELP);
        }	
		
    } else if (MSG.toUpperCase().indexOf("!LEVEL") >= 0) {
        let n = parseInt(MSG.toUpperCase().replace("!LEVEL ", ""));
        if (!isNaN(n) && parseInt(n) > 0) {
            if (n <= CONFIG.MAXLEVEL) {
                Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA, CURRENTLEVEL, XPNEEDED) => {
                  logcolors.true('Finished processing !level request');
                    if (!ERR) {
                        if (DATA) {
                            if (n > CURRENTLEVEL) {
                                let s = 0,
                                    l = 0;
                                for (let i = 0; i < (n - CURRENTLEVEL); i++) {
                                    s += parseInt((CURRENTLEVEL + l) / 10) + 1;
                                    l++;
                                }
                                refloow.chatMessage(SENDER, "✔️ To get to level " + n + " you will need " + (s - Math.floor(XPNEEDED / 100)) + " sets. That would cost " + parseInt((s - Math.floor(XPNEEDED / 100)) / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS * 100) / 100 + " CS:GO keys OR " + parseInt((s - Math.floor(XPNEEDED / 100)) / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSTF2 * 100) / 100 + " TF2 keys OR " + parseInt((s - Math.floor(XPNEEDED / 100)) * CONFIG.CARDS.BUY1SETFORAMOUNTOFREF * 100) / 100 + " Refined Metal.");
                            } else {
                                refloow.chatMessage(SENDER, "⚠️ Please provide a valid level.");
                            }
                        } else {
                            refloow.chatMessage(SENDER, "⚠️ Your level could not be retrieved. Make sure your Steam Profile is public and try again.");
                        }
                    } else {
                        logcolors.fail("| [Steam] |: An error occurred while getting badge data: " + ERR);
                        refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your badges. Please try again later.");
                    }
                });
            } else {
                refloow.chatMessage(SENDER, "⚠️ Please try a lower level.");
            }
        } else {
            refloow.chatMessage(SENDER, "⚠️ Please provide a valid level.");
        }
		
    } else if (MSG.toUpperCase().indexOf("!CHECK") >= 0) {
        let n = parseInt(MSG.toUpperCase().replace("!CHECK ", ""));
        if (!isNaN(n) && parseInt(n) > 0) {
          logcolors.true('Processing !check request');
            refloow.chatMessage(SENDER, "✔️ With " + n + " CS:GO keys you can get " + n * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS + " sets and with " + n + " TF2 keys you can get " + n * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSTF2 +" sets. With " + n + " Operation Hydra Case keys can get you " + n * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSHYDRA + " sets.");
        }


        } else if (MSG.toUpperCase().indexOf("!SELLCHECK") >= 0 && (CONFIG.CARDS.PEOPLETHATCANSELL.indexOf(SENDER.getSteamID64().toString()) >= 0 || CONFIG.CARDS.PEOPLETHATCANSELL.indexOf(parseInt(SENDER.getSteamID64())) >= 0)) {
        let n = parseInt(MSG.toUpperCase().replace("!SELLCHECK ", ""));
        if(method.SellChecking()) {
        refloow.chatMessage(SENDER, "Loading inventory...");

        Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
          logcolors.true('Processing !sellcheck request');
            logcolors.info("| [Debug] |: Inventory Loaded");
            if (!ERR) {
                let s = DATA;
                Utils.getSets(s, allCards, (ERR, DATA) => {
                    logcolors.info("| [Debug] |: Sets Loaded");
                    if (!ERR) {

                        // console.log(b);
                        // TODO: COUNT AMOUNT OF SETS BOT CAN GIVE HIM
                        // 1: GET BOTS CARDS. DONE
                        // 2: GET PLAYER's BADGES. DONE
                        // 3: MAGIC
                        let hisMaxSets = 0,
                            botNSets = 0;
                        // Loop for sets he has partially completed
                        // Loop for sets he has never crafted
                        for (let i = 0; i < Object.keys(DATA).length; i++) {
                            if (DATA[Object.keys(DATA)[i]].length >= 5) {
                                hisMaxSets += 5;
                            } else {
                                hisMaxSets += DATA[Object.keys(DATA)[i]].length;
                            }
                            botNSets += DATA[Object.keys(DATA)[i]].length;
                        }
                        totalBotSets = botNSets;
                        let playThis = CONFIG.PLAYGAMES;
                        if (CONFIG.PLAYGAMES && typeof(CONFIG.PLAYGAMES[0]) == "string") {
                            playThis[0] = parseString(playThis[0], totalBotSets);
                        }
                        refloow.gamesPlayed(playThis);
                        refloow.chatMessage(SENDER, "You currently have " + botNSets + " sets available which the bot can buy. For all of them the bot will pay you " + parseInt(botNSets / CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETS * 100) / 100 + " keys.");
                    } else {
                        logcolors.fail("| [Inventory] |: An error occurred while getting user sets: " + ERR);
                    }
                });
            } else {
                logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
            }
        });
    }

    if(method.BuyCheckingOne()) {
        } else if (MSG.toUpperCase().indexOf("!BUYONECHECK") >= 0) {
            refloow.chatMessage(SENDER, "Loading badges...");
            Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
              logcolors.true('Processing !buyonecheck request');
                if (!ERR) {
                    let b = {}; // List with badges that CAN still be crafted
                    if (DATA) {
                        for (let i = 0; i < Object.keys(DATA).length; i++) {
                            if (DATA[Object.keys(DATA)[i]] < 6) {
                                b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                            }
                        }
                    } else {
                        refloow.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
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
                            if (botSets[Object.keys(botSets)[i]].length >= 1) {
                                hisMaxSets += 1;
                            }
                        }
                        botNSets += botSets[Object.keys(botSets)[i]].length;
                    }
                    totalBotSets = botNSets;
                    let playThis = CONFIG.PLAYGAMES;
                    if (CONFIG.PLAYGAMES && typeof(CONFIG.PLAYGAMES[0]) == "string") {
                        playThis[0] = parseString(playThis[0], totalBotSets);
                    }
                    refloow.gamesPlayed(playThis);
                    refloow.chatMessage(SENDER, "There are currently sets from " + Object.keys(botSets).length + " different games, of which you have not crafted " + hisMaxSets + ". This would cost " + parseInt(hisMaxSets / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS * 100) / 100 + " keys.");
                } else {
                    refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your badges. Please try again.");
                    logcolors.fail(SENDER, "| [Steam] |: An error occurred while loading badges: " + ERR);
                }
            });
        }

	} else if (MSG.toUpperCase() == "!STOCK") {
		if (Object.keys(botSets).length > 0) {
			refloow.chatMessage(SENDER, "⚆ Loading badges...");
			Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
        logcolors.true('Processing !stock request');
				if (!ERR) {
					let b = {}; // List with badges that CAN still be crafted
					if (DATA) {
						for (let i = 0; i < Object.keys(DATA).length; i++) {
							if (DATA[Object.keys(DATA)[i]] < 6) {
								b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
							}
						}
					} else {
						refloow.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
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
					totalBotSets = botNSets;
					let playThis = CONFIG.PLAYGAMES;
					if (CONFIG.PLAYGAMES && typeof(CONFIG.PLAYGAMES[0]) == "string") {
						playThis[0] = parseString(playThis[0], totalBotSets);
					}
					refloow.gamesPlayed(playThis);
					refloow.chatMessage(SENDER, "There are currently " + hisMaxSets + "/" + botNSets + " sets available which you have not fully crafted yet. Buying all of them will cost you " + parseInt(hisMaxSets / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS * 100) / 100 + " keys.");
				} else {
					refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your badges. Please try again.");
					logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
				}
			});
		}
	
	} else if (MSG.toUpperCase().indexOf("!DONATESETS") >= 0) {
		if (botSets) {
			   let n = parseInt(MSG.toUpperCase().replace("!DONATESETS ", "")),
					amountofsets = n;
				if (!isNaN(n) && parseInt(n) > 0) {
					if (n <= CONFIG.MAXSELL) {
						refloow.chatMessage(SENDER, "Processing your request.");
						let botKeys = [],
							t = manager.createOffer(SENDER.getSteamID64());
						t.getUserDetails((ERR, ME, THEM) => {
              logcolors.true('Processing !donatesets request');
							if (ERR) {
								logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
								refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
							} else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
								manager.getUserInventoryContents(refloow.steamID.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
									if (ERR) {
										logcolors.fail("| [Inventory] | An error occurred while getting bot inventory: " + ERR);
										refloow.chatMessage(SENDER, "⚠️ An error occurred while loading the bot's inventory. Please try again.");
									} else {
										let amountofB = amountofsets;
											Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
												if (!ERR) {
													let s = DATA;
													Utils.getSets(s, allCards, (ERR, DDATA) => {
														if (!ERR) {
															sortSetsByAmountB(s, (DATA) => {
																let setsSent = {};
																firsttLoop: for (let i = 0; i < DATA.length; i++) {
																	if (DDATA[DATA[i]]) {
																		for (let j = 0; j < DDATA[DATA[i]].length; j++) {
																			if (amountofB > 0) {
																				if ((setsSent[DATA[i]] && setsSent[DATA[i]] < CONFIG.CARDS.MAXSETSELL) || !setsSent[DATA[i]]) {
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
																refloow.chatMessage(SENDER, "⚠️ You do not have enough sets, (this bot only accepts " + CONFIG.CARDS.MAXSETSELL + " sets per set type at a time). Please try again later.");
															} else {
																logcolors.info("| [Debug] |: -SENDING");
																t.addMyItems(botKeys);
																t.data("commandused", "Sell");
																t.data("amountofsets", amountofsets.toString());
																t.data("amountofkeys", n);
																t.send((ERR, STATUS) => {
																	if (ERR) {
																		refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
																		logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
																	} else {
																		refloow.chatMessage(SENDER, "Trade Sent! Confirming it...");
																		logcolors.info("| [Steam] |: Trade offer sent!");
																	}
																});
															}
														} else {
															logcolors.fail("| [Inventory] |: An error occurred while getting bot sets: " + ERR);
														}
													});
												} else {
													logcolors.fail("| [Steam] |: An error occurred while getting user inventory: " + ERR);
												}
											});
									}
								});
							} else {
								refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
							}
						});
					} else {
						refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
					}
				} else {
					refloow.chatMessage(SENDER, "⚠️ Please enter a valid amount of keys!");
				}
		} else {
			refloow.chatMessage(SENDER, "⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
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


        } else if (MSG.toUpperCase().indexOf("!BUYANY") >= 0) {
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
                            refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            refloow.chatMessage(SENDER, "⚠️ Processing your request.");
                           logcolors.true('Processing !buyany request');
                            manager.getUserInventoryContents(SENDER.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                    refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory. Please try later");
                                } else {
                                    let amountofB = amountofsets;
                                    for (let i = 0; i < INV.length; i++) {
                                        if (theirKeys.length < n && CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
                                            theirKeys.push(INV[i]);
                                        }
                                    }
                                    if (theirKeys.length != n) {
                                        refloow.chatMessage(SENDER, "⚠️ You do not have enough keys.");
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
                                        refloow.chatMessage(SENDER, "⚠️ There are not enough sets. Please try again later.");
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
                                                refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                            } else {
                                                refloow.chatMessage(SENDER, "⚠️ Trade Sent! Confirming it...");
                                                logcolors.info("| [Steam] |: Trade offer sent!");
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                }
            } else {
                refloow.chatMessage(SENDER, "⚠️ Please provide a valid amount of keys.");
            }
        } else {
            refloow.chatMessage(SENDER, "⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
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
                            refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            n = parseInt(n);
                            let theirKeys = [];
                            logcolors.true('Processing !buyone request');
                            refloow.chatMessage(SENDER, "⚠️ Processing your request.");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                    refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory. Please try later");
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
                                            refloow.chatMessage(SENDER, "⚠️ You do not have enough keys.");
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
                                                            refloow.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
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
                                                        let playThis = CONFIG.PLAYGAMES;
                                                        if (CONFIG.PLAYGAMES && typeof(CONFIG.PLAYGAMES[0]) == "string") {
                                                            playThis[0] = parseString(playThis[0], totalBotSets);
                                                        }
                                                        refloow.gamesPlayed(playThis);
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
                                                                    refloow.chatMessage(SENDER, "⚠️ There are not enough sets. Please try again later.");
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
                                                                            refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                            logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                           refloow.chatMessage(SENDER, "⚠️ Trade Sent! Confirming it...");
                                                                            logcolors.info("| [Steam] |: Trade offer sent!");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            refloow.chatMessage(SENDER, "⚠️ There are currently not enough sets that you have not used in stock for this amount of keys. Please try again later. If you want the bot to ignore your current badges use !buyany.");
                                                        }
                                                    } else {
                                                        logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your badges. Please try again.");
                                                    logcolors.fail(SENDER, "| [Steam] |: An error occurred while loading badges: " + ERR);
                                                }
                                            });
                                        }
                                    } else {
                                        logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            });
                        } else {
                            refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                }
            } else {
                refloow.chatMessage(SENDER, "⚠️ Please provide a valid amount of keys.");
            }
        } else {
            refloow.chatMessage(SENDER, "⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------//





    // HERE IS SECTION WITH BUY COMMANDS USING OTHER CURRENCYS (!BUYREF, !BUYHYDRA, !BUYCSGO, !BUYTF2, !BUYGEMS, !BUYPUBG)



    } else if (MSG.toUpperCase().indexOf("!BUYREF") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYREF ", ""),
                amountofsets = parseInt(n) / CONFIG.CARDS.BUY1SETFORAMOUNTOFREF; 
                refloow.chatMessage(SENDER, "You can get " + amountofsets + " set(s) for " + n + " Refined Metal");
        if(method.UserBuyingWithRef()) {
            if (parseInt(n)%2 == 0) {   
                if (!isNaN(n) && parseInt(n) > 0) {
                    if (n <= CONFIG.MAXBUYREF) {
                        let t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                                refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                n = parseInt(n);
                                let theirRef = [];
                                logcolors.true('Processing !buyref request');
                                refloow.chatMessage(SENDER, "Processing your request.");
                                manager.getUserInventoryContents(SENDER.getSteamID64(), 440, 2, true, (ERR, INV, CURR) => {
                                    if (ERR) {
                                        logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory. Please try later");
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
                                                refloow.chatMessage(SENDER, "⚠️ You do not have enough Refined Metal.");
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
                                                                refloow.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
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
                                                                        refloow.chatMessage(SENDER, "⚠️ There are not enough sets. Please try again later.");
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
                                                                                refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                                logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                            } else {
                                                                                refloow.chatMessage(SENDER, "⚠️ Trade Sent! Confirming it...");
                                                                                logcolors.info("| [Steam] |: Trade offer sent!");
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            } else {
                                                                refloow.chatMessage(SENDER, "⚠️ There are currently not enough sets that you have not used in stock for this amount of Refined Metal.");
                                                            }
                                                            // TO HERE
                                                        } else {
                                                            logcolors.fail("| [Steam] |: An error occurred while getting badges: " + ERR);
                                                        }
                                                    } else {
                                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your badges. Please try again.");
                                                        logcolors.fail("| [Steam] |: An error occurred while loading badges: " + ERR);
                                                    }
                                                });
                                            }
                                        } else {
                                            logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                            refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory, please make sure it's set to public.");
                                        }
                                    }
                                });
                            } else {
                                refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                            }
                        });
                    } else {
                        refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of Refined Metal.");
                    }
                } else {
                    refloow.chatMessage(SENDER, "⚠️ Please provide a valid amount of Refined Metal.");
                }
            } else {
                refloow.chatMessage(SENDER, "⚠️ Each set costs 2 ref. Try again using an even amount of Refined Metal.");
            }
        } else {
            refloow.chatMessage(SENDER, "⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }


    } else if (MSG.toUpperCase().indexOf("!BUYHYDRA") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYHYDRA ", ""),
                amountofsets = parseInt(n) * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSHYDRA;
        if(method.UserBuyingWithHydra()) {
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                            refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            n = parseInt(n);
                            let theirKeys = [];
                            logcolors.true('Processing !buyhydra request');
                            refloow.chatMessage(SENDER, "⚠️ Processing your request.");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                    refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory. Please try later");
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
                                            refloow.chatMessage(SENDER, "⚠️ You do not have enough keys.");
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
                                                            refloow.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
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
                                                                                logcolors.info("| [Debug] |: Loop 1");
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
                                                                                logcolors.info("| [Debug] |: loop #1 CONTINUE: RETURN");
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
                                                                                logcolors.info("| [Debug] |: Loop 2");
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
                                                                    refloow.chatMessage(SENDER, "⚠️ There are not enough sets. Please try again later.");
                                                                } else {
                                                                    logcolors.info("| [Debug] |: -SENDING");
                                                                    t.addTheirItems(theirKeys);
                                                                    t.data("commandused", "Buy");
                                                                    t.data("amountofkeys", n);
                                                                    t.data("amountofsets", amountofsets.toString());
                                                                    t.data("index", setsThatShouldntBeSent.length);
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                            logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            refloow.chatMessage(SENDER, "⚠️ Trade Sent! Confirming it...");
                                                                            logcolors.info("| [Steam] |: Trade offer sent!");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            refloow.chatMessage(SENDER, "⚠️ There are currently not enough sets that you have not used in stock for this amount of keys.");
                                                        }
                                                        // TO HERE
                                                    } else {
                                                        logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your badges. Please try again.");
                                                    logcolors.fail(SENDER, "| [Steam] |: An error occurred while loading badges: " + ERR);
                                                }
                                            });
                                        }
                                    } else {
                                        logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            });
                        } else {
                            refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                }
            } else {
                refloow.chatMessage(SENDER, "⚠️ Please provide a valid amount of keys.");
            }
        } else {
            refloow.chatMessage(SENDER, "⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

		
	} else if (MSG.toUpperCase().indexOf("!BUYCSGO") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYCSGO ", ""),
                amountofsets = parseInt(n) * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS;
        if(method.UserBuyingWithCSGO()) {
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                            refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            n = parseInt(n);
                            let theirKeys = [];
                            logcolors.true('Processing !buycsgo request');
                            refloow.chatMessage(SENDER, "⚠️ Processing your request.");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                    refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory. Please try later");
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
                                            refloow.chatMessage(SENDER, "⚠️ You do not have enough keys.");
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
                                                            refloow.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
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
                                                                                logcolors.info("| [Debug] |: Loop 1");
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
                                                                                logcolors.info("| [Debug] |: loop #1 CONTINUE: RETURN");
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
                                                                                logcolors.info("| [Debug] |: Loop 2");
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
                                                                    refloow.chatMessage(SENDER, "⚠️ There are not enough sets. Please try again later.");
                                                                } else {
                                                                    logcolors.info("| [Debug] |: -SENDING");
                                                                    t.addTheirItems(theirKeys);
                                                                    t.data("commandused", "Buy");
                                                                    t.data("amountofkeys", n);
                                                                    t.data("amountofsets", amountofsets.toString());
                                                                    t.data("index", setsThatShouldntBeSent.length);
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                            logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            refloow.chatMessage(SENDER, "⚠️ Trade Sent! Confirming it...");
                                                                            logcolors.info("| [Steam] |: Trade offer sent!");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            refloow.chatMessage(SENDER, "⚠️ There are currently not enough sets that you have not used in stock for this amount of keys.");
                                                        }
                                                        // TO HERE
                                                    } else {
                                                        logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your badges. Please try again.");
                                                    logcolors.fail(SENDER, "| [Steam] |: An error occurred while loading badges: " + ERR);
                                                }
                                            });
                                        }
                                    } else {
                                        logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            });
                        } else {
                            refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                }
            } else {
                refloow.chatMessage(SENDER, "⚠️ Please provide a valid amount of keys.");
            }
        } else {
            refloow.chatMessage(SENDER, "⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

        } else if (MSG.toUpperCase().indexOf("!BUYTF2") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYTF2 ", ""),
                amountofsets = parseInt(n) * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSTF2;
        if(method.UserBuyingWithTF2()) {
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                            refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            n = parseInt(n);
                            let theirKeys = [];
                            logcolors.true('Processing !buytf2 request');
                            refloow.chatMessage(SENDER, "Processing your request.");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), 440, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                    refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory. Please try later");
                                } else {
                                    logcolors.info("| [Debug] |: Inventory Loaded");
                                    if (!ERR) {
                                        logcolors.info("| [Debug] |: Inventory Loaded 2");
                                        for (let i = 0; i < INV.length; i++) {
                                            if (theirKeys.length < n && INV[i].market_hash_name == "Mann Co. Supply Crate Key") {
                                                theirKeys.push(INV[i]);
                                            }
                                        }
                                        if (theirKeys.length != n) {
                                            refloow.chatMessage(SENDER, "⚠️ You do not have enough keys.");
                                        } else {
                                            Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
                                                if (!ERR) {
                                                    logcolors.info("| [Debug] |: Badges Loaded");
                                                    if (!ERR) {
                                                        let b = {}; // List with badges that CAN still be crafted
                                                        if (DATA) {
                                                            for (let i = 0; i < Object.keys(DATA).length; i++) {
                                                                if (DATA[Object.keys(DATA)[i]] < 6) {
                                                                    b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
                                                                }
                                                            }
                                                        } else {
                                                            refloow.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
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
                                                                                logcolors.info("| [Debug] |: Loop 1");
                                                                                sLoop: for (let j = 0; j < 5 - b[DATA[i]]; j++) {
                                                                                    if (j + 1 < b[DATA[i]] && hisMaxSets > 0) {
                                                                                        logcolors.info("| [Debug] |: loop 1 CONTINUE: ITEM ADD");;
                                                                                        logcolors.info("[Debug] |: DEBUG#LOOP #1: " + botSets[DATA[i]][j]);
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
                                                                                logcolors.info("| [Debug] |: Loop 2");
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
                                                                    refloow.chatMessage(SENDER, "⚠️ There are not enough sets. Please try again later.");
                                                                } else {
                                                                    logcolors.info("| [Debug] |: -SENDING");
                                                                    t.addTheirItems(theirKeys);
                                                                    t.data("commandused", "Buy");
                                                                    t.data("amountofkeys", n);
                                                                    t.data("amountofsets", amountofsets.toString());
                                                                    t.data("index", setsThatShouldntBeSent.length);
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                            logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            refloow.chatMessage(SENDER, "✔️ Trade Sent! Confirming it...");
                                                                            logcolors.info("| [Steam] |: Trade offer sent!");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            refloow.chatMessage(SENDER, "⚠️ There are currently not enough sets that you have not used in stock for this amount of keys.");
                                                        }
                                                        // TO HERE
                                                    } else {
                                                        logcolors.fail("| [Steam] |: An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your badges. Please try again.");
                                                    logcolors.fail("| [Steam] |: An error occurred while loading badges: " + ERR);
                                                }
                                            });
                                        }
                                    } else {
                                        logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            });
                        } else {
                            refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                }
            } else {
                refloow.chatMessage(SENDER, "⚠️ Please provide a valid amount of keys.");
            }
        } else {
            refloow.chatMessage(SENDER, "⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

        } else if (MSG.toUpperCase().indexOf("!BUY") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUY ", ""),
                amountofsets = parseInt(n) * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS;
        if(method.UserBuying()) {
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                            refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            n = parseInt(n);
                            let theirKeys = [];
                            logcolors.true('Processing !buy request');
                            refloow.chatMessage(SENDER, "⚠️ Processing your request.");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                    refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory. Please try later");
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
                                            refloow.chatMessage(SENDER, "⚠️ You do not have enough keys.");
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
                                                            refloow.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
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
                                                                                logcolors.info("| [Debug] |: Loop 1");
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
                                                                                logcolors.info("| [Debug] |: loop #1 CONTINUE: RETURN");
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
                                                                                logcolors.info("| [Debug] |: Loop 2");
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
                                                                    refloow.chatMessage(SENDER, "⚠️ There are not enough sets. Please try again later.");
                                                                } else {
                                                                    logcolors.info("| [Debug] |: -SENDING");
                                                                    t.addTheirItems(theirKeys);
                                                                    t.data("commandused", "Buy");
                                                                    t.data("amountofkeys", n);
                                                                    t.data("amountofsets", amountofsets.toString());
                                                                    t.data("index", setsThatShouldntBeSent.length);
                                                                    setsThatShouldntBeSent.push(t.itemsToGive);
                                                                    t.send((ERR, STATUS) => {
                                                                        if (ERR) {
                                                                            refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                            logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            refloow.chatMessage(SENDER, "⚠️ Trade Sent! Confirming it...");
                                                                            logcolors.info("| [Steam] |: Trade offer sent!");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            refloow.chatMessage(SENDER, "⚠️ There are currently not enough sets that you have not used in stock for this amount of keys.");
                                                        }
                                                        // TO HERE
                                                    } else {
                                                        logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your badges. Please try again.");
                                                    logcolors.fail(SENDER, "| [Steam] |: An error occurred while loading badges: " + ERR);
                                                }
                                            });
                                        }
                                    } else {
                                        logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            });
                        } else {
                            refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                }
            } else {
                refloow.chatMessage(SENDER, "⚠️ Please provide a valid amount of keys.");
            }
        } else {
            refloow.chatMessage(SENDER, "⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
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
                if (!isNaN(n) && parseInt(n) > 0) {
                    if (n <= CONFIG.MAXSELL) {
                      logcolors.true('Processing !sellhydra request');
                        refloow.chatMessage(SENDER, "✔️ Processing your request.");
                        let botKeys = [],
                            t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                                refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                manager.getUserInventoryContents(refloow.steamID.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                    if (ERR) {
                                        logcolors.fail("| [Steam] |: An error occurred while getting bot inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while loading the bot's inventory. Please try again.");
                                    } else {
                                        for (let i = 0; i < INV.length; i++) {
                                            if (botKeys.length < n && CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
                                                botKeys.push(INV[i]);
                                            }
                                        }
                                        if (botKeys.length != n) {
                                            refloow.chatMessage(SENDER, "⚠️ The bot does not have enough keys.");
                                        } else {
                                            let amountofB = amountofsets;
                                            Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
                                                if (!ERR) {
                                                    let s = DATA;
                                                    Utils.getSets(s, allCards, (ERR, DDATA) => {
                                                        if (!ERR) {
                                                            sortSetsByAmountB(s, (DATA) => {
                                                                let setsSent = {};
                                                                firsttLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    console.log(setsSent);
                                                                    console.log(DATA[i]);
                                                                    if (DDATA[DATA[i]]) {
                                                                        for (let j = 0; j < DDATA[DATA[i]].length; j++) {
                                                                            if (amountofB > 0) {
                                                                                if ((setsSent[DATA[i]] && setsSent[DATA[i]] < CONFIG.CARDS.MAXSETSELL) || !setsSent[DATA[i]]) {
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
                                                                refloow.chatMessage(SENDER, "⚠️ You do not have enough sets, (this bot only accepts " + CONFIG.CARDS.MAXSETSELL + " sets per set type at a time). Please try again later.");
                                                            } else {
                                                                logcolors.info("| [Debug] |: -SENDING");
                                                                t.addMyItems(botKeys);
                                                                t.data("commandused", "Sell");
                                                                t.data("amountofsets", amountofsets.toString());
                                                                t.data("amountofkeys", n);
                                                                t.send((ERR, STATUS) => {
                                                                    if (ERR) {
                                                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                        logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                    } else {
                                                                        refloow.chatMessage(SENDER, "Trade Sent! Confirming it...");
                                                                        logcolors.info("| [Steam] |: Trade offer sent!");
                                                                    }
                                                                });
                                                            }
                                                        } else {
                                                            logcolors.fail("| [Inventory] |: An error occurred while getting bot sets: " + ERR);
                                                        }
                                                    });
                                                } else {
                                                    logcolors.fail("| [Inventory] |: An error occurred while loading user inventory: " + ERR);
                                                }
                                            });
                                        }
                                    }
                                });
                            } else {
                                refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                            }
                        });
                    } else {
                        refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                    }
                } else {
                    refloow.chatMessage(SENDER, "⚠️ Please enter a valid amount of keys!");
                }
        } else {
            refloow.chatMessage(SENDER, "⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

// !SELLCSGO COMMAND THAT USES CS GO KEYS AS CURRENCY TO PAY WITH      

        } else if (MSG.toUpperCase().indexOf("!SELLCSGO") >= 0) {
        if (botSets) {
               let n = parseInt(MSG.toUpperCase().replace("!SELLCSGO ", "")),
                    amountofsets = n * CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETS;
            if(method.UserSellingWithCSGO()) {
                if (!isNaN(n) && parseInt(n) > 0) {
                    if (n <= CONFIG.MAXSELL) {
                      logcolors.true('Processing !sellcsgo request');
                        refloow.chatMessage(SENDER, "✔️ Processing your request.");
                        let botKeys = [],
                            t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                                refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                manager.getUserInventoryContents(refloow.steamID.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                    if (ERR) {
                                        logcolors.fail("| [Steam] |: An error occurred while getting bot inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while loading the bot's inventory. Please try again.");
                                    } else {
                                        for (let i = 0; i < INV.length; i++) {
                                            if (botKeys.length < n && CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
                                                botKeys.push(INV[i]);
                                            }
                                        }
                                        if (botKeys.length != n) {
                                            refloow.chatMessage(SENDER, "⚠️ The bot does not have enough keys.");
                                        } else {
                                            let amountofB = amountofsets;
                                            Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
                                                if (!ERR) {
                                                    let s = DATA;
                                                    Utils.getSets(s, allCards, (ERR, DDATA) => {
                                                        if (!ERR) {
                                                            sortSetsByAmountB(s, (DATA) => {
                                                                let setsSent = {};
                                                                firsttLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    console.log(setsSent);
                                                                    console.log(DATA[i]);
                                                                    if (DDATA[DATA[i]]) {
                                                                        for (let j = 0; j < DDATA[DATA[i]].length; j++) {
                                                                            if (amountofB > 0) {
                                                                                if ((setsSent[DATA[i]] && setsSent[DATA[i]] < CONFIG.CARDS.MAXSETSELL) || !setsSent[DATA[i]]) {
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
                                                                refloow.chatMessage(SENDER, "⚠️ You do not have enough sets, (this bot only accepts " + CONFIG.CARDS.MAXSETSELL + " sets per set type at a time). Please try again later.");
                                                            } else {
                                                                logcolors.info("| [Debug] |: -SENDING");
                                                                t.addMyItems(botKeys);
                                                                t.data("commandused", "Sell");
                                                                t.data("amountofsets", amountofsets.toString());
                                                                t.data("amountofkeys", n);
                                                                t.send((ERR, STATUS) => {
                                                                    if (ERR) {
                                                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                        logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                    } else {
                                                                        refloow.chatMessage(SENDER, "Trade Sent! Confirming it...");
                                                                        logcolors.info("| [Steam] |: Trade offer sent!");
                                                                    }
                                                                });
                                                            }
                                                        } else {
                                                            logcolors.fail("| [Inventory] |: An error occurred while getting bot sets: " + ERR);
                                                        }
                                                    });
                                                } else {
                                                    logcolors.fail("| [Inventory] |: An error occurred while loading user inventory: " + ERR);
                                                }
                                            });
                                        }
                                    }
                                });
                            } else {
                                refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                            }
                        });
                    } else {
                        refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                    }
                } else {
                    refloow.chatMessage(SENDER, "⚠️ Please enter a valid amount of keys!");
                }
        } else {
            refloow.chatMessage(SENDER, "⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

// !SELLTF2 COMMAND THAT USES TF2 KEYS AS CURRENCY TO PAY WITH  

    } else if (MSG.toUpperCase().indexOf("!SELLTF2") >= 0) {
        if (botSets) {
                let n = parseInt(MSG.toUpperCase().replace("!SELLTF2 ", "")),
                    amountofsets = n * CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETSTF2;
            if(method.UserSellingWithTF2()) {
                if (!isNaN(n) && parseInt(n) > 0) {
                    if (n <= CONFIG.MAXSELL) {
                      logcolors.true('Processing !selltf2 request');
                        refloow.chatMessage(SENDER, "✔️ Processing your request.");
                        let botKeys = [],
                            t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                                refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                manager.getUserInventoryContents(refloow.steamID.getSteamID64(), 440, 2, true, (ERR, INV, CURR) => {
                                    if (ERR) {
                                        logcolors.fail("| [Debug] |: An error occurred while getting bot inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while loading the bot's inventory. Please try again.");
                                    } else {
                                        for (let i = 0; i < INV.length; i++) {
                                            if (botKeys.length < n && INV[i].market_hash_name == "Mann Co. Supply Crate Key") {
                                                botKeys.push(INV[i]);
                                            }
                                        }
                                        if (botKeys.length != n) {
                                            refloow.chatMessage(SENDER, "⚠️ The bot does not have enough keys.");
                                        } else {
                                            let amountofB = amountofsets;
                                            Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
                                                if (!ERR) {
                                                    let s = DATA;
                                                    Utils.getSets(s, allCards, (ERR, DDATA) => {
                                                        if (!ERR) {
                                                            sortSetsByAmountB(s, (DATA) => {
                                                                let setsSent = {};
                                                                firsttLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    if (DDATA[DATA[i]]) {
                                                                        for (let j = 0; j < DDATA[DATA[i]].length; j++) {
                                                                            if (amountofB > 0) {
                                                                                if ((setsSent[DATA[i]] && setsSent[DATA[i]] < CONFIG.CARDS.MAXSETSELL) || !setsSent[DATA[i]]) {
                                                                                    t.addTheirItems(DDATA[DATA[i]][j]);
                                                                                    logcolors.info("| [Debug] |: loop #2 CONTINUE: ITEM ADD");
                                                                                    amountofB--;
                                                                                    if (!setsSent[DATA[i]]) {
                                                                                        setsSent[DATA[i]] = 1;
                                                                                    } else {
                                                                                        setsSent[DATA[i]] += 1;
                                                                                    }
                                                                                } else {
                                                                                    logcolors.info("| [Debug] |: loop #2 CONTINUE: CONTINUE");
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
                                                                refloow.chatMessage(SENDER, "⚠️ You do not have enough sets, (this bot only accepts " + CONFIG.CARDS.MAXSETSELL + " sets per set type at a time). Please try again later.");
                                                            } else {
                                                                logcolors.info("| [Debug] |: Sending");
                                                                t.addMyItems(botKeys);
                                                                t.data("commandused", "Sell");
                                                                t.data("amountofsets", amountofsets.toString());
                                                                t.data("amountofkeys", n);
                                                                t.send((ERR, STATUS) => {
                                                                    if (ERR) {
                                                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                        logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                    } else {
                                                                        refloow.chatMessage(SENDER, "✔️ Trade Sent! Confirming it...");
                                                                        logcolors.info("| [Steam] |: Trade offer sent!");
                                                                    }
                                                                });
                                                            }
                                                        } else {
                                                            logcolors.fail("| [Inventory] |: An error occurred while getting bot sets: " + ERR);
                                                        }
                                                    });
                                                } else {
                                                    logcolors.fail("| [Steam] |: An error occurred while getting user inventory: " + ERR);
                                                }
                                            });
                                        }
                                    }
                                });
                            } else {
                                refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                            }
                        });
                    } else {
                        refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                    }
                } else {
                    refloow.chatMessage(SENDER, "⚠️ Please enter a valid amount of keys!");
                }
        } else {
            refloow.chatMessage(SENDER, "⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }

    // !SELL COMMAND - USSES MAIN BOT CURRENCY SET INSIDE OF THE CONFIG FILE TO PAY


    } else if (MSG.toUpperCase().indexOf("!SELL") >= 0) {
        if (botSets) {
               let n = parseInt(MSG.toUpperCase().replace("!SELL ", "")),
                    amountofsets = n * CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETS;
            if(method.UserSell()) {
                if (!isNaN(n) && parseInt(n) > 0) {
                    if (n <= CONFIG.MAXSELL) {
                      logcolors.true('Processing !sell request');
                        refloow.chatMessage(SENDER, "✔️ Processing your request.");
                        let botKeys = [],
                            t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                                refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                manager.getUserInventoryContents(refloow.steamID.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                    if (ERR) {
                                        logcolors.fail("| [Steam] |: An error occurred while getting bot inventory: " + ERR);
                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while loading the bot's inventory. Please try again.");
                                    } else {
                                        for (let i = 0; i < INV.length; i++) {
                                            if (botKeys.length < n && CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
                                                botKeys.push(INV[i]);
                                            }
                                        }
                                        if (botKeys.length != n) {
                                            refloow.chatMessage(SENDER, "⚠️ The bot does not have enough keys.");
                                        } else {
                                            let amountofB = amountofsets;
                                            Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
                                                if (!ERR) {
                                                    let s = DATA;
                                                    Utils.getSets(s, allCards, (ERR, DDATA) => {
                                                        if (!ERR) {
                                                            sortSetsByAmountB(s, (DATA) => {
                                                                let setsSent = {};
                                                                firsttLoop: for (let i = 0; i < DATA.length; i++) {
                                                                    console.log(setsSent);
                                                                    console.log(DATA[i]);
                                                                    if (DDATA[DATA[i]]) {
                                                                        for (let j = 0; j < DDATA[DATA[i]].length; j++) {
                                                                            if (amountofB > 0) {
                                                                                if ((setsSent[DATA[i]] && setsSent[DATA[i]] < CONFIG.CARDS.MAXSETSELL) || !setsSent[DATA[i]]) {
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
                                                                refloow.chatMessage(SENDER, "⚠️ You do not have enough sets, (this bot only accepts " + CONFIG.CARDS.MAXSETSELL + " sets per set type at a time). Please try again later.");
                                                            } else {
                                                                logcolors.info("| [Debug] |: -SENDING");
                                                                t.addMyItems(botKeys);
                                                                t.data("commandused", "Sell");
                                                                t.data("amountofsets", amountofsets.toString());
                                                                t.data("amountofkeys", n);
                                                                t.send((ERR, STATUS) => {
                                                                    if (ERR) {
                                                                        refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                        logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                    } else {
                                                                        refloow.chatMessage(SENDER, "Trade Sent! Confirming it...");
                                                                        logcolors.info("| [Steam] |: Trade offer sent!");
                                                                    }
                                                                });
                                                            }
                                                        } else {
                                                            logcolors.fail("| [Inventory] |: An error occurred while getting bot sets: " + ERR);
                                                        }
                                                    });
                                                } else {
                                                    logcolors.fail("| [Inventory] |: An error occurred while loading user inventory: " + ERR);
                                                }
                                            });
                                        }
                                    }
                                });
                            } else {
                                refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                            }
                        });
                    } else {
                        refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                    }
                } else {
                    refloow.chatMessage(SENDER, "⚠️ Please enter a valid amount of keys!");
                }
        } else {
            refloow.chatMessage(SENDER, "⚠️ Please try again later. (Steam is down or command is disabled by Admin)");
        }
    }
    
// START OF THE ADMIN COMMANDS 

    } else if (CONFIG.ADMINS.indexOf(SENDER.getSteamID64()) >= 0 || CONFIG.ADMINS.indexOf(parseInt(SENDER.getSteamID64())) >= 0) {
        // Admin commands.
        if (MSG.toUpperCase().indexOf("!BLOCK") >= 0) {
            let n = MSG.toUpperCase().replace("!BLOCK ", "").toString();
            if (SID64REGEX.test(n)) {
                refloow.chatMessage(SENDER, "✔️ User blocked.");
                refloow.blockUser(n);
            } else {
                refloow.chatMessage(SENDER, "⚠️ Please provide a valid SteamID64");
            }
        } else if (MSG.toUpperCase().indexOf("!USERCHECK") >= 0) {
            let n = MSG.toUpperCase().replace("!USERCHECK ", "").toString();
            if (SID64REGEX.test(n)) {
                if (Object.keys(botSets).length > 0) {
                    refloow.chatMessage(SENDER, "✔️Loading badges...");
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
                            refloow.chatMessage(SENDER, "There are currently " + hisMaxSets + "/" + botNSets + " sets available which " + n + " has not fully crafted yet. Buying all of them will cost " + parseInt(hisMaxSets / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS * 100) / 100 + " keys.");
                        } else {
                            refloow.chatMessage(SENDER, "⚠️ An error occurred while getting " + n + "'s badges. Please try again.");
                            logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
                        }
                    });
                } else {
                    refloow.chatMessage(SENDER, "⚠️ Please try again later.");
                }
            } else {
                refloow.chatMessage(SENDER, "⚠️ Please provide a valid SteamID64.");
            }
        } else if (MSG.toUpperCase() == "!WITHDRAW") {
            manager.getInventoryContents(CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                if (ERR) {
                    refloow.chatMessage(SENDER, "⚠️ An error occurred while loading the bot's inventory.");
                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                } else {
					refloow.chatMessage(SENDER, "✔️ Bot's inventory loaded.");
                    logcolors.info("| [Inventory] |: Bot's inventory loaded.");
                    let t = manager.createOffer(SENDER);
                    for (let i = 0; i < INV.length; i++) {
						
                        if (CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
                            t.addMyItem(INV[i]);
							logcolors.info("| [Offer] |: Key added to trade ");
						}
					}
					t.send();
                }
            });
        } else {
            refloow.chatMessage(SENDER, "⚠️ Command not recognized. Type !commands or !help to see all the commands.");;
        }
    
	} else if (MSG.toUpperCase().indexOf("!DONATESETS") >= 0) {
			if (botSets) {
				   let n = parseInt(MSG.toUpperCase().replace("!DONATESETS ", "")),
						amountofsets = n;
					if (!isNaN(n) && parseInt(n) > 0) {
						if (n <= CONFIG.MAXSELL) {
              logcolors.true('Processing !donatesets request');
							refloow.chatMessage(SENDER, "✔️ Processing your request.");
							let botKeys = [],
								t = manager.createOffer(SENDER.getSteamID64());
							t.getUserDetails((ERR, ME, THEM) => {
								if (ERR) {
									logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
									refloow.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
								} else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
									manager.getUserInventoryContents(refloow.steamID.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
										if (ERR) {
											logcolors.fail("| [Steam] |: An error occurred while getting bot inventory: " + ERR);
											refloow.chatMessage(SENDER, "⚠️ An error occurred while loading the bot's inventory. Please try again.");
										} else {
											let amountofB = amountofsets;
												Utils.getInventory(SENDER.getSteamID64(), community, (ERR, DATA) => {
													if (!ERR) {
														let s = DATA;
														Utils.getSets(s, allCards, (ERR, DDATA) => {
															if (!ERR) {
																sortSetsByAmountB(s, (DATA) => {
																	let setsSent = {};
																	firsttLoop: for (let i = 0; i < DATA.length; i++) {
																		console.log(setsSent);
																		console.log(DATA[i]);
																		if (DDATA[DATA[i]]) {
																			for (let j = 0; j < DDATA[DATA[i]].length; j++) {
																				if (amountofB > 0) {
																					if ((setsSent[DATA[i]] && setsSent[DATA[i]] < CONFIG.CARDS.MAXSETSELL) || !setsSent[DATA[i]]) {
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
																			logcolors.info("| [Debug] |: loop #2 CONTINUE: RETURN 2");;
																			continue firsttLoop;
																		}
																	}
																});
																if (amountofB > 0) {
																	refloow.chatMessage(SENDER, "⚠️ You do not have enough sets, (this bot only accepts " + CONFIG.CARDS.MAXSETSELL + " sets per set type at a time). Please try again later.");
																} else {
																	logcolors.info("| [Debug] |: -SENDING");
																	t.addMyItems(botKeys);
																	t.data("commandused", "Sell");
																	t.data("amountofsets", amountofsets.toString());
																	t.data("amountofkeys", n);
																	t.send((ERR, STATUS) => {
																		if (ERR) {
																			refloow.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
																			logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
																		} else {
																			refloow.chatMessage(SENDER, "✔️ Trade Sent! Confirming it...");
																			logcolors.info("| [Steam] |: Trade offer sent!");
																		}
																	});
																}
															} else {
																logcolors.fail("| [Inventory] |: An error occurred while getting bot sets: " + ERR);
															}
														});
													} else {
														logcolors.fail("| [Steam] |: An error occurred while getting user inventory: " + ERR);
													}
												});
										}
									});
								} else {
									refloow.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
								}
							});
						} else {
							refloow.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
						}
					} else {
						refloow.chatMessage(SENDER, "⚠️ Please enter a valid amount of keys!");
					}
			} else {
				refloow.chatMessage(SENDER, "⚠️ Please try again later.");
			}
		
	} else {
		refloow.chatMessage(SENDER, "⚠️ Command not recognized. Type !commands or !help to see all the commands.");;
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
                    if (CONFIG.PLAYGAMES && typeof(CONFIG.PLAYGAMES[0]) == "string") {
                        playThis[0] = parseString(playThis[0], totalBotSets);
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
        d += "\nKeys: " + OFFER.data("amountofkeys");
        d += "\nSteamID: " + OFFER.partner.getSteamID64();
        fs.writeFile("../TradesAccepted/" + OFFER.id + "-" + OFFER.partner.getSteamID64() + ".txt", d, (ERR) => {
            if (ERR) {
                logcolors.fail("| [Steam] |: An error occurred while writing trade file: " + ERR);
            }
        });
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
                OFFER.decline((ERR) => {
                    if (ERR) {
                        logcolors.fail("| [Steam] |: An error occurred while declining trade: " + ERR);
                    }
                });
            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                OFFER.accept((ERR) => {
                    if (ERR) {
                        logcolors.fail("| [Steam] |: An error occurred while declining trade: " + ERR);
                        OFFER.decline((ERR) => {
                            if (ERR) {
                                logcolors.fail("| [Steam] |: An error occurred while declining trade: " + ERR);
                            }
                        });
                    } else {
                        refloow.chatMessage(OFFER.partner, "Offer accepted!");
                    }
                });
            } else {
                refloow.chatMessage(OFFER.partner, "Please make sure you don't have a trade hold!");
                OFFER.decline((ERR) => {
                    if (ERR) {
                        logcolors.fail("| [Steam] |: An error occurred while declining trade: " + ERR);
                    }
                });
            }
        });
    } else if (OFFER.itemsToGive.length == 0) {
        OFFER.accept((ERR) => {
            logcolors.true("| [Donations] |: DONATION ACCEPT");
            if (ERR) {
                logcolors.fail("| [Steam] |: An error occurred while declining trade: " + ERR);
            }
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


// Steam-Card-Bot-PRO built by Refloow (-MajokingGames)

/* 
  Here is contact info: refloowlibrarycontact@gmail.com
  or main dev steam: https://steamcommunity.com/id/MajokingGames/

*/
