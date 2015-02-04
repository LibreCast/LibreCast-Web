var express = require('express');
var Podcast = require('podcast');

var app = express();

app.get('/:channel/feed.xml', function (req, res) {
	var feed = new Podcast({
		title: 'LibreCast',
		feed_url: 'http://localhost:9000/feed.xml',
		site_url: 'http://localhost:9000/',
		author: 'LibreCast'
	});

	feed.item({
		title: 'Hello World!',
		description: 'First post',
		url: 'http://localhost:9000/librecast#hello-world',
		date: 'November 5, 1984',
		enclosure: {
			url: 'http://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_480p_surround-fix.avi',
			size: '220514438',
			type: 'video/x-msvideo'
		}
	});

	feed.item({
		title: 'Torrent file',
		description: 'Wow',
		url: 'http://localhost:9000/librecast#torrent-file',
		date: 'November 5, 1984',
		enclosure: {
			//url: 'magnet:?xt=urn:btih:4A5942DD1BB1DF3D2491B18FF48F627415E1947C&dn=the+interview+2014+720p+brrip+x264+yify&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce',
			url: 'http://torcache.net/torrent/4A5942DD1BB1DF3D2491B18FF48F627415E1947C.torrent?title=%5Bkickass.so%5Dthe.interview.2014.720p.brrip.x264.yify',
			size: '123456',
			type: 'application/x-bittorrent' // For .torrent files
		}
	});

	var xml = feed.xml();

	res.type('application/rss+xml').send(xml);
});

app.use(express.static(__dirname+'/public'));

var server = app.listen(9000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Server listening at http://%s:%s', host, port);
});