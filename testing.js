var shadowDb = require("shadow-db"),
    util = require("util");

/** Open our shadowDb */
var passwd = new shadowDb("mydb.json", __dirname);

/** Try getting a shadow entry from a password */
var myShadow = passwd.getShadow("29gswo85zguekulszh5go83wk4uhztog83");
util.log( "getShadow: " + myShadow );

/** Reverse search on the retrieved shadow */
util.log( "getPassPhrase: " + passwd.getPassPhrase(myShadow) );

/** What algorithm does our db use? */
util.log( "getAlgorithm: " + passwd.getAlgorithm() );

/** What's our current shadow table file? */
util.log( passwd.loaded );

/** Show all entries in our table */
util.log( "Forward Table: \n" + util.inspect(passwd.forward) );


/** Try adding a new entry to the table */
try {
    passwd.addEntry("King Size");
    util.log( "New key added." );
} catch (err) {
    util.error(err);
    util.log( "No new key added." );
}

/** Save our table */
passwd.save();
