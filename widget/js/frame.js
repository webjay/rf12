'use strict';

var eventid = 7; /* Must be set */
var limit = 10; /* Can be set with url parameter */
var delay = 2000; /* How often we fetch in milliseconds */
var nodes_max = 1000; /* maximum number of nodes */
var since_time = 0; /* last time we got some */
var start_time = Math.round((new Date()).getTime() / 1000);
var calling = false; /* makes sure only one getJSON runs at a time */
var container = null;
var api_url = 'http://api.gignal.com/event/api/eventId/';
var date_re = /(\d+)/g;
var more_fetch_num = 0;
var json_get = null;

function parseDate (datestr) {
	var parts = datestr.match(date_re);
	return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
}

function sortByDate (a, b) {
	return parseDate(a.created_on).getTime() - parseDate(b.created_on).getTime();
}

function push (box, prepend) {
	if (prepend) {
		container.prepend(box).masonry('reload');
	} else {
		container.append(box).masonry('reload');
	}
}

function msxdr (url, na, callback) {
	if (calling) {
		return;
	}
	calling = true;
	var xdr = new XDomainRequest();
	xdr.open('get', url);
	xdr.timeout = 10000;
	xdr.onerror = function(){
		calling = false;
	};
	xdr.ontimeout = function(){
		calling = false;
	};
	xdr.onload = function(){
		calling = false;
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
			sinceId: since_time
		};
	} else {
		more_fetch_num++;
		var offset = more_fetch_num * limit;
		var options = {
			limit: limit,
			sinceId: start_time,
			offset: offset
		};
	}
	try {
		var jqxhr = json_get(url, options, function (data) {
			calling = false;
			if (data.text.length === 0 && data.photos.length === 0) {
				return;
			}
			since_time = Math.round((new Date()).getTime() / 1000);
			var nodes = [];
			async.parallel([
				function (callback) { // photos
					async.forEach(data.photos, function (node, callback) {
						if (node.thumb_photo === null) {
							return callback();
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
						node.type = 'text';
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

function Gignal_more () {
	var bottom = $('#nodes').height();
	$('html, body').animate({ scrollTop: bottom }, 2000);
	fetch(false);
}

/* OnLoad */
$(function(){
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
