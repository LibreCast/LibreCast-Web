var url = require('url');
var path = require('path');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var RSS = require('rss');
var ATOM = require('./lib/atom');
var Waterline = require('waterline');
var torrentStream = require('torrent-stream');
var rangeParser = require('range-parser');
var config = require('./config');

// ORM

// Instantiate a new instance of the ORM
var orm = new Waterline();

var diskAdapter = require('sails-disk');
var memoryAdapter = require('sails-memory');

var ormConfig = {
	// Setup Adapters
	// Creates named adapters that have have been required
	adapters: {
		'default': memoryAdapter,
		disk: diskAdapter,
		memory: memoryAdapter
	},
	// Build Connections Config
	// Setup connections using the named adapter configs
	connections: {
		disk: {
			adapter: 'disk'
		},
		memory: {
			adapter: 'memory'
		}
	},
	defaults: {
		migrate: 'alter'
	}
};

var Feed = Waterline.Collection.extend({
	identity: 'feed',
	connection: 'memory',
	attributes: {
		slug: {
			type: 'string',
			index: true,
			unique: true
		},
		title: 'string',
		summary: 'string',
		rss_url: 'string',
		atom_url: 'string',
		image: 'string',
		author: 'string',
		rights: 'string',
		language: 'string',
		categories: 'array',
		items: {
			collection: 'feeditem',
			via: 'feed'
		}
	}
});

var FeedItem = Waterline.Collection.extend({
	identity: 'feeditem',
	connection: 'memory',
	attributes: {
		slug: {
			type: 'string',
			index: true,
			unique: true
		},
		title: 'string',
		subtitle: 'string',
		summary: 'string',
		content: 'string',
		url: 'string',
		image: 'string',
		authors: 'array',
		contributors: 'array',
		rights: 'string',
		language: 'string',
		categories: 'array',
		feed: {
			model: 'feed'
		},
		enclosures: {
			collection: 'feedenclosure',
			via: 'item'
		}
	}
});

var FeedEnclosure = Waterline.Collection.extend({
	identity: 'feedenclosure',
	connection: 'memory',
	attributes: {
		url: 'string',
		type: 'string',
		size: 'int',
		item: {
			model: 'feeditem'
		}
	}
});

orm.loadCollection(Feed);
orm.loadCollection(FeedItem);
orm.loadCollection(FeedEnclosure);

// App
var port = process.env.PORT || config.port || 9090;
var baseUrl = config.base || '';

var app = express();

app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

var router = app;
if (baseUrl) {
	router = express.Router();
	app.use(url.parse(baseUrl).pathname, router);
}

function renderFeedsFeed(feeds, Xml) {
	var filename = (Xml === ATOM) ? 'atom' : 'rss';

	var feed = new Xml({
		title: 'LibreCast',
		feed_url: baseUrl+'/'+filename+'.xml',
		site_url: baseUrl,
		generator: 'LibreCast'
	});

	feeds.forEach(function (f) {
		var item = {
			title: f.title,
			description: f.summary,
			url: baseUrl+'/'+f.slug+'/',
			date: f.createdAt
		};
		if (Xml === ATOM) {
			item.custom_elements = [];

			if (!f.rss_url && !f.atom_url) {
				f.rss_url = f.rss_url || baseUrl+'/'+f.slug+'/rss.xml';
				f.atom_url = f.atom_url || baseUrl+'/'+f.slug+'/atom.xml';
			}

			if (f.rss_url) {
				item.custom_elements.push({ link: { _attr: { type: 'application/rss+xml', rel: 'alternate', href: f.rss_url } } });
			}
			if (f.atom_url) {
				item.custom_elements.push({ link: { _attr: { type: 'application/atom+xml', rel: 'alternate', href: f.atom_url } } });
			}
		}
		feed.item(item);
	});

	return feed;
}

function renderItemsFeed(model, items, Xml) {
	var filename = (Xml === ATOM) ? 'atom' : 'rss';

	var feed = new Xml({
		title: model.title,
		feed_url: baseUrl+'/'+model.slug+'/'+filename+'.xml',
		site_url: baseUrl+'/'+model.slug+'/',
		author: model.author,
		generator: 'LibreCast'
	});

	items.forEach(function (it) {
		var item = {
			title: it.title,
			description: it.summary,
			url: baseUrl+'/'+it.slug+'/',
			date: it.createdAt
		};

		if (it.enclosures) {
			var enc = it.enclosures[0];

			item.enclosure = {
				url: enc.url,
				size: enc.size,
				type: enc.type
			};
		}
		if (Xml === ATOM && it.content) {
			item.custom_elements = [
				{ content: [
					{ _attr: { type: 'xhtml' } },
					{ div: [
						{ _attr: { xmlns: 'http://www.w3.org/1999/xhtml' } },
						{ p: it.content }
					] }
				] }
			];
		}
		feed.item(item);
	});

	return feed;
}

function sendFeed(res, feed) {
	var feedType = (feed.constructor === ATOM) ? 'atom' : 'rss';
	var xml = feed.xml(true);

	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.type('application/'+feedType+'+xml').send(xml);
}

function populateDb(app) {
	app.models.feed.create({
		slug: 'librecast',
		title: 'LibreCast channel',
		summary: 'A simple test channel',
		author: 'LibreCast'
	}).exec(function (err, feed) {
		if (err) throw err;

		app.models.feeditem.create({
			slug: 'big-buck-bunny-trailer',
			title: 'Big Buck Bunny trailer',
			summary: 'A very fun movie',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mattis sit amet vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed, adipiscing id dolor. Pellentesque auctor nisi id magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt feugiat nisl imperdiet. Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In rutrum accumsan ultricies. Mauris vitae nisi at sem facilisis semper ac in est.',
			feed: feed.id
		}).exec(function (err, item) {
			if (err) throw err;

			app.models.feedenclosure.create({
				url: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Big_Buck_Bunny_Trailer_400p.ogg',
				type: 'video/ogg',
				item: item.id
			}).exec(function (err, enclosure) {
				if (err) throw err;
			});
		});

		app.models.feeditem.create({
			slug: 'nyan-cat',
			title: 'Nyan Cat',
			summary: 'LOL',
			feed: feed.id
		}).exec(function (err, item) {
			if (err) throw err;

			app.models.feedenclosure.create({
				url: 'https://upload.wikimedia.org/wikipedia/en/2/2a/Nyan_cat.ogg',
				type: 'audio/ogg',
				item: item.id
			}).exec(function (err, enclosure) {
				if (err) throw err;
			});
		});

		app.models.feeditem.create({
			slug: 'temple',
			title: 'Temple',
			summary: 'A random Mediawiki picture',
			feed: feed.id
		}).exec(function (err, item) {
			if (err) throw err;

			app.models.feedenclosure.create({
				url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Fifty_Five_Window_Palace_np_GP_%2810%29.JPG/1024px-Fifty_Five_Window_Palace_np_GP_%2810%29.JPG',
				type: 'image/jpeg',
				item: item.id
			}).exec(function (err, enclosure) {
				if (err) throw err;
			});
		});

		app.models.feeditem.create({
			slug: 'northmen',
			title: 'Northmen - A Viking Saga',
			summary: 'Wow, magnets!',
			feed: feed.id
		}).exec(function (err, item) {
			if (err) throw err;

			app.models.feedenclosure.create({
				url: 'magnet:?xt=urn:btih:DFB468C367210DEFF555CF6F1AFB9A6C473EBDB2&dn=northmen+a+viking+saga+2014+720p+brrip+x264+yify&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce',
				//url: 'http://torcache.net/torrent/DFB468C367210DEFF555CF6F1AFB9A6C473EBDB2.torrent',
				type: 'application/x-bittorrent',
				item: item.id
			}).exec(function (err, enclosure) {
				if (err) throw err;
			});
		});
	});

	app.models.feed.create({
		slug: 'tibounise',
		title: 'Tibounise',
		summary: 'Tibounise blog feed',
		author: 'Tibounise',
		atom_url: 'http://tibounise.fr/feed.atom'
	}).exec(function (err, feed) {
		if (err) throw err;
	});

	app.models.feed.create({
		slug: 'l-ecole-de-la-vie',
		title: 'L\'école de la vie',
		summary: 'Une émission France Inter',
		author: 'France Inter',
		rss_url: 'http://radiofrance-podcast.net/podcast09/rss_14085.xml'
	}).exec(function (err, feed) {
		if (err) throw err;
	});

	app.models.feed.create({
		slug: 'thepianoguys',
		title: 'ThePianoGuys',
		summary: 'Une chaine Youtube',
		author: 'ThePianoGuys',
		rss_url: 'http://gdata.youtube.com/feeds/base/videos?orderby=published&author=ThePianoGuys'
	}).exec(function (err, feed) {
		if (err) throw err;
	});
}

function setupApi(app) {
	var router = express.Router();
	router.use(bodyParser.json());

	router.get('/', function (req, res) {
		res.json({
			feeds_url: baseUrl+'/api/feeds'
		});
	});

	router.get('/feeds', function (req, res) {
		app.models.feed.find().exec(function (err, models) {
			if (err) return res.json(err, err.status);

			models.forEach(function (model) {
				model.url = baseUrl+'/api/feeds/'+model.slug;
			});

			res.json(models);
		});
	});

	router.post('/feeds', function (req, res) {
		app.models.feed.create(req.body, function (err, model) {
			if (err) return res.json(err, err.status);
			res.json(model);
		});
	});

	router.get('/feeds/:slug', function (req, res) {
		app.models.feed.findOne({ slug: req.params.slug }, function (err, feed) {
			if (err) return res.json(err, err.status);
			app.models.feeditem.find({ feed: feed.id }).populate('enclosures').exec(function (err, models) {
				if (err) return res.json(err, err.status);
				res.json(models);
			});
		});
	});

	app.use('/api', router);
}

function setupApp(app) {
	var router = express.Router();

	router.use('/', express.static(__dirname+'/public'));

	router.use('/feed', function (req, res) {
		var url = req.query.url;
		if (!url) {
			return res.status(400).json({ message: 'Missing url parameter' });
		}

		http.get(url, function (httpRes) {
			var acceptedTypes = ['application/rss+xml', 'application/atom+xml', 'text/xml'];

			var resType = String(httpRes.headers['content-type']).split(';')[0];
			if (acceptedTypes.indexOf(resType) < 0) {
				return res.status(500).json({ message: 'Not an Atom feed' });
			}

			res.status(httpRes.statusCode);
			var headers = ['content-type', 'content-length'];
			headers.forEach(function (header) {
				if (!httpRes.headers[header]) {
					return;
				}
				res.set(header, httpRes.headers[header]);
			});
			httpRes.pipe(res);
		}).on('error', function (err) {
			return res.status(500).json(err);
		});
	});

	var torrents = {};

	router.use('/media', function (req, res) {
		var url = req.query.url;
		if (!url) {
			return res.status(400).json({ message: 'Missing url parameter' });
		}

		var serveTorrent = function (engine) {
			var found = false;
			for (var i = 0; i < engine.files.length; i++) {
				var file = engine.files[i];
				if (path.extname(file.name) == '.mp4') {
					found = true;
					break;
				}
			}
			if (!found) {
				return res.status(404).send('No .mp4 file found in torrent');
			}

			var range = req.headers.range;
			range = range && rangeParser(file.length, range)[0];
			res.setHeader('Accept-Ranges', 'bytes');
			res.type(file.name);
			req.connection.setTimeout(3600000);

			if (!range) {
				res.setHeader('Content-Length', file.length);
				if (req.method === 'HEAD') {
					return res.end();
				}
				return file.createReadStream().pipe(res);
			}

			res.status(206);
			res.setHeader('Content-Length', range.end - range.start + 1);
			res.setHeader('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + file.length);

			if (req.method === 'HEAD') {
				return res.end();
			}
			file.createReadStream(range).pipe(res);
		};

		if (torrents[url]) {
			return serveTorrent(torrents[url]);
		}

		var engine;
		try {
			engine = torrentStream(url);
		} catch (e) {
			console.log(url, e);
			return res.status(400).json({ message: e });
		}

		engine.once('verifying', function () {
			console.log('verifying ' + engine.infoHash);
			engine.files.forEach(function (file, i) {
				console.log(i + ' ' + file.name);
			});
		});
		engine.on('ready', function () {
			console.log('ready ' + engine.infoHash);
			engine.files.forEach(function (file) {
				console.log('file:', file);
			});

			serveTorrent(engine);
		});
		engine.on('error', function (e) {
			console.log('error ' + engine.infoHash + ': ' + e);
			res.status(500).send(e);
		});
		engine.once('destroyed', function () {
			console.log('destroyed ' + engine.infoHash);
			engine.removeAllListeners();
		});

		torrents[url] = engine;
	});

	app.use('/app', router);
}

function setupFeeds(app) {
	app.get('/rss.xml', function (req, res) {
		app.models.feed.find().exec(function (err, models) {
			if (err) return res.json(err, err.status);
			var feed = renderFeedsFeed(models, RSS);
			sendFeed(res, feed);
		});
	});
	app.get('/atom.xml', function (req, res) {
		app.models.feed.find().exec(function (err, models) {
			if (err) return res.json(err, err.status);
			var feed = renderFeedsFeed(models, ATOM);
			sendFeed(res, feed);
		});
	});

	app.get('/:channel/rss.xml', function (req, res) {
		app.models.feed.findOne({ slug: req.params.channel }, function (err, model) {
			if (err) return res.json(err, err.status);
			app.models.feeditem.find({ feed: model.id }).populate('enclosures').exec(function (err, models) {
				if (err) return res.json(err, err.status);
				var feed = renderItemsFeed(model, models, RSS);
				sendFeed(res, feed);
			});
		});
	});
	app.get('/:channel/atom.xml', function (req, res) {
		app.models.feed.findOne({ slug: req.params.channel }, function (err, model) {
			if (err) return res.json(err, err.status);
			app.models.feeditem.find({ feed: model.id }).populate('enclosures').exec(function (err, models) {
				if (err) return res.json(err, err.status);
				var feed = renderItemsFeed(model, models, ATOM);
				sendFeed(res, feed);
			});
		});
	});
}

function setupSite(app) {
	var router = express.Router();

	router.get('/', function (req, res) {
		app.models.feed.find().exec(function (err, models) {
			if (err) return res.json(err, err.status);

			res.render('index', { feeds: models });
		});
	});

	router.get('/:channel/', function (req, res) {
		app.models.feed.findOne({ slug: req.params.channel }, function (err, model) {
			if (err) return res.json(err, err.status);
			if (!model) return res.status(404).send('Channel not found');
			app.models.feeditem.find({ feed: model.id }).populate('enclosures').exec(function (err, models) {
				if (err) return res.json(err, err.status);
				res.render('channel', { feed: model, items: models });
			});
		});
	});

	app.use('/', router);
}

orm.initialize(ormConfig, function (err, models) {
	if (err) throw err;

	(function (app) {
		app.models = models.collections;
		app.connections = models.connections;

		setupApi(app);
		setupApp(app);
		setupFeeds(app);
		setupSite(app);

		populateDb(app);
	})(router);

	var server = app.listen(port, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Server listening at http://%s:%s', host, port);
	});
});