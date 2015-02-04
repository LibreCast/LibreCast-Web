var express = require('express');
var peerflix = require('peerflix');

var torrent = 'magnet:?xt=urn:btih:0E876CE2A1A504F849CA72A5E2BC07347B3BC957&dn=big+buck+bunny+720p+psiclone&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.com%3A1337';
var engine = peerflix(torrent);

engine.server.on('listening', function () {
	var localHref = 'http://localhost:' + engine.server.address().port + '/';
	var filename = engine.server.index.name.split('/').pop().replace(/\{|\}/g, '');
	var filelength = engine.server.index.length;

	console.log(localHref);
});