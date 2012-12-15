var shadowDb = require("shadow-db"),
    util = require("util");

var passwd = new shadowDb("mydb.json", __dirname);

var myShadow = passwd.getShadow("29gswo85zguekulszh5go83wk4uhztog83");
util.log( "getShadow: " + myShadow );

util.log( "getPassPhrase: " + passwd.getPassPhrase(myShadow) );

util.log( "getAlgorithm: " + passwd.getAlgorithm() );

util.log( passwd.loaded );

util.log( "Forward Table: \n" + util.inspect(passwd.forward) );

try {
    passwd.addEntry("King Size");
    util.log( "New key added." );
} catch (err) {
    util.error(err);
    util.log( "No new key added." );
}

passwd.save();
