var bot = require("./irc_bot.js");

var zncBot = new bot.IrcBot("yasbouncer.json");
zncBot.run();