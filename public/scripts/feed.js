(function (global) {

function parseEntryTag(entry, selector, attr) {
	var tag = entry.querySelector(selector);
	if (!tag) {
		return undefined;
	}
	if (!attr) {
		return tag.textContent;
	} else if (attr == 'innerHTML') {
		return tag.innerHTML;
	} else {
		return tag.getAttribute(attr);
	}
}
function parseDateTag(entry, selector, attr) {
	var val = parseEntryTag(entry, selector, attr);
	if (val) {
		return new Date(val);
	}
}

function Feed() {
	this.type = '';
	this.title = '';
	this.updated = '';
	this.url = '';

	this.items = [];
}

function AtomFeed() {
	Feed.call(this);
}
AtomFeed.prototype.parseEntry = function (entry) {
	var item = {
		id: parseEntryTag(entry, 'id'),
		title: parseEntryTag(entry, 'title'),
		summary: parseEntryTag(entry, 'summary'),
		published: parseDateTag(entry, 'published'),
		url: parseEntryTag(entry, 'link[rel="alternate"][type="text/html"], link:not([rel]):not([type])', 'href'),
		rss_url: parseEntryTag(entry, 'link[rel="alternate"][type="application/rss+xml"]', 'href'),
		atom_url: parseEntryTag(entry, 'link[rel="alternate"][type="application/atom+xml"]', 'href')
	};

	var contentTag = entry.querySelector('content');
	if (contentTag) {
		if (contentTag.firstElementChild) {
			item.content = contentTag.innerHTML;
		} else {
			item.content = contentTag.textContent;
		}
	}

	var enclosures = entry.querySelectorAll('link[rel="enclosure"]');
	if (enclosures.length) {
		item.enclosures = [];
		for (var i = 0; i < enclosures.length; i++) {
			var enc = enclosures[i];
			item.enclosures.push({
				url: enc.getAttribute('href'),
				type: enc.getAttribute('type'),
				size: enc.getAttribute('length')
			});
		}
	}

	return item;
};
AtomFeed.prototype.parseFeed = function (feed) {
	this.id = parseEntryTag(feed, 'id');
	this.title = parseEntryTag(feed, 'title');
	this.updated = parseEntryTag(feed, 'updated');
	this.atom_url = parseEntryTag(feed, 'link[rel="self"]', 'href');

	var entries = feed.querySelectorAll('entry');
	for (var i = 0; i < entries.length; i++) {
		this.items.push(this.parseEntry(entries[i]));
	}
};
AtomFeed.prototype.parse = function (dom) {
	this.parseFeed(dom.firstChild);
};

function RssFeed() {
	Feed.call(this);
}
RssFeed.prototype.parseEntry = function (entry) {
	var item = {
		title: parseEntryTag(entry, 'title'),
		summary: parseEntryTag(entry, 'description'),
		published: parseDateTag(entry, 'pubDate'),
		url: parseEntryTag(entry, 'link'),
		//image: parseEntryTag(entry, 'itunes:image', 'href'),
	};

	var enclosures = entry.querySelectorAll('enclosure');
	if (enclosures.length) {
		item.enclosures = [];
		for (var i = 0; i < enclosures.length; i++) {
			var enc = enclosures[i];
			item.enclosures.push({
				url: enc.getAttribute('url'),
				type: enc.getAttribute('type'),
				size: enc.getAttribute('length')
			});
		}
	}

	return item;
};
RssFeed.prototype.parseFeed = function (feed) {
	this.title = parseEntryTag(feed, 'title');
	this.updated = parseEntryTag(feed, 'lastBuildDate');
	this.url = parseEntryTag(feed, 'link');

	var image = feed.querySelector('image');
	if (image) {
		this.image = image.querySelector('url').textContent;
	}

	var entries = feed.querySelectorAll('item');
	for (var i = 0; i < entries.length; i++) {
		this.items.push(this.parseEntry(entries[i]));
	}
};
RssFeed.prototype.parse = function (dom) {
	this.parseFeed(dom.firstChild);
};

global.AtomFeed = AtomFeed;
global.RssFeed = RssFeed;

})(window);