var Client = require('bittorrent-tracker');
var parseTorrent = require('parse-torrent');
var randomPort = require('random-port');
var fs = require('fs');

var magnet = 'magnet:?xt=urn:btih:a18305d1cc4b16b3025fd14c108d30759aab993b&dn=cheval.jpg&tr=http%3A%2F%2Flocalhost%3A9090%2Fannounce';
var parsedTorrent = parseTorrent(magnet);

var peerId = new Buffer('01234567890123456789');

randomPort(function (port) {
	var client = new Client(peerId, port, parsedTorrent);

	client.on('error', function (err) {
		// fatal client error! 
		console.log(err.message);
	});

	client.on('warning', function (err) {
		// a tracker was unavailable or sent bad data to the client. you can probably ignore it 
		console.log(err.message);
	});

	client.start();

	client.on('update', function (data) {
		console.log('got an announce response from tracker: ' + data.announce);
		console.log('number of seeders in the swarm: ' + data.complete);
		console.log('number of leechers in the swarm: ' + data.incomplete);
	});

	client.on('peer', function (addr) {
		console.log('found a peer: ' + addr);
	});
});
