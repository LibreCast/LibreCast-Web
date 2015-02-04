var Server = require('bittorrent-tracker').Server;

var server = new Server({
	udp: true, // enable udp server? [default=true] 
	http: true, // enable http server? [default=true] 
	filter: function (infoHash) {
		// black/whitelist for disallowing/allowing torrents [default=allow all] 
		// this example only allows this one torrent 
		console.log(infoHash);
		return true;
	}
});

server.on('error', function (err) {
	// fatal server error! 
	console.log(err.message);
});

server.on('warning', function (err) {
	// client sent bad data. probably not a problem, just a buggy client. 
	console.log(err.message);
});

server.on('listening', function () {
	// fired when all requested servers are listening 
	console.log('listening on http port: ' + server.http.address().port);
	console.log('listening on udp port: ' + server.udp.address().port);
});

server.listen(9090);

// listen for individual tracker messages from peers: 
 
server.on('start', function (addr) {
	console.log('got start message from ' + addr);
	console.log(server.torrents);
});
 
server.on('complete', function (addr) {
	console.log('got complete message from ' + addr);
});
server.on('update', function (addr) {
	console.log('got update message from ' + addr);
});
server.on('stop', function (addr) {
	console.log('got stop message from ' + addr);
});
