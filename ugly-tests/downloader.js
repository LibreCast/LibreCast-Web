var express = require('express');
var torrentStream = require('torrent-stream');
var randomPort = require('random-port');
var parseTorrent = require('parse-torrent');

//var shasum = crypto.createHash('sha1');

randomPort(function (port) {
	var magnet = 'magnet:?xt=urn:btih:a18305d1cc4b16b3025fd14c108d30759aab993b&dn=cheval.jpg&tr=http%3A%2F%2Flocalhost%3A9090%2Fannounce';
	console.log(parseTorrent(magnet));
	var engine = torrentStream(magnet);

	engine.on('ready', function() {
		console.log('ready');

		engine.files.forEach(function(file) {
			console.log('filename:', file.name);
			var stream = file.createReadStream();
			// stream is readable stream to containing the file content
			
			var buffer = '';
			stream.on('data', function (data) {
				buffer += data;
			});
			stream.on('end', function (data) {
				console.log(buffer.length);
			});
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