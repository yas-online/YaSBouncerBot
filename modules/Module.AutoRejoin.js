var util = require("util"),
    modules = require("./module.js");

/**
 * AutoRejoin Module
 * @param ircBot {IrcBot}
 */
function AutoRejoin (ircBot) {
    this.constructor(ircBot);
    this.interval = 5000; // 5 seconds
    this.intervalId = false;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IrcBotModule Indentification

AutoRejoin.prototype = new modules.IrcBotModule();
exports.AutoRejoin = AutoRejoin;

exports.modName =
    AutoRejoin.prototype.modName = "AutoRejoin";
exports.description =
    AutoRejoin.prototype.description = "Rejoins a channel after being kicked. And taunts! :)";
exports.version =
    AutoRejoin.prototype.version = "1.0.0";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

AutoRejoin.prototype.kickedFromChannels = [];
AutoRejoin.prototype.taunts = [
    "%s you fucking retard, just doing my job here!",
    "Was that really necessary, %s?",
    "%s: Lamer.",
    "Wow, %s, so you found the kick button?"
];
AutoRejoin.prototype.pendingTaunts = {};

AutoRejoin.prototype.onKick = function (channel, nick, by, reason, message) {
    if (_.contains(this.parent.conf.server.channel, channel) && nick == this.parent.me) {
        this.kickedFromChannels.push(channel);
        var tid = _.random(1, this.taunts.length) - 1;
        this.pendingTaunts[channel] = util.format(this.taunts[tid], by);
        return true;
    }
    return false;
};

AutoRejoin.prototype.onJoin = function (channel, nick, message) {
    if (nick && nick == this.parent.me) {
        if (this.pendingTaunts[channel]) {
            this.parent.message(channel, this.pendingTaunts[channel]);
            delete this.pendingTaunts[channel];
            return true;
        }
    }
    return false;
};

AutoRejoin.prototype.rejoinChannels = function () {
    if (this.kickedFromChannels.length) {
        var channel = this.kickedFromChannels.pop();
        this.parent.client.join(channel);
    }
};

AutoRejoin.prototype.afterEnabled = function () {
    var self = this;
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.logWarn("Previous interval halted! Did you forget to disable the module before re-enabling it?");
    }
    setInterval(function () {
        self.rejoinChannels();
    }, this.interval);
    this.logSuccess("Interval started at " + this.interval.cyan.bold + " msec");
};

AutoRejoin.prototype.afterDisable = function () {
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.logSuccess("Interval halted.");
    }
};