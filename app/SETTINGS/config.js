module.exports = {
	
// Steam-Card-Bot-PRO built by Refloow (-MajokingGames)

/* 
  Here is contact info: refloowlibrarycontact@gmail.com
  or main dev steam: https://steamcommunity.com/id/MajokingGames/

*/
    //----------------|--A-C-C-O-U-N-T---C-R-E-D-E-N-T-I-A-L-S--|-----------------------------------------------------//

    //-----------------------------------------------------------------------------------------------//

    USERNAME: "", // Steam Bot Account Username
    PASSWORD: "", // Steam Bot Account Password
    SHAREDSECRET: "", // Code that can be found in {Steam64ID}maFile in SDA(Steam desktop Auth) 
    IDENTITYSECRET: "", // Code that can be found in {Steam64ID}maFile in SDA(Steam desktop Auth) 
    STEAMAPIKEY: "", // Code from steam in readme how to find it

    //-----------------------------------------------------------------------------------------------//

    
    //--------------------|--P-L-A-Y---&---A-D-M-I-N-S--|------------------------------------------------------------//

    //-----------------------------------------------------------------------------------------------//

    PLAYGAMES: [":sets: // Your custom message here for played game"], // List of appid's/names. Names will be played as non steam games. First game entered will show on profile, others will be idled in the background.
    ADMINS: [""], // to add admin put steam64id 

    //-----------------------------------------------------------------------------------------------//


    // ---------------|   C-O-N-S-O-L-E---M-S-S-A-G-E-S   |--------------------------------------------------------//

   
        CalledCommandsLive: true,           // [true/false] Enable or disable | This feature shows in the logs which commands were called by which user.
        RefloowChat_Enable: true,           // [true/false] Enable or disable | This feature show in dev logs all messages sent by users to bot


    //-----------------------------------------------------------------------------------------------


    //-------------------|--V-A-L-U-E-S  =  P-R-I-C-E-S---|---------------------------------------------------------//

    //-----------------------------------------------------------------------------------------------//

    // THIS IS MAIN CURRENC USED FOR !BUY AND !SELL COMMANDS

    KEYSFROMGAME: 730, // 730 = CSGO, 440 = TF2

     // We dont recommend changing currencies since calculations will still work with cs go keys, will be changed in next updates

    // Rate Settings

    CARDS: {
        BUY1KEYFORAMOUNTOFSETS: 26, // For instance; if set to 9 you sell 9 sets for 1 key.
        GIVE1KEYPERAMOUNTOFSETS: 60, // For instance; if set to 6 you give people that have access to the !sell command 1 key for 6 of their sets.
        BUY1KEYFORAMOUNTOFSETSHYDRA: 12, // For instance; if set to 9 you sell 9 sets for 1 key.
        GIVE1KEYPERAMOUNTOFSETSHYDRA: 60, // For instance; if set to 6 you give people that have access to the !sell command 1 key for 6 of their sets.
        BUY1KEYFORAMOUNTOFSETSTF2: 16, // For instance; if set to 9 you sell 9 sets for 1 key.
        GIVE1KEYPERAMOUNTOFSETSTF2: 20, // For instance; if set to 6 you give people that have access to the !sell command 1 key for 6 of their sets.
        
        BUY1SETFORAMOUNTOFREF: 3, // For instance; if set to 1 you sell 1 sets for 2 ref.
        BUY1GEMSFORAMOUNTOFSETS: 4, // For instance; if set to 400,you sell 1 set for 400 gems.
        GIVE1GEMSFORAMOUNTOFSETSGEMS: 300, // For instance; if set to 300,you sell 300 gems for 1 set.
        
        MAXSETSELL: 50, // The maximum amount of sets of a kind the bot will send when !sell is used
        PEOPLETHATCANSELL: ["STEAMID64", "STEAMID64"]
    },

    // Limits

    MAXLEVEL: 1000, // Max level you can request using !level
    MAXBUY: 50, // Max keys you can buy sets for at a time
    MAXSELL: 100, // Max keys you can sell sets for at a time
    MAXBUYGEMS: 1, // Max sack of gems you can buy sets for at a time
    MAXBUYREF: 100, // Max ref you can buy sets for at a time


    // Here is list of keys that bot can accept

    ACCEPTEDKEYS: 

    [
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
            "Glove Case Key",
            "Operation Hydra Case Key"
    ], // These are all keys ^ //Mann Co. Supply Crate Key//


	TF2KEY:

    [
            "Mann Co. Supply Crate Key"
    ],

    //-----------------------------------------------------------------------------------------------//

    
// ----------------------------------------------------C-O-M-M-A-N-D-S------S-E-T-T-I-N-G-S--------------------------------------------//

// After seting command to false, command wont apear on !commands info command and user wont be able to use that bot command.


// Here is short turoial on how to navigate through theese settings.
// 
// Commands are sorted in sections, | check commands | , | buy commands | and | sell commands |
// for easier navigation commands that include some currencys are tagged with side number like /*1*/
// If you check all commands that have /*1*/ at the side they include ref currency in command
// This way you can find all commands that uses one feature and disable it.

// Why is sorted like this ?
// When adding new commands its much easyer to navigate and add new things, if commands were sorted via currencys there will be mess.

// /*1*/ - Commands that include refined metal
// /*2*/ - Commands that include hydra keys
// /*3*/ - Commands that include csgo keys
// /*4*/ - Commands that include tf2 keys
// /*5*/ - Commands that include gems
// /*6*/ - Commands that include pubg


//-----------------------------BUY COMMANDS------------------------------------------------------------------------------------------//

// ----------------------------SIMPLE BUY (!buy, !buyany, !buyone commands)

    buy_enable: true,                          // [ture/false] Enable or disable | !buy command         (// This command when called sell sets for keys (main currecy that you set default is cs go keys) following current bot rate)
    buyany_enable: true,                       // [true/false] Enable or disable | !buyany command      (// This command when called sell any sets for keys to user without checking badges) 
    buyone_enable: true,                       // [true/false] Enable or disable | !buyone command      (// This command when called sell sets for keys but (gives user 1 set from each game that he hasnt crafted) - For badge collectors


// ----------------------------CURRENCYS BUY (!buyref, !buyhydra, !buycsgo, !buytf2, !buygems, !buypubg)


 /*1*/  buyref_enable: true,                    // [true/false] Enable or disable | !buyref command      (// This command when called sell sets to user for ref metal)
 /*2*/  buyhydra_enable: true,                  // [true/false] Enable or disable | !buyhydra command    (// This command when called sell sets for user hydra keys)
 /*3*/  buycsgo_enable: true,                   // [true/false] Enable or disable | !buycsgo command     (// This command when called sell sets to user for csgo keys)
 /*4*/  buytf2_enable: true,                    // [true/false] Enable or disable | !buytf2 command      (// This command when called sell sets to user for tf2 keys)
 /*5*/  buygems_enable: true,                   // [true/false] Enable or disable | !buygems command     (// This command when called sell sets to user for gems)

 /*6*/  buypubg_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)


// ----------------------------CURRENCYS BUY ONE (!buyoneref, !buyonehydra, !buyonecsgo, !buyonetf2, !buyonegems, !buyonepubg)

 
 /*1*/  buyoneref_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)
 /*2*/  buyonehydra_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)
 /*3*/  buyonecsgo_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)
 /*4*/  buyonetf2_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)
 /*5*/  buyonegems_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)
 /*6*/  buyonepubg_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)


// ----------------------------CURRENCYS BUY ANY (!buyanyref, !buyanyhydra, !buyanycsgo, !buyanytf2, !buyanygems, !buyanypubg)

 
 /*1*/  buyanyref_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)
 /*2*/  buyanyhydra_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)
 /*3*/  buyanycsgo_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)
 /*4*/  buyanytf2_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)
 /*5*/  buyanygems_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)
 /*6*/  buyanypubg_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)

//-----------------------------------------------------------------------------------------------------------------------------------//

//-----------------------------SELL COMMANDS------------------------------------------------------------------------------------------//

// ----------------------------SIMPLE SELL (!sell)


    sell_enable: true,                             // [true/false] Enable or disable | !sell command       (// This command when called sell keys for sets) - Uses main currency set at: KEYSFROMGAME


// ----------------------------SIMPLE CURRENCYS (!sellref, !sellhydra, !sellcsgo, !selltf2, !sellgems, !sellpubg)

 /*1*/  sellref_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)
 /*2*/  sellhydra_enable: true,                    // [true/false] Enable or disable | !sellhydra command   (// This command when called sell hydra cs go keys for sets to user)
 /*3*/  sellcsgo_enable: true,                     // [true/false] Enable or disable | !sellcsgo command    (// This command when called sell csgo keys for sets to user)
 /*4*/  selltf2_enable: true,                      // [true/false] Enable or disable | !selltf2 command     (// This command when called sell tf2 keys for sets to user)
 /*5*/  sellgems_enable: true,                     // [true/false] Enable or disable | !sellgems command    (// This command when called sell gems for sets to user)
 
 /*6*/  sellpubg_enable: false,// -comming in next update (Leave it on false for !help and !commands to display working commands correctly)


//-------------------------------------------------------------------------------------------------------------------------------------//




    //-SETTINGS: MESSAGES
    EnableWelcomeMessage: true,             // [true/false] Enable or disable | Bot sending welcome message uppon accepting friend request
    WELCOME: "/code Hello ! This is Refloow's Level Up Bot use: !help or !commands to see all available commands !", // Welcome message.

        //IFNO COMMANDS

    INFO: "Use these commands to get information about the card set bot: \n!stock [card sets in stock] \n!owner [profile]", //Info command message
    OWNER: "/me https://steamcommunity.com/id/", // owner command message
    SELLHELP: "You are also able to sell sets. You can do this by using !sell [amount of keys].", // sellhelp command message


    //-----------------------------------------------------------------------------------------------
        
    //-SETTINGS:  REMOVING INACTIVE FRIENDS (CLEARING FRIEND LIST)

    bot_clearing_friend_list: true,         // [true/false] Enable or disable | bot removing inactive users for clearing friend list
    message_inactive_friend_removed: true,  // [true/false] Enable or disable | sending chat message to user that got removed after being inactive for too long.
    MAXHOURSADDED: 168,                     //  Time in hours before bot remove inactive user.
    REMOVEDINACTIVE: '/pre Im cleaning my friendlist and removing inactive friends, please if you will use our service again re add me thanks.', // This message shows when user get cleared from friendlist.

    //-SETTINGS:  BOT ANTI SPAM PROTECTION (Removing user after spaming)

    chat_spam_protection: true,             // [true/false] Enable or disable | removing user after senting too many messages per sec
    spam_remove_message_enable: true,       // [true/false] Enable or disable | sending chat message to user that got removed for spaming too many messages per sec.
    spam_admin_notification_enable: true,   // [true/false] Enable or disable | notifing admin with id of user who got remove for spaming
    MAXMSGPERSEC: 3,                        // The amount of messages users can send every second without getting removed. (Spam Protection)
    SPAMREMOVEMESSAGE: `You got removed since you spammed admin is notified please do not spam or on your next alert you will get blocked.`, // This is message that is shown to user when get removed from friends when he spams.

    //-SETTINGS:  BOT SAVING LOGS SETTINGS

    chat_daily_logs: true,                  // [true/false] Enable or disable | saving all logs in daily bases by date
    chat_logs_for_each_user: true,          // [true/false] Enable or disable | saving all chat logs for each user

    //-SETTINGS: BOT COMMENTING AFTER TRADE

    After_Trade_Comment_enable: true,       // [true/false] Enable or disable | posting coments after trade
    COMMENTAFTERTRADE: "Thanks for trading with our level up service! ",

    //-SETTINGS: INVITING TO THE GROUP

    friend_group_inviting: true,            // [true/false] Enable or disable | Inviting user to the selected group on friend request
    INVITETOGROUPID: "",                    // Invite users to this group




   //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*//
   //                                              //
   //                W A R N I N G                 //
   //                                              //
   //-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*//

   // RANDOM GROUP INVITES CAN ONLY BE SET TO ACCEPT OR DECLINE
   // IF DECLINING IS ON TURN OFF THE ACCEPTING OF THE RANDOM GROUP INVITES
   // UNPREDICTABLE ERRORS AND CRASHES CAN HAPPEN IF BOTH WERE SET ON TRUE
   // BOTH CAN BE SET ON FALSE THAT WAY BOT WOTN RESPOND ON GROUP INVITES !

   // SUMMARY: One of the 2 options always needs to be false
   // IF both of the settings were set to false bot doesnt respond on group invites.


    // SETTINGS: AUTO DECLINING RANDOM GROUP INVITES

    decline_random_group_inv: true,         // [true/false] Enable or disable | Auto declining all incoming random group invites.
    accept_random_group_inv: false,         // [true/false] Enable or disable | Auto accepting all incoming random group invites.

}
