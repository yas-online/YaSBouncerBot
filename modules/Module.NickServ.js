var util = require("util"),
    IrcBotModule = require("./module.js");

/**
 * NickServ Module
 * @constructor
 * @param ircBot {IrcBot}
 */
var modNickServ = function (ircBot) {
    this.super_(ircBot);
    this.name = "modNickServ";
    this.description = "Provides authentification with NickServ";
    this.patterns = {
        notice: new RegExp(/identify/i),
        login: new RegExp(/passwor(d|t) (accepted|akzeptiert)/i)
    };
    this.notified = false;
    this.loggedIn = false;
    this.nickserv = "NickServ";
    this.password = this.parent.passwd.getPassPhrase(this.parent.conf.nickserv.password);
};

/** Inherit the module base */
util.inherits(modNickServ, IrcBotModule);

modNickServ.prototype.onNotice = function (nick, to, text, message) {
    if (nick == this.nickserv) {
        if (!this.notified && this.patterns.notice.match(text)) {
            this.parent.say(nick, "IDENTIFY " + this.password);
            this.parent.logNotice(this.name + ": Got notified by NickServ. INDENTIFY command has been send");
            this.notified = true;
        }
        if (!this.loggedIn && this.patterns.login.match(text)) {
            this.parent.logSuccess(this.name + ": NickServ confirmed our login!");
        }
    }
};

module.exports = modNickServ;