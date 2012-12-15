var shadowDb = require("shadow-db"),
    util = require("util");
require("colors");

/** Open our shadowDb */
var passwd = new shadowDb("mydb.json", __dirname);

/** Try getting a shadow entry from a password */
var myShadow = passwd.getShadow("29gswo85zguekulszh5go83wk4uhztog83");
util.log( "getShadow: ".yellow + myShadow );

/** Reverse search on the retrieved shadow */
util.log( "getPassPhrase: ".yellow + passwd.getPassPhrase(myShadow) );

/** What algorithm does our db use? */
util.log( "getAlgorithm: ".yellow + passwd.getAlgorithm() );

/** What's our current shadow table file? */
util.log( passwd.loaded.cyan );

/** Show all entries in our table */
util.log( "Forward Table: \n".yellow + util.inspect(passwd.forward, true, null, true) );


/** Try adding a new entry to the table */
try {
    passwd.addEntry("King Size");
    util.log( "New key added.".green );
} catch (err) {
    util.log( "Error: ".red + err.toString().grey );
    util.log( "No new key added.".red );
}

/** Save our table */
passwd.save();

/** Done. */
util.log( "We are all ".yellow + "DONE".green );