/**
 * Bot base, no logic goes here, just the base which loads and handles
 * addons and stuff.
 * @author David Marner
 * @date 15.12.2012
 * @time 02:07
 */

/** What do we need? */
var utf8 = require("utf8"),             // UTF-8, for sane man.
    _ = require("underscore"),          // Everything you need to work with objects.
    irc = require("irc"),               // Easy to use and complete IRC Class
    anyDb = require("any-db"),          // SQLite, MySQL, MSSQL ... whatever, it'll connect!
    shadowDb = require("shadow-db"),    // Password code hinting
    IrcBotModule = require("./modules/module.js"); // see file
    require("colors");                  // Because colors in console are more beautiful

/** @constructor */
var IrcBot = function (config) {
    this.conf = this.prepareConfig(config);             // Read our config abstraction
    _.defaults(this.conf, require("defaults.json"));    // Fill holes with defaults
    this.passwd = new shadowDb(this.conf.shadowDb, __dirname);
    this.modules = {};
};

/** Prepare and, if necessary, read config from File */
IrcBot.prototype.prepareConfig = function (configuration) {
    if (typeof configuration == "string") {
        configuration = require("./" + configuration);
    }
    // Maybe add more logic here if needed.
    return configuration;
};

/** Load Module */
IrcBot.prototype.loadModule = function (moduleFile) {
    try {
        var mod = require("./modules/" + moduleFile);
        if (mod instanceof IrcBotModule) {

        }
    }
};

/** Runs the bot, including establishing a connection to IRC */
IrcBot.prototype.run = function () {
    //TODO: Add run code.
};

/* Example usage:

var myBot = new IrcBot("config.json");
myBot.run();

*/