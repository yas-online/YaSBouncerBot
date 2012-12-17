var _ = require("underscore"),
    util = require("util");

require("colors");

/**
 * Provides the base for all {IrcBot} modules
 * @param ircBot {IrcBot}
 */
function IrcBotModule (ircBot) {
    this.parent = ircBot;
    this.active = false;
    this.events = {};
}

exports.IrcBotModule = IrcBotModule;

IrcBotModule.prototype.modName = "";
IrcBotModule.prototype.description = "";
IrcBotModule.prototype.version = "";

IrcBotModule.prototype.setActive = function (active) {
    if (typeof active == "boolean") {
        this.active = active;
    } else if (typeof active == "string") {
        this.active = active.match(/(y(es)?|ja?|on|enabled?)/i);
    } else {
        this.active = false;
    }
    this.parent.message("all", this.modName + " - Set to " + (this.active ? "ACTIVE" : "INACTIVE"));
    this[(this.active ? "enable" : "disable")]();
    return this.active;
};

IrcBotModule.prototype.enable = function () {
    this.registerEvents();
    this.parent.moduleEnabled(this);
    if (this.afterEnabled && typeof this.afterEnabled == "function") {
        this.afterEnabled();
    }
    //TODO: Add more initialization code here
};

IrcBotModule.prototype.disable = function () {
    this.unregisterEvents();
    this.parent.moduleDisabled(this);
    if (this.afterDisabled && typeof this.afterDisabled == "function") {
        this.afterDisabled();
    }
    //TODO: Add more disable-logic here
};

/**
 * Provides a common interface to call module Commands
 *
 * @param command {string} The Command that should be invoked
 * @param target {string} Where the the command was called. Either a channel name or Myself.
 * @param nick {string} Who used the command
 * @param params {object} A list of parameters, excluding the command itself.
 * @param text {string} The full message part unparsed, including the command.
 * @param rawIrcCommand {object} {@see Client.rawCommand}
 */
IrcBotModule.prototype.callCommand = function (command, target, nick, params, text, rawIrcCommand) {
    if (this["cmd" + command]) {
        return this["cmd" + command](target, nick, params, text, rawIrcCommand);
    } else {
        return true; // Returning false will stop the execution of the stack.
    }
};

/**
 * Internal. Used by IrcBotModule.enable to register events
 * @protected
 */
IrcBotModule.prototype.registerEvents = function () {
    var self = this;
    if (!this.events.length) {
        var functions = _.functions(this);
        _.each(functions, function (member) {
            if (member.match(/^on[a-z]+/i)) {
                var eventName = member.substr(2);
                var event = "";
                for (var i = 0; i < eventName.length; i++) {
                    var nchar = eventName.charAt(i);
                    if(i != 0 && nchar.match(/[A-Z]/)) {
                        event += "-";
                    }
                    event += nchar.toLowerCase();
                }
                self.events[event] = function () {
                    if (self[member].apply(self, arguments) === true) {
                        self.logNotice("Event " + event.red + " fired. [arguments: " + JSON.stringify(arguments).grey + " ]");
                    }
                };
                self.parent.client.addListener(event, self.events[event]);
                self.logNotice("Registered new event '" + event.red + ":" + member.yellow + "'");
            }
        });
    }
};

/**
 * Internal. Used by IrcBotModule.disable to un-register events
 * @protected
 */
IrcBotModule.prototype.unregisterEvents = function () {
    var self = this;
    _.each(this.events, function (callback, event) {
        self.parent.client.removeListener(event, callback);
        self.parent.logNotice("Dropped event '" + event + ":" + member + "'");
        delete self.events[event];
    });
};

//
// Following: a few wrappers
//

IrcBotModule.prototype.__defineGetter__("fname", function () {
    return "[" + this.modName.magenta + " v".grey + this.version.cyan + "]";
});

IrcBotModule.prototype.logNotice = function (message) {
    this.parent.logNotice(this.fname + " " + message)
};

IrcBotModule.prototype.logWarn = function (message) {
    this.parent.logWarn(this.fname + " " + message)
};

IrcBotModule.prototype.logError = function (message) {
    this.parent.logError(this.fname + " " + message)
};

IrcBotModule.prototype.logSuccess = function (message) {
    this.parent.logSuccess(this.fname + " " + message)
};