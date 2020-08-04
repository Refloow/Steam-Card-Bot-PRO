# Changelog

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
