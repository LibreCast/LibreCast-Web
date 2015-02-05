var express = require('express');
var RSS = require('rss');
var ATOM = require('./lib/atom');

var port = process.env.PORT || 9000;
var baseUrl = 'http://localhost:'+port;

var app = express();

function indexFeed(Feed) {
	var filename = (Feed === ATOM) ? 'atom' : 'feed';

	var feed = new Feed({
		title: 'LibreCast',
		feed_url: baseUrl+'/'+filename+'.xml',
		site_url: baseUrl,
		generator: 'LibreCast'
	});

	var item = {
		title: 'LibreCast',
		description: 'LibreCast test channel',
		url: baseUrl+'/librecast',
		date: '05 October 2011 14:48 UTC'
	};
	if (Feed === ATOM) {
		item.custom_elements = [
			{ link: { _attr: { type: 'application/atom+xml', rel: 'alternate', href: item.url+'/atom.xml' } } }
		];
	}
	feed.item(item);

	return feed.xml(true);
}

function channelFeed(Feed, channel) {
	var filename = (Feed === ATOM) ? 'atom' : 'feed';

	var feed = new Feed({
		title: 'LibreCast',
		feed_url: baseUrl+'/'+channel+'/'+filename+'.xml',
		site_url: baseUrl+'/'+channel,
		author: 'LibreCast'
	});

	feed.item({
		title: 'Hello World!',
		description: 'First post',
		url: baseUrl+'/'+channel+'#hello-world',
		date: '05 October 2011 14:48 UTC',
		enclosure: {
			url: 'http://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_480p_surround-fix.avi',
			size: '220514438',
			type: 'video/x-msvideo'
		}
	});

	feed.item({
		title: 'Torrent file',
		description: 'Wow',
		url: baseUrl+'/'+channel+'#torrent-file',
		date: '05 October 2011 14:48 UTC',
		enclosure: {
			//url: 'magnet:?xt=urn:btih:4A5942DD1BB1DF3D2491B18FF48F627415E1947C&dn=the+interview+2014+720p+brrip+x264+yify&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce',
			url: 'http://torcache.net/torrent/4A5942DD1BB1DF3D2491B18FF48F627415E1947C.torrent?title=%5Bkickass.so%5Dthe.interview.2014.720p.brrip.x264.yify',
			size: '123456',
			type: 'application/x-bittorrent' // For .torrent files
		}
	});

	return feed.xml(true);
}

app.get('/feed.xml', function (req, res) {
	var xml = indexFeed(RSS);
	res.type('application/rss+xml').send(xml);
});

app.get('/atom.xml', function (req, res) {
	var xml = indexFeed(ATOM);
	res.type('application/atom+xml').send(xml);
});

app.get('/:channel/feed.xml', function (req, res) {
	var channel = req.params.channel;

	var xml = channelFeed(RSS, channel);
	res.type('application/rss+xml').send(xml);
});

app.get('/:channel/atom.xml', function (req, res) {
	var channel = req.params.channel;

	var xml = channelFeed(ATOM, channel);
	res.type('application/atom+xml').send(xml);
});

app.use(express.static(__dirname+'/public'));

var server = app.listen(9000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Server listening at http://%s:%s', host, port);
});