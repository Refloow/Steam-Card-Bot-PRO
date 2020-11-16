# Changelog

# Release v1.5.0

This version contains everything from previous version (Nothing changed) but due some user feedback new version has been drafted which will have new fixed code from the master branch. (Some error handling display is added)

If scrip works fine for you there is no need for downloading this release, unless you are running on the older version.

# Release 1.5.0

## Fixes

- Fixed stock command no sets issue now displaying correctly
- Fixed accepted trades logs error: "An error occurred while writing trade file: Error: ENOENT: no such file or directory"
- Fixed !help and !commands, remake was made so now it works much better

## Added

- Added brand new database with 9960 set data from games that bot can recognize

- Added /pre, /me, /quote & /code to work in steam chat on messae sent by bot and formated message to use so.

- Added :sets: count in the game played

- Added gems for buy and sell

- Added !sellcheck fix capturing and saving not recognized game id's also displaying in the dev logs
- Added some more dev console messages
- Added dev console messages when command is triggered
- Added alert for each command executed inside of the dev logs
- Added new method for disabling command executed messages in dev logs
- Added option in the config for disabling command executed messagea in dev logs
- Added config visual (option to run the separate script which will check the config and tell you what is enabled and what disabled for easier overlook) *STILL WORKING ON IT*
  - Added methods in methods.js for visual config lookup
- Added version check that works on time interval so bot will check from now on for updates on app start & every 2 hours *allerts only if update is available*
  - Added methods in methods.js for version check that works on time interval
- Added connection with the mongodb (EVERYONE IS ABLE TO ACCESS)
- Added reloging if session replaced


## Changed

- Updated all modules to newest versions
- Organized and added new options to the config
- New event for index.js startup message that will show version from package.

## Other

- Localization files:
 -  [DB] ChatLogs
 -  [DB] SetsData
 -  [DB] UserData
 -  [DB] TradesAccepted
  In chat logs are stored chat logs, by full logs and user logs
  Sets data contains database with known sets + missing file is written there if there is some unknown games
  UserData contains user data used for removing inactive users etc...
  iN TradesAccepted db there is accepted trades logs.

# Release 1.4.0

## Fixes

- Fixed the sell keys amount variable for hydra keys
- Fixed some console log messages

## Added

 ---- COMMANDS---

- Added (!price, !prices, !rate) - command that shows current prices like following:

       The current prices are:
       XX sets for 1 CS:GO key
       XX sets for 1 Hydra key
       XX sets for 1 TF key

       Also, we're buying XX sets for 1 CS:GO key
       XX sets for 1 Hydra key
       XX sets for 1 TF key

----- Fatures ---

- Added more detailed dev logs of user actions
- Added featured called RefloowChat, when enabled all chat messages from users were shown in the console in form like
         | [RefloowChat] |: STEAMID |: Message
      In gray color, there is option to enable and disable this, by default its enabled

- Added handler if credentials were not set in the config

- Added response if bot doesn't have any sets while user check !stock command
- Added response for !check without number
- Added method for feature ReflowChat

## Changed

- Rearanged some code inside of the app.js
- Disabled showing command calculations in Dev logs for more clear overview

# 1.3.0 Release

- Fixed command order issue (not calling commands properly) * important
- Added additional error handlers for modules
- Added more detailed dev console logs
- Added more detailed comments for developers


# 1.2.1 Patch

- Managing random group invites
1. Option to auto decline all incoming group invites
2. Option to auto accept all incoming group invites
- Organized code
- Added console logs messages when:
 1. User gets removed from the friendlist
 2. User adds us on the friendlist
 3. Bot checking for offline friendrequests on start.
 4. When bot receive incoming group invite
 5. When bot decline incoming group invite
 6. When bot accept incoming group invite
 - Added new methods for random group invites
 - Fixed some issue

# 1.2.0 Release

## Short summary:

- Rewrtied readme with more detailed informations and new features
- Reworked config file to support new features and added options for future ones.
- Updated !commands info command with all new and future commands.
- Organized code for future updates
  1. Sorted code 
  2. Added new notes
- Added methods for future command settings
- Sorted methods in sections
- Added !help command
- Added !buyhydra command
- Added !buy command
- Added !sell command

# 1.1.4
- Some Fixes
- Added new methods for enabling and disabling commands
- Added new configuration methods for enabling and disabling commands
- From now on !commands command will show custom list of command depends on your configuration in config file
   (You are now able to disable some command and it wont appear in !commands info command list)

 List of commands that can be toggled

 - !buytf2 command 
 - !selltf2 command
 - !buyref command
 - !buyone command
 - !buyany command
 - !buycsgo command
 - !sellcsgo command

 - !sellcheck command
 - !buyonecheck command
 
 - Updated user message if user trys to use command (if command fail: reason command is toggled by admin.)

# 1.1.3
- Fixed saving of logs
- Added error catcher if modules were not installed

# 1.1.2
- Added new commands:
 1. !sellcheck
 2. !buyonecheck
 3. !buyone amounf_of_keys
 4. !buyany amounf_of_keys


# 1.1.1
- Added changelog
- Updated config options
- Added new methods for configuration
- Option to enable or disable features in config
