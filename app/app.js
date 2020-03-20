let SteamUser = require("steam-user"),
    SteamTotp = require("steam-totp"),
    TradeOfferManager = require("steam-tradeoffer-manager"),
    SteamCommunity = require("steamcommunity"),
    Utils = require("../app/utils.js"),
    method = require('./methods'),
    CONFIG = require("../app/SETTINGS/config.js"),
    logcolors= require("../app/logcolors.js")
    allCards = {},
    botSets = {},
    fs = require("fs"),
    users = {},
    userMsgs = {},
    SID64REGEX = new RegExp(/^[0-9]{17}$/),
    chatLogs = "",
    userLogs = {},
    totalBotSets = 0,
    setsThatShouldntBeSent = [];


let client = new SteamUser(),
    manager = new TradeOfferManager({
        "steam": client,
        "language": "en",
        "pollInterval": "10000",
        "cancelTime": "7200000" // 2 hours in ms
    }),
    community = new SteamCommunity();

// Checking for correct version (updates) for bot on github

method.check();

setInterval(() => {
    for (let i = 0; i < Object.keys(userMsgs).length; i++) {
        if (userMsgs[Object.keys(userMsgs)[i]] > CONFIG.MAXMSGPERSEC) {
            client.chatMessage(Object.keys(userMsgs)[i], CONFIG.SPAMREMOVEMESSAGE);
            client.removeFriend(Object.keys(userMsgs)[i]);
            for (let j = 0; j < CONFIG.ADMINS.length; j++) {
                client.chatMessage(CONFIG.ADMINS[j], "User #" + Object.keys(userMsgs)[i] + " has been removed for spamming. To block him use !block [STEAMID64] (Command will work after adding admin commands to system.)");
            }
        }
    }
    userMsgs = {};
}, 1000);

setInterval(() => {
    for (let i = 0; i < Object.keys(users).length; i++) {
        if (users[Object.keys(users)[i]].idleforhours >= CONFIG.MAXHOURSADDED) {
            client.chatMessage(Object.keys(users)[i], CONFIG.REMOVEDINACTIVE);
            client.removeFriend(Object.keys(users)[i]);
            delete users[Object.keys(users)[i]];
            fs.writeFile("./app/UserData/Users.json", JSON.stringify(users), (ERR) => {
                if (ERR) {
                    logger.error("| |UserData| |: An error occurred while writing UserData file: " + ERR);
                }
            });
        } else {
            users[Object.keys(users)[i]].idleforhours += 1;
            fs.writeFile("./app/UserData/Users.json", JSON.stringify(users), (ERR) => {
                if (ERR) {
                    logger.error("| |UserData| |: An error occurred while writing UserData file: " + ERR);
                }
            });
        }
    }
}, 1000 * 60 * 60);

fs.readFile("./app/UserData/Users.json", (ERR, DATA) => {
    if (ERR) {
        logcolors.fail("| [Friends] |: An error occurred while getting Users: " + ERR);
    } else {
        users = JSON.parse(DATA);
    }
});

Utils.getCardsInSets((ERR, DATA) => {
    if (!ERR) {
        allCards = DATA;
        logcolors.info("| [Inventory] |: Card data loaded. [" + Object.keys(DATA).length + "]");
    } else {
        logcolors.fail("| [Inventory] |: An error occurred while getting cards: " + ERR);
    }
});


client.logOn({
    accountName: CONFIG.USERNAME,
    password: CONFIG.PASSWORD,
    twoFactorCode: SteamTotp.getAuthCode(CONFIG.SHAREDSECRET)
});

client.on("loggedOn", (details, parental) => {
    client.getPersonas([client.steamID], (personas) => {
        logcolors.true("| [Steam] |: Logged on steam as #" + client.steamID + " " + personas[client.steamID].player_name + "");
    });
    client.setPersona(1);
});

client.on("webSession", (sessionID, cookies) => {
    manager.setCookies(cookies, (ERR) => {
        if (ERR) {
            logcolors.fail("| [WebSession] |: An error occurred while setting cookies.");
        } else {
            logcolors.true("| [WebSession] |: Websession Created And Cookies Set.");
        }
    }); 
    // Add people that added the bot while it was online.
    for (let i = 0; i < Object.keys(client.myFriends).length; i++) {
        if (client.myFriends[Object.keys(client.myFriends)[i]] == 2) {
            client.addFriend(Object.keys(client.myFriends)[i]);
        }
    }
    community.setCookies(cookies);
    community.startConfirmationChecker(10000, CONFIG.IDENTITYSECRET);
    Utils.getInventory(client.steamID.getSteamID64(), community, (ERR, DATA) => {
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
                    client.gamesPlayed(playThis);
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

community.on("sessionExpired", (ERR) => {
    logcolors.info("| [WebSession] |: Session Expired. Relogging.");
    client.webLogOn();
});

client.on("friendMessage", (SENDER, MSG) => {
    if (userLogs[SENDER.getSteamID64()]) {
        userLogs[SENDER.getSteamID64()].push(MSG);
    } else {
        userLogs[SENDER.getSteamID64()] = [];
        userLogs[SENDER.getSteamID64()].push(MSG);
    }
    fs.writeFile("./app/ChatLogs/UserLogs/" + SENDER.getSteamID64() + "-log-" + new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear() + ".json", JSON.stringify({ logs: userLogs[SENDER.getSteamID64()] }), (ERR) => {
        if (ERR) {
            logcolors.fail("| [Users] |: An error occurred while writing UserLogs file: " + ERR);
        }
    });
    chatLogs += SENDER.getSteamID64() + " : " + MSG + "\n";
    fs.writeFile("./app/ChatLogs/FullLogs/log-" + new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear() + ".txt", chatLogs, (ERR) => {
        if (ERR) {
            logcolors.fail("| [Users] |: An error occurred while writing FullLogs file: " + ERR);
        }
    });
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
        client.chatMessage(SENDER, CONFIG.MESSAGES.COMMANDS);	
		
	} else if (MSG.toUpperCase() == "!OWNER") {
        client.chatMessage(SENDER, CONFIG.MESSAGES.OWNER);
	
	} else if (MSG.toUpperCase() === "!INFO") {
        client.chatMessage(SENDER, CONFIG.MESSAGES.INFO);
        if (CONFIG.CARDS.PEOPLETHATCANSELL.indexOf(SENDER.getSteamID64()) >= 0) {
            client.chatMessage(SENDER, CONFIG.MESSAGES.SELLHELP);
        }	
		
    } else if (MSG.toUpperCase().indexOf("!LEVEL") >= 0) {
        let n = parseInt(MSG.toUpperCase().replace("!LEVEL ", ""));
        if (!isNaN(n) && parseInt(n) > 0) {
            if (n <= CONFIG.MESSAGES.MAXLEVEL) {
                Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA, CURRENTLEVEL, XPNEEDED) => {
                    if (!ERR) {
                        if (DATA) {
                            if (n > CURRENTLEVEL) {
                                let s = 0,
                                    l = 0;
                                for (let i = 0; i < (n - CURRENTLEVEL); i++) {
                                    s += parseInt((CURRENTLEVEL + l) / 10) + 1;
                                    l++;
                                }
                                client.chatMessage(SENDER, "✔️ To get to level " + n + " you will need " + (s - Math.floor(XPNEEDED / 100)) + " sets. That would cost " + parseInt((s - Math.floor(XPNEEDED / 100)) / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS * 100) / 100 + " CS:GO keys OR " + parseInt((s - Math.floor(XPNEEDED / 100)) / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSTF2 * 100) / 100 + " TF2 keys OR " + parseInt((s - Math.floor(XPNEEDED / 100)) * CONFIG.CARDS.BUY1SETFORAMOUNTOFREF * 100) / 100 + " Refined Metal.");
                            } else {
                                client.chatMessage(SENDER, "⚠️ Please provide a valid level.");
                            }
                        } else {
                            client.chatMessage(SENDER, "⚠️ Your level could not be retrieved. Make sure your Steam Profile is public and try again.");
                        }
                    } else {
                        logcolors.fail("| [Steam] |: An error occurred while getting badge data: " + ERR);
                        client.chatMessage(SENDER, "⚠️ An error occurred while loading your badges. Please try again later.");
                    }
                });
            } else {
                client.chatMessage(SENDER, "⚠️ Please try a lower level.");
            }
        } else {
            client.chatMessage(SENDER, "⚠️ Please provide a valid level.");
        }
		
    } else if (MSG.toUpperCase().indexOf("!CHECK") >= 0) {
        let n = parseInt(MSG.toUpperCase().replace("!CHECK ", ""));
        if (!isNaN(n) && parseInt(n) > 0) {
            client.chatMessage(SENDER, "✔️ With " + n + " CS:GO keys you can get " + n * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS + " sets and with " + n + " TF2 keys you can get " + n * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSTF2 +" sets.");
        }
        
	} else if (MSG.toUpperCase() == "!STOCK") {
		if (Object.keys(botSets).length > 0) {
			client.chatMessage(SENDER, "⚆ Loading badges...");
			Utils.getBadges(SENDER.getSteamID64(), (ERR, DATA) => {
				if (!ERR) {
					let b = {}; // List with badges that CAN still be crafted
					if (DATA) {
						for (let i = 0; i < Object.keys(DATA).length; i++) {
							if (DATA[Object.keys(DATA)[i]] < 6) {
								b[Object.keys(DATA)[i]] = 5 - DATA[Object.keys(DATA)[i]];
							}
						}
					} else {
						client.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
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
					client.gamesPlayed(playThis);
					client.chatMessage(SENDER, "There are currently " + hisMaxSets + "/" + botNSets + " sets available which you have not fully crafted yet. Buying all of them will cost you " + parseInt(hisMaxSets / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS * 100) / 100 + " keys.");
				} else {
					client.chatMessage(SENDER, "⚠️ An error occurred while getting your badges. Please try again.");
					logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
				}
			});
		}
	
	} else if (MSG.toUpperCase().indexOf("!DONATESETS") >= 0) {
		if (botSets) {
			   let n = parseInt(MSG.toUpperCase().replace("!DONATESETS ", "")),
					amountofsets = n;
				if (!isNaN(n) && parseInt(n) > 0) {
					if (n <= CONFIG.MESSAGES.MAXSELL) {
						client.chatMessage(SENDER, "Processing your request.");
						let botKeys = [],
							t = manager.createOffer(SENDER.getSteamID64());
						t.getUserDetails((ERR, ME, THEM) => {
							if (ERR) {
								logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
								client.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
							} else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
								manager.getUserInventoryContents(client.steamID.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
									if (ERR) {
										logcolors.fail("| [Inventory] | An error occurred while getting bot inventory: " + ERR);
										client.chatMessage(SENDER, "⚠️ An error occurred while loading the bot's inventory. Please try again.");
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
																client.chatMessage(SENDER, "⚠️ You do not have enough sets, (this bot only accepts " + CONFIG.CARDS.MAXSETSELL + " sets per set type at a time). Please try again later.");
															} else {
																logcolors.info("| [Debug] |: -SENDING");
																t.addMyItems(botKeys);
																t.data("commandused", "Sell");
																t.data("amountofsets", amountofsets.toString());
																t.data("amountofkeys", n);
																t.send((ERR, STATUS) => {
																	if (ERR) {
																		client.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
																		logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
																	} else {
																		client.chatMessage(SENDER, "Trade Sent! Confirming it...");
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
								client.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
							}
						});
					} else {
						client.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
					}
				} else {
					client.chatMessage(SENDER, "⚠️ Please enter a valid amount of keys!");
				}
		} else {
			client.chatMessage(SENDER, "⚠️ Please try again later.");
		}
		
    } else if (MSG.toUpperCase().indexOf("!SELLTF2") >= 0) {
        if (botSets) {
                let n = parseInt(MSG.toUpperCase().replace("!SELLTF2 ", "")),
                    amountofsets = n * CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETSTF2;
                if (!isNaN(n) && parseInt(n) > 0) {
                    if (n <= CONFIG.MESSAGES.MAXSELL) {
                        client.chatMessage(SENDER, "✔️ Processing your request.");
                        let botKeys = [],
                            t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                                client.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                manager.getUserInventoryContents(client.steamID.getSteamID64(), 440, 2, true, (ERR, INV, CURR) => {
                                    if (ERR) {
                                        logcolors.fail("| [Debug] |: An error occurred while getting bot inventory: " + ERR);
                                        client.chatMessage(SENDER, "⚠️ An error occurred while loading the bot's inventory. Please try again.");
                                    } else {
                                        for (let i = 0; i < INV.length; i++) {
                                            if (botKeys.length < n && INV[i].market_hash_name == "Mann Co. Supply Crate Key") {
                                                botKeys.push(INV[i]);
                                            }
                                        }
                                        if (botKeys.length != n) {
                                            client.chatMessage(SENDER, "⚠️ The bot does not have enough keys.");
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
                                                                client.chatMessage(SENDER, "⚠️ You do not have enough sets, (this bot only accepts " + CONFIG.CARDS.MAXSETSELL + " sets per set type at a time). Please try again later.");
                                                            } else {
                                                                logcolors.info("| [Debug] |: Sending");
                                                                t.addMyItems(botKeys);
                                                                t.data("commandused", "Sell");
                                                                t.data("amountofsets", amountofsets.toString());
                                                                t.data("amountofkeys", n);
                                                                t.send((ERR, STATUS) => {
                                                                    if (ERR) {
                                                                        client.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                        logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                    } else {
                                                                        client.chatMessage(SENDER, "✔️ Trade Sent! Confirming it...");
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
                                client.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                            }
                        });
                    } else {
                        client.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                    }
                } else {
                    client.chatMessage(SENDER, "⚠️ Please enter a valid amount of keys!");
                }
        } else {
            client.chatMessage(SENDER, "⚠️ Please try again later.");
        }
    
	} else if (MSG.toUpperCase().indexOf("!SELLCSGO") >= 0) {
        if (botSets) {
               let n = parseInt(MSG.toUpperCase().replace("!SELLCSGO ", "")),
                    amountofsets = n * CONFIG.CARDS.GIVE1KEYPERAMOUNTOFSETS;
                if (!isNaN(n) && parseInt(n) > 0) {
                    if (n <= CONFIG.MESSAGES.MAXSELL) {
                        client.chatMessage(SENDER, "✔️ Processing your request.");
                        let botKeys = [],
                            t = manager.createOffer(SENDER.getSteamID64());
                        t.getUserDetails((ERR, ME, THEM) => {
                            if (ERR) {
                                logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                                client.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                            } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                                manager.getUserInventoryContents(client.steamID.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                    if (ERR) {
                                        logcolors.fail("| [Steam] |: An error occurred while getting bot inventory: " + ERR);
                                        client.chatMessage(SENDER, "⚠️ An error occurred while loading the bot's inventory. Please try again.");
                                    } else {
                                        for (let i = 0; i < INV.length; i++) {
                                            if (botKeys.length < n && CONFIG.ACCEPTEDKEYS.indexOf(INV[i].market_hash_name) >= 0) {
                                                botKeys.push(INV[i]);
                                            }
                                        }
                                        if (botKeys.length != n) {
                                            client.chatMessage(SENDER, "⚠️ The bot does not have enough keys.");
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
                                                                client.chatMessage(SENDER, "⚠️ You do not have enough sets, (this bot only accepts " + CONFIG.CARDS.MAXSETSELL + " sets per set type at a time). Please try again later.");
                                                            } else {
                                                                logcolors.info("| [Debug] |: -SENDING");
                                                                t.addMyItems(botKeys);
                                                                t.data("commandused", "Sell");
                                                                t.data("amountofsets", amountofsets.toString());
                                                                t.data("amountofkeys", n);
                                                                t.send((ERR, STATUS) => {
                                                                    if (ERR) {
                                                                        client.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                        logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                    } else {
                                                                        client.chatMessage(SENDER, "Trade Sent! Confirming it...");
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
                                client.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                            }
                        });
                    } else {
                        client.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                    }
                } else {
                    client.chatMessage(SENDER, "⚠️ Please enter a valid amount of keys!");
                }
        } else {
            client.chatMessage(SENDER, "⚠️ Please try again later.");
        }
    
	} else if (MSG.toUpperCase().indexOf("!BUYTF2") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYTF2 ", ""),
                amountofsets = parseInt(n) * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETSTF2;
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MESSAGES.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                            client.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            n = parseInt(n);
                            let theirKeys = [];
                            client.chatMessage(SENDER, "Processing your request.");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), 440, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                    client.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory. Please try later");
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
                                            client.chatMessage(SENDER, "⚠️ You do not have enough keys.");
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
                                                            client.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
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
                                                                    client.chatMessage(SENDER, "⚠️ There are not enough sets. Please try again later.");
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
                                                                            client.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                            logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            client.chatMessage(SENDER, "✔️ Trade Sent! Confirming it...");
                                                                            logcolors.info("| [Steam] |: Trade offer sent!");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            client.chatMessage(SENDER, "⚠️ There are currently not enough sets that you have not used in stock for this amount of keys.");
                                                        }
                                                        // TO HERE
                                                    } else {
                                                        logcolors.fail("| [Steam] |: An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    client.chatMessage(SENDER, "⚠️ An error occurred while getting your badges. Please try again.");
                                                    logcolors.fail("| [Steam] |: An error occurred while loading badges: " + ERR);
                                                }
                                            });
                                        }
                                    } else {
                                        logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                        client.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            });
                        } else {
                            client.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    client.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                }
            } else {
                client.chatMessage(SENDER, "⚠️ Please provide a valid amount of keys.");
            }
        } else {
            client.chatMessage(SENDER, "⚠️ Please try again later.");
        }
    
	} else if (MSG.toUpperCase().indexOf("!BUYREF") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYREF ", ""),
				amountofsets = parseInt(n) / CONFIG.CARDS.BUY1SETFORAMOUNTOFREF; 
				client.chatMessage(SENDER, "You can get " + amountofsets + " set(s) for " + n + " Refined Metal");
			if (parseInt(n)%2 == 0) {	
				if (!isNaN(n) && parseInt(n) > 0) {
					if (n <= CONFIG.MESSAGES.MAXBUYREF) {
						let t = manager.createOffer(SENDER.getSteamID64());
						t.getUserDetails((ERR, ME, THEM) => {
							if (ERR) {
								logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
								client.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
							} else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
								n = parseInt(n);
								let theirRef = [];
								client.chatMessage(SENDER, "Processing your request.");
								manager.getUserInventoryContents(SENDER.getSteamID64(), 440, 2, true, (ERR, INV, CURR) => {
									if (ERR) {
										logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
										client.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory. Please try later");
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
												client.chatMessage(SENDER, "⚠️ You do not have enough Refined Metal.");
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
																client.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
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
																		client.chatMessage(SENDER, "⚠️ There are not enough sets. Please try again later.");
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
																				client.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
																				logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
																			} else {
																				client.chatMessage(SENDER, "⚠️ Trade Sent! Confirming it...");
																				logcolors.info("| [Steam] |: Trade offer sent!");
																			}
																		});
																	}
																});
															} else {
																client.chatMessage(SENDER, "⚠️ There are currently not enough sets that you have not used in stock for this amount of Refined Metal.");
															}
															// TO HERE
														} else {
															logcolors.fail("| [Steam] |: An error occurred while getting badges: " + ERR);
														}
													} else {
														client.chatMessage(SENDER, "⚠️ An error occurred while getting your badges. Please try again.");
														logcolors.fail("| [Steam] |: An error occurred while loading badges: " + ERR);
													}
												});
											}
										} else {
											logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
											client.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory, please make sure it's set to public.");
										}
									}
								});
							} else {
								client.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
							}
						});
					} else {
						client.chatMessage(SENDER, "⚠️ Please try a lower amount of Refined Metal.");
					}
				} else {
					client.chatMessage(SENDER, "⚠️ Please provide a valid amount of Refined Metal.");
				}
			} else {
				client.chatMessage(SENDER, "⚠️ Each set costs 2 ref. Try again using an even amount of Refined Metal.");
			}
        } else {
            client.chatMessage(SENDER, "⚠️ Please try again later.");
        }
		
	} else if (MSG.toUpperCase().indexOf("!BUYCSGO") >= 0) {
        if (botSets) {
            let n = MSG.toUpperCase().replace("!BUYCSGO ", ""),
                amountofsets = parseInt(n) * CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS;
            if (!isNaN(n) && parseInt(n) > 0) {
                if (n <= CONFIG.MESSAGES.MAXBUY) {
                    let t = manager.createOffer(SENDER.getSteamID64());
                    t.getUserDetails((ERR, ME, THEM) => {
                        if (ERR) {
                            logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                            client.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
                        } else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
                            n = parseInt(n);
                            let theirKeys = [];
                            client.chatMessage(SENDER, "⚠️ Processing your request.");
                            manager.getUserInventoryContents(SENDER.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                                if (ERR) {
                                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                    client.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory. Please try later");
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
                                            client.chatMessage(SENDER, "⚠️ You do not have enough keys.");
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
                                                            client.chatMessage(SENDER.getSteamID64(), "Your badges are empty, sending an offer without checking badges.");
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
                                                                    client.chatMessage(SENDER, "⚠️ There are not enough sets. Please try again later.");
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
                                                                            client.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
                                                                            logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
                                                                        } else {
                                                                            client.chatMessage(SENDER, "⚠️ Trade Sent! Confirming it...");
                                                                            logcolors.info("| [Steam] |: Trade offer sent!");
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            client.chatMessage(SENDER, "⚠️ There are currently not enough sets that you have not used in stock for this amount of keys.");
                                                        }
                                                        // TO HERE
                                                    } else {
                                                        logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
                                                    }
                                                } else {
                                                    client.chatMessage(SENDER, "⚠️ An error occurred while getting your badges. Please try again.");
                                                    logcolors.fail(SENDER, "| [Steam] |: An error occurred while loading badges: " + ERR);
                                                }
                                            });
                                        }
                                    } else {
                                        logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                                        client.chatMessage(SENDER, "⚠️ An error occurred while loading your inventory, please make sure it's set to public.");
                                    }
                                }
                            });
                        } else {
                            client.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
                        }
                    });
                } else {
                    client.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
                }
            } else {
                client.chatMessage(SENDER, "⚠️ Please provide a valid amount of keys.");
            }
        } else {
            client.chatMessage(SENDER, "⚠️ Please try again later.");
        }
    
    } else if (CONFIG.ADMINS.indexOf(SENDER.getSteamID64()) >= 0 || CONFIG.ADMINS.indexOf(parseInt(SENDER.getSteamID64())) >= 0) {
        // Admin commands.
        if (MSG.toUpperCase().indexOf("!BLOCK") >= 0) {
            let n = MSG.toUpperCase().replace("!BLOCK ", "").toString();
            if (SID64REGEX.test(n)) {
                client.chatMessage(SENDER, "✔️ User blocked.");
                client.blockUser(n);
            } else {
                client.chatMessage(SENDER, "⚠️ Please provide a valid SteamID64");
            }
        } else if (MSG.toUpperCase().indexOf("!USERCHECK") >= 0) {
            let n = MSG.toUpperCase().replace("!USERCHECK ", "").toString();
            if (SID64REGEX.test(n)) {
                if (Object.keys(botSets).length > 0) {
                    client.chatMessage(SENDER, "✔️Loading badges...");
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
                                client.chatMessage(SENDER.getSteamID64(), n + "'s badges are empty, sending an offer without checking badges.");
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
                            client.chatMessage(SENDER, "There are currently " + hisMaxSets + "/" + botNSets + " sets available which " + n + " has not fully crafted yet. Buying all of them will cost " + parseInt(hisMaxSets / CONFIG.CARDS.BUY1KEYFORAMOUNTOFSETS * 100) / 100 + " keys.");
                        } else {
                            client.chatMessage(SENDER, "⚠️ An error occurred while getting " + n + "'s badges. Please try again.");
                            logcolors.fail(SENDER, "| [Steam] |: An error occurred while getting badges: " + ERR);
                        }
                    });
                } else {
                    client.chatMessage(SENDER, "⚠️ Please try again later.");
                }
            } else {
                client.chatMessage(SENDER, "⚠️ Please provide a valid SteamID64.");
            }
        } else if (MSG.toUpperCase() == "!WITHDRAW") {
            manager.getInventoryContents(CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
                if (ERR) {
                    client.chatMessage(SENDER, "⚠️ An error occurred while loading the bot's inventory.");
                    logcolors.fail("| [Inventory] |: An error occurred while getting inventory: " + ERR);
                } else {
					client.chatMessage(SENDER, "✔️ Bot's inventory loaded.");
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
            client.chatMessage(SENDER, "⚠️ Command not recognized. Type !commands to see all the commands.");;
        }
    
	} else if (MSG.toUpperCase().indexOf("!DONATESETS") >= 0) {
			if (botSets) {
				   let n = parseInt(MSG.toUpperCase().replace("!DONATESETS ", "")),
						amountofsets = n;
					if (!isNaN(n) && parseInt(n) > 0) {
						if (n <= CONFIG.MESSAGES.MAXSELL) {
							client.chatMessage(SENDER, "✔️ Processing your request.");
							let botKeys = [],
								t = manager.createOffer(SENDER.getSteamID64());
							t.getUserDetails((ERR, ME, THEM) => {
								if (ERR) {
									logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
									client.chatMessage(SENDER, "⚠️ An error occurred while getting your trade holds. Please try again");
								} else if (ME.escrowDays == 0 && THEM.escrowDays == 0) {
									manager.getUserInventoryContents(client.steamID.getSteamID64(), CONFIG.KEYSFROMGAME, 2, true, (ERR, INV, CURR) => {
										if (ERR) {
											logcolors.fail("| [Steam] |: An error occurred while getting bot inventory: " + ERR);
											client.chatMessage(SENDER, "⚠️ An error occurred while loading the bot's inventory. Please try again.");
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
																	client.chatMessage(SENDER, "⚠️ You do not have enough sets, (this bot only accepts " + CONFIG.CARDS.MAXSETSELL + " sets per set type at a time). Please try again later.");
																} else {
																	logcolors.info("| [Debug] |: -SENDING");
																	t.addMyItems(botKeys);
																	t.data("commandused", "Sell");
																	t.data("amountofsets", amountofsets.toString());
																	t.data("amountofkeys", n);
																	t.send((ERR, STATUS) => {
																		if (ERR) {
																			client.chatMessage(SENDER, "⚠️ An error occurred while sending your trade. Steam Trades could be down. Please try again later.");
																			logcolors.fail("| [Steam] |: An error occurred while sending trade: " + ERR);
																		} else {
																			client.chatMessage(SENDER, "✔️ Trade Sent! Confirming it...");
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
									client.chatMessage(SENDER, "⚠️ Please make sure you don't have a trade hold!");
								}
							});
						} else {
							client.chatMessage(SENDER, "⚠️ Please try a lower amount of keys.");
						}
					} else {
						client.chatMessage(SENDER, "⚠️ Please enter a valid amount of keys!");
					}
			} else {
				client.chatMessage(SENDER, "⚠️ Please try again later.");
			}
		
	} else {
		client.chatMessage(SENDER, "⚠️ Command not recognized. Type !commands to see all the commands.");;
	}
	
	
});

client.on("friendRelationship", (SENDER, REL) => {
    if (REL === 2) {
        client.addFriend(SENDER);
    } else if (REL === 3) {
        if (CONFIG.INVITETOGROUPID) {
            client.inviteToGroup(SENDER, CONFIG.INVITETOGROUPID);
        }
        client.chatMessage(SENDER, CONFIG.MESSAGES.WELCOME);
    }
});

manager.on("sentOfferChanged", (OFFER, OLDSTATE) => {
    if (OFFER.state == 2) {
        client.chatMessage(OFFER.partner, "Trade confirmed! Click here to accept it: https://www.steamcommunity.com/tradeoffer/" + OFFER.id);
    } else if (OFFER.state == 3) {
        Utils.getInventory(client.steamID.getSteamID64(), community, (ERR, DATA) => {
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
                    client.gamesPlayed(playThis);
                });
            } else {
                logcolors.fail("| [Steam] |: An error occurred while getting bot inventory: " + ERR);
            }
        });
        if (CONFIG.INVITETOGROUPID) {
            client.inviteToGroup(OFFER.partner, CONFIG.INVITETOGROUPID);
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
                client.chatMessage(OFFER.partner, "An error occurred while getting your profile (to comment).");
            } else {
                USER.comment(CONFIG.COMMENTAFTERTRADE, (ERR) => {
                    if (ERR) {
                        logcolors.fail("| [Steam] |: An error occurred while commenting on user profile: " + ERR);
                        client.chatMessage(OFFER.partner, "An error occurred while getting commenting on your profile.");
                    } else {
                        client.chatMessage(OFFER.partner, "Thanks for trading! :D");
                    }
                });
            }
        });
    } else if (OFFER.state == 6) {
        client.chatMessage(OFFER.partner, "Hey, you did not accept the offer. Please try again if you wish to receive sets!");
    }
});

manager.on("newOffer", (OFFER) => {
    if (CONFIG.ADMINS.indexOf(OFFER.partner.getSteamID64()) >= 0 || CONFIG.ADMINS.indexOf(parseInt(OFFER.partner.getSteamID64())) >= 0) {
        OFFER.getUserDetails((ERR, ME, THEM) => {
            if (ERR) {
                logcolors.fail("| [Debug] |: An error occurred while getting trade holds: " + ERR);
                client.chatMessage(OFFER.partner, "An error occurred while getting your trade holds. Please try again");
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
                        client.chatMessage(OFFER.partner, "Offer accepted!");
                    }
                });
            } else {
                client.chatMessage(OFFER.partner, "Please make sure you don't have a trade hold!");
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
