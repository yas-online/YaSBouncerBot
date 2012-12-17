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
    shadowDb = require("shadow-db");    // Password code hinting
require("colors");                      // Because colors in console are more beautiful

var moduleCache = {};

/**
 * Intercepts function calls
 * @author Mortchek
 * @link irc://irc.freenode.net/##javascript
 * @param old {function}
 * @param receiver {function}
 * @return {Function}
 */
var intercept = function (old, receiver) {
    return function () {
        receiver.apply(this, arguments);
        old.apply(this, arguments);
    }
};


function IrcBot (config) {
    // JavaScript stuff
    var self = this;

    /** Read and prepare the config */
    this.conf = this.prepareConfig(config);             // Read our config abstraction
    _.defaults(this.conf, require("./defaults.json"));    // Fill holes with defaults

    /** Open the shadowDb for password resolving */
    this.passwd = new shadowDb(this.conf.shadowDb, __dirname);
    /** Stores all loaded modules */
    this.addons = {};
    /** Create our irc client */
    this.client = new irc.Client(this.conf.server.host, this.conf.nickname, this.conf.clientConfig);
    this.client.addListener("error", function (err) {
        self.logError("Internal Error!", err);
    });

    /**
     * Evil hook for logging
     * @author Mortchek
     * @link irc://irc.freenode.net/##javascript
     */
    if (this.conf.rawsendlog) {
        this.client.send = intercept(this.client.send, this.logIrcCommand);
    }
    if (this.conf.raweventlog) {
        this.client.addListener("raw", function (message) {
            self.logEvent(message.command, message);
        });
    }

    this.logNotice( "Bot Configured! Configured Nickname: " + this.conf.nickname );
    this.logNotice( "Server: %s:%d %s", this.conf.server.host, this.conf.server.port, (this.conf.server.ssl ? "SSL".green : "unencrypted".red) );
}

exports.IrcBot = IrcBot;

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
        autoRejoin: false,
        autoConnect: false,
        channels: configuration.server.channel,
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

IrcBot.prototype.__defineGetter__("me", function () {
    return this.client.opt.nick;
});

/**
 * Load a module safely
 * @param moduleFile {string} Filename of the module
 * @return {boolean} Success
 */
IrcBot.prototype.loadModule = function (moduleFile) {
    try {
        var mod = moduleCache[moduleFile] = require("./modules/" + moduleFile);
        if (mod.modName) {
            this.addons[mod.modName] = new mod[mod.modName](this);
            this.addons[mod.modName].logNotice("Registered and loaded.");
            this.addons[mod.modName].setActive(true);
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

IrcBot.prototype.message = function (target, message) {
    var self = this;
    if (typeof target == "string") {
        if (target == "all") {
            _.each(this.client.chans, function (to) {
                self.say(to, message);
            });
        } else {
            this.say(target, message);
        }
    } else if (_.isArray(target)) {
        _.each(target, function (to) {
            self.say(to, message);
        });
    } else {
        this.logWarn("Failed to deliver '" + message + "' to type " + typeof target + "!?");
    }
};

IrcBot.prototype.moduleEnabled = function (ircBotModule) {
    ircBotModule.logSuccess("Enabled successfully and events registered.");
};

IrcBot.prototype.moduleDisabled = function (ircBotModule) {
    ircBotModule.logSuccess("Disabled successfully and events un-registered.");
};

IrcBot.prototype.logNotice = function (message) {
    util.log("Notice > ".cyan + util.format.apply(this, arguments));
};

IrcBot.prototype.logWarn = function (message) {
    util.log("Warning ! ".yellow + util.format.apply(this, arguments));
};

IrcBot.prototype.logError = function (message, err) {
    err = arguments[arguments.length - 1];
    delete arguments[arguments.length - 1];
    util.log("Error ! ".red + util.format.apply(this, arguments) + ": " + err.toString());
};

IrcBot.prototype.logSuccess = function (message) {
    util.log("Success > ".green.bold + util.format.apply(this, arguments));
};

IrcBot.prototype.logIrcCommand = function (command, params) {
    delete arguments[0];
    util.log(command.red.underline.bold + " > " + _.values(arguments).join(" "));
};

IrcBot.prototype.logEvent = function (command, message) {
    util.log("Event > ".magenta.bold + ('' + command).cyan.bold.underline + (": " + JSON.stringify(message.args)).grey);
};

// Mappers

IrcBot.prototype.ctcp = function (to, type, text) {
    //this.logIrcCommand("ctcp", [to, type, text]);
    this.client.ctcp(to, type, text);
};

IrcBot.prototype.notice = function (target, text) {
    //this.logIrcCommand("notice", [target, text]);
    this.client.notice(target, text);
};

IrcBot.prototype.say = function (target, text) {
    //this.logIrcCommand("say", [target, text]);
    this.client.say(target, text);
};

IrcBot.prototype.sendRaw = function (command, args) {
    //this.logIrcCommand.apply(this, arguments);
    this.client.send.apply(this, arguments);
};

// Connection and management

IrcBot.prototype.connected = function () {
//    var self = this;
//    _.each(this.conf.server.channel, function (channel) {
//        if (typeof channel == "object")
//            channel = channel.join(" ");
//
//        setTimeout(function () {
//            self.client.join(channel);
//        }, 2000);
//    });
};

/** Runs the bot, including establishing a connection to IRC */
IrcBot.prototype.run = function () {
    var self = this;
    process.on("SIGINT", function () {
        self.client.disconnect("CTRL + C received, good bye.", function () {
            process.exit(0);
        });
    });

    /** Load all modules */
    _.each(this.conf.addons, function (module) {
        var fileName = "Module." + module + ".js";
        self.loadModule(fileName);
    });

    this.client.connect(5, function () { self.connected(); });
};

/* Example usage:

 var myBot = new IrcBot("config.json");
 myBot.run();

 */