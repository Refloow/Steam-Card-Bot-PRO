// We strongly recommend not editing stuff that is in this file.

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

try {
    // Checking if module colors is installed
    colors = require('colors');
    // Checking if module moment is installed
    moment = require('moment');
// Catching error
} catch (ex) {
    // Displaying error message
    console.log('\n\n\n | [Modules] |: Missing dependencies. Run install.bat file or use npm install.\n\n\n');
    console.log(ex);
    process.exit(1);
}

// Importing required files
const package = require('./../package.json');
const config = require('./SETTINGS/config.js');
const logcolors = require('./logcolors.js')


t = module.exports = {
    
    check: function() {
        const request = require('request');
        var options = {
            url: 'https://raw.githubusercontent.com/Refloow/Steam-Card-Bot-PRO/master/package.json',
            method: 'GET',
        };
        function look(error, JSONresponse, body) {
            var page = JSON.parse(body)
		
            const v = package.version;
            if(page.version != v)
                console.log(`\n [GitHub] | VERSION |:  ${'New update available for '+package.name+ ' v'+page.version.green+'! You\'re currently only running version '+v.yellow+''}\n${` [GitHub] | VERSION |: Go to https://github.com/Refloow/Steam-Card-Bot-PRO to update now!`}\n\n`)
            else 
                console.log(`\n [GitHub] | VERSION |: You're running the latest version of Steam-Card-Bot-PRO (v${v.green})\n\n`)
        }
        request(options, look)
    },

    checkaswego: function() {
        var options = {
            url: 'https://raw.githubusercontent.com/Refloow/Steam-Card-Bot-PRO/master/package.json',
            method: 'GET',
        };
        function look(error, JSONresponse, body) {
            var page = JSON.parse(body)
            const v = package.version;
            if(page.version != v)
                console.log(`\n [GitHub] | VERSION |:  ${'New update available for '+package.name+ ' v'+page.version.green+'! You\'re currently only running version '+v.yellow+''}\n${` [GitHub] | VERSION |: Go to https://github.com/Refloow/Steam-Card-Bot-PRO to update now!`}\n\n`)
        }
        request(options, look)
    },
 
    // This method checks if any of this values are not set in the config
    validatelogininfo: function() {
        
        logcolors.info(`Bot configured and steam throwing back InvalidPassword error = credentials are wrong or too many tries.\n`)
        // Check if username is not set in the config
        if (Boolean(!config.USERNAME)) {
        logcolors.fail(`| [Account] |: Username is not configured`);
        }

        // Check if username is set in the config
        if (Boolean(config.USERNAME)) {
        logcolors.true(`| [Account] |: Username is configured`);
        }

        // Check if password is not set in the config
        if (Boolean(!config.PASSWORD)) {
        logcolors.fail(`| [Account] |: PASSWORD is not configured`);
        }

        // Check if password is set in the config
        if (Boolean(config.PASSWORD)) {
        logcolors.true(`| [Account] |: PASSWORD is configured`);
        }

        // Check if sharedsecret is not set in the config
        if (Boolean(!config.SHAREDSECRET)) {
        logcolors.fail(`| [Account] |: SHAREDSECRET is not configured`);
        }

        // Check if sharedsecret is set in the config
        if (Boolean(config.SHAREDSECRET)) {
        logcolors.true(`| [Account] |: SHAREDSECRET is configured`);
        }

        // Check if identitysecret is not set in the config
        if (Boolean(!config.IDENTITYSECRET)) {
        logcolors.fail(`| [Account] |: IDENTITYSECRET is not configured`);
        }

        // Check if identitysecret is set in the config
        if (Boolean(config.IDENTITYSECRET)) {
        logcolors.true(`| [Account] |: IDENTITYSECRET is configured`);
        }

        // Check if steamapikey is not set in the config
        if (Boolean(!config.STEAMAPIKEY)) {
        logcolors.fail(`| [Account] |: STEAMAPIKEY is not configured`);
        }

        // Check if steamapikey is set in the config
        if (Boolean(config.STEAMAPIKEY)) {
        logcolors.true(`| [Account] |: STEAMAPIKEY is configured`);
        }

        // This will make a bit of space between displaying other things
        console.log(`\n`)
    },

    // Method for refloowchat function

    RefloowChat: function() {
        return config.RefloowChat_Enable == true;
    },

    // Other bot functions

    LogsCalledCommandsEnabled: function() {
        return config.CalledCommandsLive == true;
    },

    ChatSpamProtectionEnabled: function() {
        return config.chat_spam_protection == true;
    },

    SpamRemoveMessageEnabled: function() {
        return config.spam_remove_message_enable == true;
    },

    SpamAdminNotification: function () {
        return config.spam_admin_notification_enable == true;
    },

    removingInactiveFriendsEnabled: function() {
        return config.bot_clearing_friend_list == true;
    },

    SendingMessageToRemovedInactive: function() {
        return config. message_inactive_friend_removed == true;
    },

    DailyChatLogsEnabled: function() {
        return config.chat_daily_logs == true;
    },

    ChatLogsForEachUserEnabled: function() {
        return config.chat_logs_for_each_user == true;
    },

    TradeCommentEnabled: function() {
        return config.After_Trade_Comment_enable == true;
    },

    FriendRequestGoupInviteEnabled: function() {
        return config.friend_group_inviting == true;
    },

    SendingWelcomeMessage: function() {
        return config.EnableWelcomeMessage == true;
    },

    // Random group invites


    DecliningRandomGroupInvites: function() {
        return config.decline_random_group_inv == true;
    },

    AcceptingRandomGroupInvites: function() {
        return config.accept_random_group_inv == true;
    },


    // -------------------- COMMAND METHODS ----------------------------------

    // Check commands methods

    //-----------------------------

    SellChecking: function() {
        return config.sellcheck_enable == true;
    },

    BuyCheckingOne: function() {
        return config.buyonecheck_enable == true;
    },

    BuyCheckingAny: function() {
        return config.buyanycheck_enable == true;
    },

    //-------------------------------


    // SIMPLE BUY ------------------------------------------------------------

    UserBuying: function() {
        return config.buy_enable == true; //
    },

    UserBuyingAny: function() {
        return config.buyany_enable == true;
    },

    UserBuyingOne: function() {
        return config.buyone_enable == true;
    },

    // CURRENCY BUY -----------------------------------------------------------

    UserBuyingWithRef: function() {
        return config.buyref_enable == true;
    },

    UserBuyingWithHydra: function() {
        return config.buyhydra_enable == true; //
    },

    UserBuyingWithCSGO: function() {
        return config.buycsgo_enable == true;
    },

    UserBuyingWithTF2: function() {
        return config.buytf2_enable == true;
    },

    UserBuyingWithGems: function() {
        return config.buygems_enable == true; //
    },

    UserBuyingWithPUBG: function() {
        return config.buypubg_enable == true; //
    },

    // CURRENCY BUY (For One) --------------------------------------------------

    UserBuyingOneWithRef: function() {
        return config.buyoneref_enable == true; //
    },

    UserBuyingOneWithHydra: function() {
        return config.buyonehydra_enable == true; //
    },

    UserBuyingOneWithCSGO: function() {
        return config.buyonecsgo_enable == true; //
    },

    UserBuyingOneWithTF2: function() {
        return config.buyonetf2_enable == true; //
    },

    UserBuyingOneWithGems: function() {
        return config.buyonegems_enable == true; //
    },

    UserBuyingOneWithPUBG: function() {
        return config.buyonepubg_enable == true; //
    },


    // CURRENCY BUY (For Any) ----------------------------------------------------

    UserBuyingAnyWithRef: function() {
        return config.buyanyref_enable == true; //
    },

    UserBuyingAnyWithHydra: function() {
        return config.buyanyhydra_enable == true; //
    },

    UserBuyingAnyWithCSGO: function() {
        return config.buyanycsgo_enable == true; //
    },

    UserBuyingAnyWithTF2: function() {
        return config.buyanytf2_enable == true; //
    },

    UserBuyingAnyWithGems: function() {
        return config.buyanygems_enable == true; //
    },

    UserBuyingAnyWithPUBG: function() {
        return config.buyanypubg_enable == true; //
    },

    //---------------------------------------------------------------------------------

    // SELLING SECTION----------------------------------------------------------------

    // SIMPLE SELL


    UserSell: function() {
        return config.sell_enable == true; //
    },


    // CURRENCY SELL ------------------------------------------------------------------

    UserSellingWithRef: function() {
        return config.sellref_enable == true; //
    },

    UserSellingWithHydra: function() {
        return config.sellhydra_enable == true; //
    },

    UserSellingWithCSGO: function() {
        return config.sellcsgo_enable == true;
    },

    UserSellingWithTF2: function() {
        return config.selltf2_enable == true;
    },

    UserSellingWithGems: function() {
        return config.sellgems_enable == true; //
    },

    UserSellingWithPUBG: function() {
        return config.sellpubg_enable == true; //
    }

}

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
