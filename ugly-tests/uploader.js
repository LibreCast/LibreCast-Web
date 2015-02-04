var fs = require('fs');
var express = require('express');
var torrentStream = require('torrent-stream');
var randomPort = require('random-port');

var torrent = fs.readFileSync('./example.torrent');

//var shasum = crypto.createHash('sha1');

randomPort(function (port) {
	//var magnet = 'magnet:?xt=urn:btih:d8f5c0c45cbeec6e0338e3d8bc04b614b57e753e&dn=181%5FS%C3%A9lection.png&tr=http%3A%2F%2Flocalhost%3A9090%2Fannounce';
	var engine = torrentStream(torrent);

	engine.on('ready', function() {
		console.log('ready');
		console.log(engine);

		engine.files.forEach(function(file) {
			console.log('filename:', file.name);
			//var stream = file.createReadStream();
			// stream is readable stream to containing the file content
			

		});

		engine.on('download', function (pieceIndex) {
			console.log('download: '+pieceIndex);
		});
		engine.on('upload', function (pieceIndex, offset, length) {
			console.log('upload: '+pieceIndex, offset, length);
		});
	});

	engine.listen(port, function () {
		console.log('listening');
	});

	engine.swarm.on('wire', function (wire) {
		console.log('wire', wire.peerAddress);
	});

	engine.on('peer', function (addr) {
		console.log('peer', addr);
	});
});