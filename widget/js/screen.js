(function(){

	'use strict';

	var eventid = 0; /* Must be set */
	var limit = 10; /* How many items to get */
	var delay = 2000; /* How often we fetch in milliseconds */
	var nodes_max = 100; /* maximum number of nodes in DOM */
	var /* the freshest reult we have */
		sinceTimePhoto = 0,
		sinceTimeText = 0;
	var calling = false; /* makes sure only one getJSON runs at a time */
	var container; /* where to put content */
	var api_url = 'http://api.gignal.com/event/api/eventId/';
	var date_re = /(\d+)/g;
	var re_links = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
	
	function getUrlParams () {
		var params = {};
		var re = /[?&]+([^=&]+)=([^&]*)/g;
		window.location.search.replace(re, function (str, key, value) {
			params[key] = value;
		});
		return params;
	}
	
	function sortByDate (a, b) {
		return a.saved_on - b.saved_on;
	}
	
	function push (box) {
		container.prepend(box).masonry('reload');
	}
	
	function fetch (eventid) {
		if (calling) {
			return;
		}
		calling = true;
		var url = api_url + eventid;
		var options = {
			limit: limit,
			sinceTimePhoto: sinceTimePhoto,
			sinceTimeText: sinceTimeText
		};
		var jqxhr = $.getJSON(url, options, function (data) {
			calling = false;
			if (data.text.length === 0 && data.photos.length === 0) {
				return;
			}
			var nodes = [];
			async.parallel([
				function (callback) { // photos
					async.forEach(data.photos, function (node, callback) {
						if (node.thumb_photo === null) {
							return callback();
						}
						if (sinceTimePhoto < node.saved_on) {
							sinceTimePhoto = node.saved_on;
						}
						// preload then insert
						$(new Image()).attr('src', node.thumb_photo).load(function(){
							node.type = 'photo';
							nodes.push(node);
							callback();
						});
					}, function(){
						callback();
					});
				},
				function (callback) { // text
					$.each(data.text, function (key, node) {
						if (sinceTimeText < node.saved_on) {
							sinceTimeText = node.saved_on;
						}
						node.type = 'text';
						node.text = node.text.replace(re_links, '');
						nodes.push(node);
					});
					callback();
				},
			], function () {
				// sort
				nodes.sort(sortByDate);
				// insert
				for (var i = 0; i < nodes.length; i++) {
					var node = nodes[i];
					switch (node.type) {
						case 'photo':
							push(templates.screen_image.render(node));
							break;
						case 'text':
							push(templates.screen_post.render(node));
							break;
					}
				}
				// remove > nodes_max from Masonry instance and the DOM.
				container.masonry('remove', $('#nodes .gig-outerbox:gt(' + (nodes_max - 1) + ')'));
			});
		});
		jqxhr.error(function(){
			calling = false;
		});
	}
	
	/* OnLoad */
	jQuery(document).ready(function($){
		// get eventid
		var urlParams = getUrlParams();
		eventid = parseInt(urlParams.eventid, 10);
		if (!eventid) {
			document.title = 'Error: I need an eventid';
			return;
		}
		// limit?
		if (parseInt(urlParams.limit, 10) > 0) {
			limit = parseInt(urlParams.limit, 10);
		}
		// init 
		container = $('#nodes');
		// Masonry options
		container.masonry({
			itemSelector: '.gig-outerbox',
			isAnimated: true,
			animationOptions: {
				duration: 750,
				easing: 'linear',
				queue: false
			}
		});
		// get data now
		fetch(eventid);
		// get data every {delay} millisecond
		window.setInterval(fetch, delay, eventid);
	});

})();
