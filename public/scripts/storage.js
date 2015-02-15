(function (global) {
	function Storage(key) {
		this.key = key;
	}

	Storage.prototype.load = function () {
		var json = localStorage.getItem(this.key);
		if (!json) {
			return null;
		}
		return JSON.parse(json);
	};

	Storage.prototype.save = function (data) {
		localStorage.setItem(this.key, JSON.stringify(data));
	};


	function FeedStorage() {
		Storage.call(this, 'feeds');
	}
	FeedStorage.prototype = $.extend({}, Storage.prototype);

	FeedStorage.prototype.listFeeds = function () {
		return this.load() || [];
	};

	FeedStorage.prototype.addFeed = function (feed) {
		var feeds = this.load() || [];
		for (var i = 0; i < feeds.length; i++) {
			var f = feeds[i];
			if (f.url == feed.url) {
				return; // Already present
			}
		}

		feeds.push(feed);
		return this.save(feeds);
	};

	global.FeedStorage = FeedStorage;
})(window);