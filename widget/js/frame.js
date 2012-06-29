var Gignal_more; /* Global function to load more data */

(function(){
	
	'use strict';
	
	var eventid = 7; /* Must be set */
	var limit = 10; /* How many items to get */
	var delay = 5000; /* How often we fetch in milliseconds */
	var nodes_max = 1000; /* maximum number of nodes in DOM */
	var /* the freshest reult we have */
		sinceTimePhoto = 0,
		sinceTimeText = 0;
	var start_time = Math.round((new Date()).getTime() / 1000);
	var more_fetch_num = 0; /* how many times we fetched older data */
	var calling = false; /* makes sure only one getJSON runs at a time */
	var container; /* where to put content */
	var api_url = 'http://api.gignal.com/event/api/eventId/';
	var date_re = /(\d+)/g;
	var re_links = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
	var json_get; /* XDomainRequest vs jQuery.getJSON */
	var xdr; /* XDomainRequest */
	
	function parseDate (datestr) {
		var parts = datestr.match(date_re);
		return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
	}
	
	function sortByDate (a, b) {
		//return parseDate(a.created_on).getTime() - parseDate(b.created_on).getTime();
		return parseDate(a.saved_on).getTime() - parseDate(b.saved_on).getTime();
	}
	
	function push (box, prepend) {
		if (prepend) {
			container.prepend(box).masonry('reload');
		} else {
			container.append(box).masonry('reload');
		}
	}
	
	function msxdr (url, na, callback) {
		xdr = new XDomainRequest();
		xdr.open('get', url);
		xdr.timeout = 20000;
		xdr.onerror = function(){
			calling = false;
		};
		xdr.ontimeout = function(){
			calling = false;
		};
		xdr.onload = function(){
			callback($.parseJSON(xdr.responseText));
		};
		xdr.send();
	}
	
	function fetch (prepend) {
		if (calling) {
			return;
		}
		calling = true;
		var url = api_url + eventid;
		if (prepend) {
			var options = {
				limit: limit,
				sinceTimePhoto: sinceTimePhoto,
				sinceTimeText: sinceTimeText
			};
		} else {
			more_fetch_num++;
			var offset = more_fetch_num * limit;
			var options = {
				limit: limit,
				sinceTimePhoto: start_time,
				sinceTimeText: start_time,
				offset: offset
			};
		}
		try {
			var jqxhr = json_get(url, options, function (data) {
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
							if (sinceTimePhoto < parseDate(node.saved_on).getTime()) {
								sinceTimePhoto = parseDate(node.saved_on).getTime();
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
							if (sinceTimeText < parseDate(node.saved_on).getTime()) {
								sinceTimeText = parseDate(node.saved_on).getTime();
							}
							node.type = 'text';
							node.text = node.text.replace(re_links, '<a href="$1" target="_top">link</a>');
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
								push(templates.frame_image.render(node), prepend);
								break;
							case 'text':
								push(templates.frame_post.render(node), prepend);
								break;
						}
					}
					// remove > nodes_max from Masonry instance and the DOM.
					container.masonry('remove', $('#nodes .gig-outerbox:gt(' + (nodes_max - 1) + ')'));
				});
			});
			jqxhr.error(function(e){
				calling = false;
			});
		} catch (e) {
			calling = false;
		}
	}
	
	/* set global function */
	Gignal_more = function () {
		var bottom = $('#nodes').height();
		$('html, body').animate({ scrollTop: bottom }, 2000);
		fetch(false);
	}
	
	/* OnLoad */
	jQuery(document).ready(function($){
		// be nice to IE
		json_get = (jQuery.browser.msie && window.XDomainRequest) ? msxdr : jQuery.getJSON;
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
		fetch(true);
		// get data every {delay} millisecond
		window.setInterval(function(){ fetch(true); }, delay);
	});

})();
