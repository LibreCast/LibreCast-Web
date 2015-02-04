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
		date: new Date(),
		enclosure: {
			url: 'http://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_480p_surround-fix.avi',
			length: 220514438,
			type: 'video/x-msvideo'
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