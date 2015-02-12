$(function () {

var localFeedStorage = new FeedStorage();

var serverUrl = '..';

var $mainContainer = $('#main-container');
var $channels = $('#channels-list');
var $channelsList = $channels.find('.list-group');
var $media = $('#media-list');
var $mediaList = $media.find('.list-group');
var $player = $('#medium-player');
var $imagePlayer = $player.find('.player-image img');
var $audioPlayer = $player.find('.player-audio audio');
var $videoPlayer = $player.find('.player-video video');
var $youtubePlayer = $player.find('.player-youtube iframe');
var $fallbackPlayer = $player.find('.player-fallback');
var $playerMetadata = $player.find('.player-metadata');

function loadFeed(url, done) {
	// Proxy requests if needed
	var parser = document.createElement('a');
	parser.href = url;
	if (parser.origin != window.location.origin) {
		url = 'feed?url='+encodeURIComponent(url);
	}

	var req = new XMLHttpRequest();

	req.addEventListener('load', function () {
		if (String(this.status)[0] != '2') { // Not 2xx
			done('HTTP error: '+this.status);
			return;
		}

		var xml = this.responseText;
		var parser = new DOMParser();
		var dom = parser.parseFromString(xml, 'application/xml');

		var feedType = req.getResponseHeader('Content-Type').split(';')[0];
		var feed;
		if (feedType == 'text/xml' || feedType == 'application/xml') {
			var tagName = dom.firstChild.nodeName.toLowerCase();
			if (tagName == 'rss') {
				feedType = 'application/rss+xml';
			}
			if (tagName == 'feed') {
				feedType = 'application/atom+xml';
			}
		}
		if (feedType == 'application/rss+xml') {
			feed = new RssFeed();
		}
		if (feedType == 'application/atom+xml') {
			feed = new AtomFeed();
		}
		if (!feed) {
			return done('Unknown feed type: '+feedType);
		}
		feed.parse(dom);
		done(null, feed);
	});

	req.addEventListener('error', function () {
		done('HTTP request error');
	});

	req.open('GET', url, true);
	req.send();
}

function renderChannelEntry(entry) {
	var $item = $('<a></a>', {
		href: entry.url,
		'class': 'list-group-item'
	});
	if (entry.published) {
		$item.append($('<span></span>', { 'class': 'pull-right text-muted' }).text(entry.published.toLocaleString()));
	}
	$item.append($('<h4></h4>', { 'class': 'list-group-item-heading' }).text(entry.title));
	$item.append($('<p></p>', { 'class': 'list-group-item-text' }).text(entry.summary));

	$item.click(function (event) {
		event.preventDefault();

		//$(this).parent().children('.active').removeClass('active');
		//$(this).addClass('active');
		showChannel(entry.atom_url || entry.rss_url);
	});

	return $item;
}

function getEnclosureType(enclosure) {
	if (!enclosure || !enclosure.type) {
		return false;
	}

	if (enclosure.type.indexOf('image/') === 0) {
		return 'image';
	}
	if (enclosure.type.indexOf('audio/') === 0) {
		return 'audio';
	}
	if (enclosure.type.indexOf('video/') === 0) {
		return 'video';
	}
	if (enclosure.type == 'application/x-bittorrent') {
		return 'torrent';
	}
	if (enclosure.type == 'text/html') {
		var parser = document.createElement('a');
		parser.href = enclosure.url;
		if (parser.hostname == 'www.youtube.com' && parser.pathname == '/watch') {
			return 'youtube';
		}
	}

	return false;
}
function isEnclosureSupported(enclosure) {
	return (getEnclosureType(enclosure) !== false);
}
function openEnclosure(enclosure) {
	var type = getEnclosureType(enclosure);
	$player.children('div:not(.player-metadata)').hide();
	if ($player.find('.player-'+type).length) {
		$player.find('.player-'+type).show();
	} else {
		$player.find('.player-fallback').show();
	}
	$player.show();

	$player.find('.download-link').attr('href', enclosure.url);

	switch (getEnclosureType(enclosure)) {
		case 'image':
			$imagePlayer.attr('src', enclosure.url);
		case 'audio':
			$audioPlayer.attr('src', enclosure.url);
			break;
		case 'video':
			$videoPlayer.attr('src', enclosure.url);
			break;
		case 'youtube':
			var parser = document.createElement('a');
			parser.href = enclosure.url;
			var videoId = parser.searchParams.get('v');
			if (videoId) {
				$youtubePlayer.attr('src', '//www.youtube.com/embed/'+videoId);
			}
			break;
		default:
			$fallbackPlayer.find('a').attr('href', enclosure.url);
			return;
	}
}
function openMedium(entry) {
	var enclosure = getMediumEnclosure(entry);

	switchPage('medium-player');

	$player.find('h1 .inner').text(entry.title);
	if (entry.summary) {
		$player.find('h1 .inner').append('<br>').append($('<small></small>').text(entry.summary));
	}

	$playerMetadata.find('.player-description').html(entry.content || '');

	openEnclosure(enclosure);
}

function getMediumEnclosure(entry) {
	if (!entry.enclosures) {
		return;
	}

	for (var i = 0; i < entry.enclosures.length; i++) {
		var enc = entry.enclosures[i];
		if (isEnclosureSupported(enc)) {
			return enc;
		}
	}
}
function renderMediumEntry(entry) {
	var enclosure = getMediumEnclosure(entry);

	if (!enclosure && entry.url && entry.url.indexOf('http://www.youtube.com/watch') === 0) {
		enclosure = {
			url: entry.url,
			type: 'text/html'
		};
		entry.enclosures = [enclosure];
	}

	var icons = {
		image: 'picture-o',
		audio: 'music',
		video: 'film',
		youtube: 'youtube-play',
		torrent: ''
	};
	var icon = icons[getEnclosureType(enclosure)];

	var $item = $('<a></a>', {
		href: entry.url,
		target: '_blank',
		'class': 'list-group-item'
	});

	if (entry.published) {
		$item.append($('<span></span>', { 'class': 'pull-right text-muted' }).text(entry.published.toLocaleString()));
	}
	if (entry.image) {
		$item.append($('<img>', { 'class': 'pull-left' }).attr('src', entry.image));
	}
	
	$item.append($('<h4></h4>', { 'class': 'list-group-item-heading' }).text(entry.title));
	$item.append($('<p></p>', { 'class': 'list-group-item-text' }).text(entry.summary).prepend((icon) ? '<i class="fa fa-'+icon+'"></i>&nbsp;' : ''));

	$item.click(function (event) {
		if (enclosure) {
			event.preventDefault();

			//$(this).parent().children('.active').removeClass('active');
			//$(this).addClass('active');
			openMedium(entry);
		}
	});

	return $item;
}

function showChannel(feedUrl) {
	$mediaList.empty();

	loadFeed(feedUrl, function (err, feed) {
		if (err) return alert('Could not load channel: ' + err);

		switchPage('media-list');

		if (!feed.atom_url) {
			feed.atom_url = feedUrl;
		}
		$media.find('h1 .inner').text(feed.title);
		$media.find('.atom-link').attr('href', feed.atom_url);

		for (var i = 0; i < feed.items.length; i++) {
			var entry = feed.items[i];

			var $item = renderMediumEntry(entry);
			$mediaList.append($item);
		}
	});
}

function switchPage(newPage) {
	$mainContainer.children().hide();
	$mainContainer.children('#'+newPage).show();
}

// Setup events

$('#add-feed-popover').submit(function (event) {
	event.preventDefault();

	var urlInput = $(this).find('#add-feed-url');
	var url = urlInput.val();

	loadFeed(url, function (err, feed) {
		if (err) return alert('Could not load channel: ' + err);

		var data = {
			url: url,
			title: feed.title
		};

		console.log(data);
		//localFeedStorage.addFeed(data);
	});

	$(this)[0].reset();
	$channels.find('.add-feed-link').popover('hide');
});

$channels.find('.add-feed-link').each(function () {
	var popover = $(this);
	var targetId = $(this).attr('href');
	var target = $(targetId).detach();

	$(this).popover({
		html: true,
		content: function () {
			return target;
		}
	});

	$(this).click(function (event) {
		event.preventDefault();
	});
	$(this).on('shown.bs.popover', function () {
		target.find('[autofocus]').focus();
	});

	target.find('[data-toggle="popover"]').click(function () {
		popover.popover('toggle');
	});
});

$media.find('.back-link').click(function (event) {
	event.preventDefault();
	switchPage('channels-list');
});
$player.find('.back-link').click(function (event) {
	event.preventDefault();
	switchPage('media-list');
});

// Load channels feed

var channelsFeed = serverUrl+'/atom.xml';

$channelsList.empty();

loadFeed(channelsFeed, function (err, feed) {
	if (err) return alert('Could not load channels list: ' + err);

	$channels.find('.atom-link').attr('href', feed.atom_url);

	for (var i = 0; i < feed.items.length; i++) {
		var entry = feed.items[i];

		var $item = renderChannelEntry(entry);
		$channelsList.append($item);
	}
});

});