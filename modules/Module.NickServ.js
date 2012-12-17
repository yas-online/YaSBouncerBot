var util = require("util"),
    modules = require("./module.js");

/**
 * NickServ Module
 * @param ircBot {IrcBot}
 */
function NickServ (ircBot) {
    this.constructor(ircBot);
    this.notified = false;
    this.loggedIn = false;
    this.nickserv = "NickServ";
    this.password = this.parent.passwd.getPassPhrase(this.parent.conf.nickserv.password);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IrcBotModule Indentification

NickServ.prototype = new modules.IrcBotModule();
exports.NickServ = NickServ;

exports.modName =
    NickServ.prototype.modName = "NickServ";
exports.description =
    NickServ.prototype.description = "Provides authentication with NickServ";
exports.version =
    NickServ.prototype.version = "1.0.0";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

NickServ.prototype.patterns = {
    notice: /identify/i,
    login: /passwor(d|t) (accepted|akzeptiert)/i,
    loginStatus: /^status [^\s]+ 3/i,
    notRegistered: /^status [^\s]+ 0/i
};

NickServ.prototype.onRegistered = function (message) {
    this.logNotice("Sending STATUS command to NickServ.");
    this.parent.message(this.nickserv, "STATUS");
};

NickServ.prototype.onNotice = function (nick, to, text, message) {
    var self = this;
    if (nick && nick == this.nickserv) {
        if (!this.notified && !this.loggedIn && text.match(this.patterns.notRegistered)) {
            this.logNotice("Nickname wasn't registered, sending REGISTER command to NickServ.");
            this.parent.message(nick, "REGISTER " + this.password + " " + this.parent.me.replace(/[^a-z]+/g,"") + "@yas-online.net");
            this.parent.message(nick, "STATUS");
            this.notified = true;
        }
        if (!this.notified && text.match(this.patterns.notice)) {
            this.logNotice("Got notified by NickServ. INDENTIFY command has been send");
            this.parent.message(nick, "IDENTIFY " + this.password);
            this.notified = true;
        }
        if (!this.loggedIn && (text.match(this.patterns.login) || text.match(this.patterns.loginStatus))) {
            this.logSuccess("NickServ confirmed our login!");
            this.parent.message(nick, "UPDATE");
            this.loggedIn = true;
        }
        return true;
    }
    return false;
};

NickServ.prototype.onCtcpVersion = function (from, to) {
    if (to == this.parent.me) {
        this.parent.ctcp(from, "notice", "VERSION YaSBouncerBot." + this.modName + ":Version(" + this.version + ")");
        return true;
    }
    return false;
};

NickServ.prototype.afterDisabled = function () {
    /** Reset Module status on disable */
    this.notified = false;
    this.loggedIn = false;
};