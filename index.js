var url = require('url');
var express = require('express');
var RSS = require('rss');
var ATOM = require('./lib/atom');
var config = require('./config');

var port = process.env.PORT || config.port || 9090;
var baseUrl = config.base || '';

var app = express();

app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

var router = app;
if (baseUrl) {
	router = app.route(url.parse(baseUrl).pathname);
}

function indexFeed(Feed) {
	var filename = (Feed === ATOM) ? 'atom' : 'rss';

	var feed = new Feed({
		title: 'LibreCast',
		feed_url: baseUrl+'/'+filename+'.xml',
		site_url: baseUrl,
		generator: 'LibreCast'
	});

	var item = {
		title: 'LibreCast channel',
		description: 'LibreCast test channel',
		url: baseUrl+'/librecast/',
		date: '05 October 2011 14:48 UTC'
	};
	if (Feed === ATOM) {
		item.custom_elements = [
			{ link: { _attr: { type: 'application/atom+xml', rel: 'alternate', href: baseUrl+'/librecast/atom.xml' } } }
		];
	}
	feed.item(item);

	return feed;
}

function channelFeed(Feed, channel) {
	var filename = (Feed === ATOM) ? 'atom' : 'rss';

	var feed = new Feed({
		title: 'LibreCast channel',
		feed_url: baseUrl+'/'+channel+'/'+filename+'.xml',
		site_url: baseUrl+'/'+channel+'/',
		author: 'LibreCast',
		generator: 'LibreCast'
	});

	var item = {
		title: 'Hello World!',
		description: 'First post',
		url: baseUrl+'/'+channel+'/#hello-world',
		date: '05 October 2011 14:48 UTC',
		enclosure: {
			url: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Big_Buck_Bunny_Trailer_400p.ogg',
			size: '220514438',
			type: 'video/ogg'
		}
	};
	if (Feed === ATOM) {
		item.custom_elements = [
			{ content: [
				{ _attr: { type: 'xhtml' } },
				{ div: [
					{ _attr: { xmlns: 'http://www.w3.org/1999/xhtml' } },
					{ p: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mattis sit amet vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed, adipiscing id dolor. Pellentesque auctor nisi id magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt feugiat nisl imperdiet. Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In rutrum accumsan ultricies. Mauris vitae nisi at sem facilisis semper ac in est.' }
				] }
			] }
		];
	}
	feed.item(item);

	feed.item({
		title: 'Nyan Cat',
		description: 'LOL',
		url: baseUrl+'/'+channel+'/#nyan-cat',
		date: '05 October 2011 14:48 UTC',
		enclosure: {
			url: 'https://upload.wikimedia.org/wikipedia/en/2/2a/Nyan_cat.ogg',
			size: '220514438',
			type: 'audio/ogg'
		}
	});

	feed.item({
		title: 'Temple',
		description: 'A random Mediawiki picture',
		url: baseUrl+'/'+channel+'/#temple',
		date: '05 October 2011 14:48 UTC',
		enclosure: {
			url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Fifty_Five_Window_Palace_np_GP_%2810%29.JPG/1024px-Fifty_Five_Window_Palace_np_GP_%2810%29.JPG',
			size: '220514438',
			type: 'image/jpg'
		}
	});

	feed.item({
		title: 'Torrent file',
		description: 'Wow',
		url: baseUrl+'/'+channel+'/#torrent-file',
		date: '05 October 2011 14:48 UTC',
		enclosure: {
			//url: 'magnet:?xt=urn:btih:4A5942DD1BB1DF3D2491B18FF48F627415E1947C&dn=the+interview+2014+720p+brrip+x264+yify&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce',
			url: 'http://torcache.net/torrent/4A5942DD1BB1DF3D2491B18FF48F627415E1947C.torrent?title=%5Bkickass.so%5Dthe.interview.2014.720p.brrip.x264.yify',
			size: '123456',
			type: 'application/x-bittorrent' // For .torrent files
		}
	});

	return feed;
}

router.use('/app/', express.static(__dirname+'/public'));

router.get('/', function (req, res) {
	var feed = indexFeed(ATOM);
	res.render('index', { feed: feed });
});
router.get('/rss.xml', function (req, res) {
	var xml = indexFeed(RSS).xml(true);
	res.type('application/rss+xml').send(xml);
});
router.get('/atom.xml', function (req, res) {
	var xml = indexFeed(ATOM).xml(true);
	res.type('application/atom+xml').send(xml);
});

router.get('/:channel/', function (req, res) {
	var channel = req.params.channel;

	var feed = channelFeed(ATOM, channel);
	res.render('channel', { feed: feed });
});
router.get('/:channel/rss.xml', function (req, res) {
	var channel = req.params.channel;

	var xml = channelFeed(RSS, channel).xml(true);
	res.type('application/rss+xml').send(xml);
});
router.get('/:channel/atom.xml', function (req, res) {
	var channel = req.params.channel;

	var xml = channelFeed(ATOM, channel).xml(true);
	res.type('application/atom+xml').send(xml);
});

var server = app.listen(port, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Server listening at http://%s:%s', host, port);
});