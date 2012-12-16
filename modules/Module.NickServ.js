var util = require("util"),
    modules = require("./module.js");

/**
 * NickServ Module
 * @param ircBot {IrcBot}
 */
function ModNickServ (ircBot) {
    this(ircBot);
    this.name = "ModNickServ";
    this.description = "Provides authentication with NickServ";
    this.patterns = {
        notice: new RegExp(/identify/i),
        login: new RegExp(/passwor(d|t) (accepted|akzeptiert)/i)
    };
    this.notified = false;
    this.loggedIn = false;
    this.nickserv = "NickServ";
    this.password = this.parent.passwd.getPassPhrase(this.parent.conf.nickserv.password);
}
ModNickServ.prototype = new modules.IrcBotModule();
exports.mod = ModNickServ;

/** Inherit the module base */
//util.inherits(ModNickServ, modules.IrcBotModule);

ModNickServ.prototype.onNotice = function (nick, to, text, message) {
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

