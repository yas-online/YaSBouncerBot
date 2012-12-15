var _ = require("underscore"),
    util = require("util");

/**
 * Provides the base for all {IrcBot} modules
 * @constructor
 * @param ircBot {IrcBot}
 */
var IrcBotModule = function (ircBot) {
    this.parent = ircBot;
    this.name = "";
    this.description = "";
    this.active = false;
    this.events = {};
};

IrcBotModule.prototype.setActive = function (active) {
    if (typeof active == "boolean") {
        this.active = active;
    } else if (typeof active == "string") {
        this.active = active.match(/(y(es)?|ja?|on|enabled?)/i);
    } else {
        this.active = false;
    }
    this.parent.message("all", this.name + " - Set to " + (this.active ? "ACTIVE" : "INACTIVE"));
    this[(this.active ? "enable" : "disable")]();
    return this.active;
};

IrcBotModule.prototype.enable = function () {
    this.registerEvents();
    this.parent.moduleEnabled(this);
    //TODO: Add more initialization code here
};

IrcBotModule.prototype.disable = function () {
    this.unregisterEvents();
    this.parent.moduleDisabled(this);
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
            if (member.match(/^on[a-z]+/)) {
                var event = member.substr(2);
                self.events[event] = member;
                self.parent.addListener(event, self[member]);
                self.parent.logNotice(self.name + ": Registered new event '" + event + ":" + member + "'");
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
    _.each(this.events, function (member, event) {
        self.parent.removeListener(event, self[member]);
        self.parent.logNotice(self.name + ": Dropped event '" + event + ":" + member + "'");
        delete self.events[event];
    });
};