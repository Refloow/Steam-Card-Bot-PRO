// Original work: Copyright (c) 2020-2021 Refloow All rights reserved.

const config = require('../../config.js');
const logcolors = require('../../../logcolors.js')


t = module.exports = {
    // This method checks if any of this values are not set in the config
    validatelogininfo: function() {
        
        // Adding extra space  
        console.log(`\n`);
        logcolors.info(`This is config shown visually for better lookup \n`)
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
    }
}

// Original work: Copyright (c) 2020-2021 Refloow All rights reserved.
