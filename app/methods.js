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

    BuyingWithRef: function() {
        return config.Buying_Sets_With_Ref_Enable == true;
    }
}
