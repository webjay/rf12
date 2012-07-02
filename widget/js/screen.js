(function(){

	'use strict';

	var eventid = 0; /* Must be set */
	var tags; /* tag msg */
	var limit = 5; /* How many items to get */
	var delay = 2000; /* How often we fetch in milliseconds */
	var nodes_max = 50; /* maximum number of nodes in DOM */
	var /* the freshest reult we have */
		sinceTimePhoto = 0,
		sinceTimeText = 0;
	var calling = false; /* makes sure only one getJSON runs at a time */
	var /* where to put content */
		container_photos,
		container_text;
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
			$.each(data.text, function (k, node) {
				if (sinceTimeText < node.saved_on) {
					sinceTimeText = node.saved_on;
				}
				node.orange = (node.username === 'orangefeeling') ? 'orangefeeling' : '';
				node.text = node.text.replace(re_links, '');
				container_text.prepend(templates.screen_post.render(node)).masonry('reload');
			});
			/*
			$.each(data.photos, function (k, node) {
				if (node.thumb_photo === null) {
					return callback();
				}
				if (sinceTimePhoto < node.saved_on) {
					sinceTimePhoto = node.saved_on;
				}
				// preload then insert
				$(new Image()).attr('src', node.thumb_photo).load(function(){
					container_photos.prepend(templates.screen_image.render(node)).masonry('reload');
				});
			});
			*/
			// remove > nodes_max from Masonry instance and the DOM.
			//container_text.masonry('remove', $('#nodes .box:gt(' + (nodes_max - 1) + ')'));
			//container_photos.masonry('remove', $('#nodes .box:gt(' + (nodes_max - 1) + ')'));
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
		// tag msg
		tags = urlParams.tagstr;
		if (tags) {
			var t = tags.split(',');
			$('#tagmsg').append('#' + t.join(' #'));
		} else {
			$('#tagmsg').hide();
		}
		// limit?
		if (parseInt(urlParams.limit, 10) > 0) {
			limit = parseInt(urlParams.limit, 10);
		}
		// init 
		container_photos = $('#photos');
		container_text = $('#text');
		// Masonry options
		container_text.masonry({
			itemSelector: '.box',
			isAnimated: true,
			columnWidth: function (containerWidth) {
				return containerWidth;
			}
		});
		container_photos.masonry({
			itemSelector: '.box',
			isAnimated: true,
			columnWidth: function (containerWidth) {
				return containerWidth / 3;
			}
		});
		// set height
		$(document).resize(function(){
			var height = $(document).height() - ($('header').height() + $('footer').height());
			$('#nodes').height(height);
		});
		$(document).resize();
		// get data now
		fetch(eventid);
		// get data every {delay} millisecond
		window.setInterval(fetch, delay, eventid);
	});

})();
