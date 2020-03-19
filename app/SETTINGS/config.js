module.exports = {
    USERNAME: "", // Steam Bot Account Username
    PASSWORD: "", // Steam Bot Account Password
    SHAREDSECRET: "", // Code that can be found in {Steam64ID}maFile in SDA(Steam desktop Auth) 
    IDENTITYSECRET: "", // Code that can be found in {Steam64ID}maFile in SDA(Steam desktop Auth) 
    STEAMAPIKEY: "", // Code from steam in readme how to find it
    INVITETOGROUPID: "", // Invite users to this group
    PLAYGAMES: ["// Your custom message here for played game", 440], // List of appid's/names. Names will be played as non steam games. First game entered will show on profile, others will be idled in the background.
    COMMENTAFTERTRADE: "Thanks for trading with our level up service! ",
    MAXHOURSADDED: 168, // 
    SPAMREMOVEMESSAGE: `You got removed since you spammed admin is notified please do not spam or on your next alert you will get blocked.`, // This is message that is shown to user when get removed from friends when he spams.
    REMOVEDINACTIVE: 'Im cleaning my friendlist and removing inactive friends, please if you will use our service again re add me thanks.', // This message shows when user get cleared from friendlist.
    ADMINS: [""], // to add admin put steam64id 
    KEYSFROMGAME: 730, // 730 = CSGO, 440 = TF2
    MAXMSGPERSEC: 3, // The amount of messages users can send every second without getting removed. (Spam Protection)
    CARDS: {
        BUY1KEYFORAMOUNTOFSETS: 18, // For instance; if set to 9 you sell 9 sets for 1 key.
        GIVE1KEYPERAMOUNTOFSETS: 50, // For instance; if set to 6 you give people that have access to the !sell command 1 key for 6 of their sets.
        BUY1KEYFORAMOUNTOFSETSTF2: 19, // For instance; if set to 9 you sell 9 sets for 1 key.
        GIVE1KEYPERAMOUNTOFSETSTF2: 50, // For instance; if set to 6 you give people that have access to the !sell command 1 key for 6 of their sets.
		
		BUY1SETFORAMOUNTOFREF: 3, // For instance; if set to 1 you sell 1 sets for 2 ref.
		BUY1GEMSFORAMOUNTOFSETS: 4, // For instance; if set to 4 you sell 4 sets for 1 sack of gems.
		
        MAXSETSELL: 50, // The maximum amount of sets of a kind the bot will send when !sell is used
        PEOPLETHATCANSELL: ["STEAMID64", "STEAMID64"]
    },
    MESSAGES: {
        WELCOME: "Hi, this is BOT you can configure this message in config.",
        INFO: "Use these commands to get information about the card set bot: \n!stock [card sets in stock] \n!owner [profile]",
		OWNER: "/me https://steamcommunity.com/id/",
		SELLHELP: "You are also able to sell sets. You can do this by using !sell [amount of keys].",
        COMMANDS: "You can use these commands: \n!buytf2 [amount of TF2 keys] \n!buycsgo [amount of CS:GO keys] \n!buyref [amount of Refined Metal] \n\n!level [desired level you want to become] \n!check [amount of keys] \n!info [information about the bot]",
		
		MAXLEVEL: 1000, // Max level you can request using !level
        MAXBUY: 50, // Max keys you can buy sets for at a time
        MAXSELL: 100, // Max keys you can sell sets for at a time
		
		MAXBUYREF: 100, // Max ref you can buy sets for at a time
		MAXBUYGEMS: 1 // Max sack of gems you can buy sets for at a time
    },
    ACCEPTEDKEYS: [
            "Chroma 2 Case Key",
            "Huntsman Case Key",
            "Chroma Case Key",
            "eSports Key",
            "Winter Offensive Case Key",
            "Revolver Case Key",
            "Operation Vanguard Case Key",
            "Shadow Case Key",
            "Operation Wildfire Case Key",
            "Falchion Case Key",
            "Operation Breakout Case Key",
            "Chroma 3 Case Key",
            "CS:GO Case Key",
            "Operation Phoenix Case Key",
            "Gamma Case Key",
            "Gamma 2 Case Key",
            "Glove Case Key"
    ], // These are all keys ^ //Mann Co. Supply Crate Key//
	TF2KEY: [
            "Mann Co. Supply Crate Key"
    ],
}
