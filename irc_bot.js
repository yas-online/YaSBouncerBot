/**
 * Bot base, no logic goes here, just the base which loads and handles
 * addons and stuff.
 * @author David Marner
 * @date 15.12.2012
 * @time 02:07
 */

/** What do we need? */
var utf8 = require("utf8"),             // UTF-8, for sane man.
    util = require("util"),             // General Node.js utilities
    _ = require("underscore"),          // Everything you need to work with objects.
    irc = require("irc"),               // Easy to use and complete IRC Class
    anyDb = require("any-db"),          // SQLite, MySQL, MSSQL ... whatever, it'll connect!
    shadowDb = require("shadow-db"),    // Password code hinting
    modules = require("./modules/module.js"); // see file
require("colors");                      // Because colors in console are more beautiful

function IrcBot (config) {
    // JavaScript stuff
    var self = this;

    /** Read and prepare the config */
    this.conf = this.prepareConfig(config);             // Read our config abstraction
    _.defaults(this.conf, require("./defaults.json"));    // Fill holes with defaults

    /** Open the shadowDb for password resolving */
    this.passwd = new shadowDb(this.conf.shadowDb, __dirname);
    /** Stores all loaded modules */
    this.modules = {};
    /** Create our irc client */
    this.client = new irc.Client(this.conf.server.host, this.conf.nickname, this.conf.clientConfig);

    /** Load all modules */
    _.each(this.conf.modules, function (module) {
        var fileName = "Module." + module + ".js";
        self.loadModule(fileName);
    });

    this.logNotice( "Bot Configured! Nickname: " + this.conf.nickname );
};

/** Prepare and, if necessary, read config from File */
IrcBot.prototype.prepareConfig = function (configuration) {
    if (typeof configuration == "string") {
        configuration = require("./" + configuration);
    }
    /** clientConfig is required by irc.Client */
    configuration.clientConfig = {
        userName: 'yas-ircbot',
        realName: 'YaS Bouncer Bot',
        port: configuration.server.port,
        debug: false,
        showErrors: false,
        autoRejoin: true,
        autoConnect: false,
        channels: [],
        secure: configuration.server.ssl,
        selfSigned: true,
        certExpired: true,
        floodProtection: false,
        floodProtectionDelay: 1000,
        stripColors: false,
        channelPrefixes: "&#",
        messageSplit: 512
    };
    return configuration;
};

/**
 * Load a module safely
 * @param moduleFile {string} Filename of the module
 * @return {boolean} Success
 */
IrcBot.prototype.loadModule = function (moduleFile) {
    try {
        var botModule = require("./modules/" + moduleFile).mod;
        var mod = new botModule(this);
        if (mod.name && mod.description) {
            this.modules[mod.name] = mod;
            this.modules[mod.name].setActive(true);
            this.logNotice(mod.name + ": Loaded.");
            return true;
        } else {
            this.logWarn(moduleFile + ": Isn't an instance of IrcBotModule - not loading.");
            return false;
        }
    } catch (err) {
        this.logError("Error while trying to load '" + moduleFile + "'", err);
        return false;
    }
};

IrcBot.prototype.logNotice = function (message) {
    util.log("Notice > ".cyan + message);
};

IrcBot.prototype.logWarn = function (message) {
    util.log("Warning ! ".yellow + message);
};

IrcBot.prototype.logError = function (message, err) {
    util.log("Error ! ".red + message + ": " + err.toString());
};

IrcBot.prototype.logSuccess = function (message) {
    util.log("Success > ".magenta + message.green);
};

/** Runs the bot, including establishing a connection to IRC */
IrcBot.prototype.run = function () {
    this.client.connect();
};

/* Example usage:

 var myBot = new IrcBot("config.json");
 myBot.run();

 */

exports.IrcBot = IrcBot;
exports.IrcBotModule = modules.IrcBotModule;