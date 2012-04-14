
var http = require('http'),
	util = require('util'),
	rooter = require('./rooter');	

http.createServer(function(req, res){
	rooter.redirect(req, res);
}).listen(4000);

rooter.refreshCookieTask();

console.log('Listen on port 4000!');
