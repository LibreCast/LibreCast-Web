var uuid = require('uuid');
var XML = require('xml');
var mime = require('mime-types');

function ATOM(options, items) {
	options = options || {};

	this.title          = options.title || 'Untitled ATOM Feed';
	this.description    = options.description || '';
	this.feed_url       = options.feed_url;
	this.id             = options.id;
	this.site_url       = options.site_url;
	this.image_url      = options.image_url;
	this.author         = options.author;
	this.custom_elements = options.custom_elements;
	this.items          = items || [];
}

ATOM.prototype.item = function (options) {
	options = options || {};

	var item = {
		id:             options.id,
		title:          options.title || 'No title',
		description:    options.description || '',
		url:            options.url,
		guid:           options.guid,
		categories:     options.categories || [],
		author:         options.author,
		date:           options.date,
		enclosure:      options.enclosure,
		custom_elements: options.custom_elements
	};

	this.items.push(item);
	return this;
};

ATOM.prototype.xml = function(indent) {
	return '<?xml version="1.0" encoding="UTF-8"?>\n'
		+ XML(generateXML(this), indent);
};

function ifTruePush(bool, array, data) {
	if (bool) {
		array.push(data);
	}
}

function ifTruePushArray(bool, array, dataArray) {
	if(!bool) {
		return;
	}

	dataArray.forEach(function(item) {
		ifTruePush(item, array, item);
	});
}

function generateXML(data) {
	var feed =  [
		{ _attr: {
			'xmlns': 'http://www.w3.org/2005/Atom'
		} },
		{ id: data.id || 'urn:uuid:'+uuid.v4() },
		{ link: { _attr: { type: 'text/html', rel: 'alternate', href: data.site_url } } },
		{ link: { _attr: { type: 'application/atom+xml', rel: 'self', href: data.feed_url } } },
		{ title: data.title },
		{ updated: new Date().toISOString() }
	];

	ifTruePushArray(data.custom_elements, feed, data.custom_elements);

	data.items.forEach(function(item) {
		var entry = [
			{ id: item.id || 'urn:uuid:'+uuid.v4() }
		];

		ifTruePush(item.date, entry, { published: new Date(item.date || null).toISOString() });
		ifTruePush(item.updated, entry, { updated: new Date(item.updated || null).toISOString() });
		ifTruePush(item.url, entry, { link: { _attr: { type: 'text/html', rel: 'alternate', href: item.url } } });
		ifTruePush(item.title, entry, { title: item.title });
		ifTruePush(item.description, entry, { summary: { _cdata: item.description } });
		//ifTruePush(item.author || data.author, entry, { 'dc:creator': { _cdata: item.author || data.author } });

		if (item.enclosure && item.enclosure.url) {
			entry.push({
				link: {
					_attr: {
						rel: 'enclosure',
						href: item.enclosure.url,
						length: item.enclosure.size || 0,
						type: item.enclosure.type || mime.lookup(item.enclosure.url)
					}
				}
			});
		}

		ifTruePushArray(item.custom_elements, entry, item.custom_elements);

		feed.push({ entry: entry });
	});

	return { feed: feed };
}

module.exports = ATOM;
