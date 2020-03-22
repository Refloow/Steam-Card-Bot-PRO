// We strongly recommend not editing stuff that is in this file.

const package = require('./../package.json');
const config = require('./SETTINGS/config.js');
const colors = require('colors');
const moment = require('moment');

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
                console.log(`| [GitHub] | VERSION |:  ${'New update available for '+package.name+ ' v'+page.version.green+'! You\'re currently only running version '+v.yellow+''}\n${`| [GitHub] | VERSION |: Go to https://github.com/Refloow/Steam-Card-Bot-PRO to update now!`}\n\n`)
            else 
                console.log(`| [GitHub] | VERSION |: You're running the latest version of Steam-Card-Bot-PRO (v${v.green})\n\n`)
        }
        request(options, look)
    },

    // Other bot functions

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
