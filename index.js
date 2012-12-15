/**
 * Bot base, no logic goes here, just the base which loads and handles
 * addons and stuff.
 * @author David Marner
 * @date 15.12.2012
 * @time 02:07
 */

/** What do we need? */
var utf8 = require("utf8"),     // UTF-8, for sane man.
    _ = require("underscore"),  // Everything you need to work with objects.
    anyDb = require("any-db"),  // SQLite, MySQL, MSSQL ... whatever, it'll connect!
    colors = require("colors"); // Because colors in console are more beautiful

/** @constructor */
var ZncBot = function (config) {
    this.conf = this.prepareConfig(config);             // Read our config abstraction
    _.defaults(this.conf, require("defaults.json"));    // Fill holes with defaults
};

/** Prepare and, if necessary, read config from File */
ZncBot.prototype.prepareConfig = function (configuration) {
    if (typeof configuration == "string") {
        configuration = require("./" + configuration);
    }
    // Maybe add more logic here if needed.
    return configuration;
};

/** Runs the bot, including establishing a connection to IRC */
ZncBot.prototype.run = function () {
    //TODO: Add run code.
};

/* Example usage:

var myBot = new ZncBot("config.json");
myBot.run();

*/