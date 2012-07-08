(function(){

	'use strict';

	var eventid = 7; /* Event id must be set */
	var limit = 10; /* How many items to get */
	var delay = 5000; /* How often we fetch in milliseconds */
	var nodes_max = 1000; /* maximum number of nodes in DOM */
	var /* the freshest reult we have */
		sinceIdPhoto = 0,
		sinceIdText = 0;
	var /* the oldest reult we have */
		firstIdPhoto = 0,
		firstIdText = 0;
	var cid = 0; /* for caching */
	var more_fetch_num = 0; /* how many times we fetched older data */
	var calling = false; /* makes sure only one getJSON runs at a time */
	var container; /* where to put content */
	var api_url = 'http://api.gignal.com/event/api/eventId/';
	var re_links = /(\b(https?):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;

	// ajax setup
	jQuery.ajaxSetup({
		jsonpCallback: 'callme',
		cache: true,
		timeout: 10000
	});

	function push (box, prepend) {
		if (prepend) {
			container.prepend(box).masonry('reload');
		} else {
			container.append(box).masonry('reload');
		}
	}

	function node_text (node, prepend) {
		if (sinceIdText < node.text_stream_id) {
			sinceIdText = node.text_stream_id;
		}
		if (firstIdText > node.text_stream_id || firstIdText === 0) {
			firstIdText = node.text_stream_id;
		}
		node.orange = (node.username === 'orangefeeling') ? 'orangefeeling' : '';
		node.profilelink = 'http://' + node.service + '.com/';
		node.profilelink += (node.username.length) ? node.username : node.user_id;
		node.text = node.text.replace(re_links, '<a href="$1" target="_top" class="nodelink">link</a>');
		push(templates.frame_post.render(node), prepend);
	}

	function node_photo (node, prepend) {
		if (node.thumb_photo === null) {
			return;
		}
		if (sinceIdPhoto < node.photo_stream_id) {
			sinceIdPhoto = node.photo_stream_id;
		}
		if (firstIdPhoto > node.photo_stream_id || firstIdPhoto === 0) {
			firstIdPhoto = node.photo_stream_id;
		}
		node.profilelink = 'http://' + node.service + '.com/';
		node.profilelink += (node.username.length) ? node.username : node.user_id;
		push(templates.frame_image.render(node), prepend);
	}

	function fetch (prepend) {
		if (calling) {
			return;
		}
		calling = true;
		var url = api_url + eventid + '?callback=?';
		var options = {};
		if (prepend) {
			options = {
				limit: limit,
				sinceIdPhoto: sinceIdPhoto,
				sinceIdText: sinceIdText
			};
		} else {
			more_fetch_num++;
			var offset = more_fetch_num * limit;
			options = {
				limit: (limit / 2),
				sinceIdPhoto: firstIdPhoto,
				sinceIdText: firstIdText,
				offset: offset
			};
		}
		options.cid = cid++;
		try {
			var jqxhr = jQuery.getJSON(url, options, function (data) {
				calling = false;
				if (data.text.length === 0 && data.photos.length === 0) {
					return;
				}
				cid = 0;
				for (var n = 0; n < limit; n++) {
					if (data.text[n]) {
						node_text(data.text[n], prepend);
					}
					if (data.photos[n]) {
						node_photo(data.photos[n], prepend);
					}
				}
				container.imagesLoaded(function(){
					container.masonry({
						itemSelector: '.gig-outerbox'
					});
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
		var bottom = jQuery('#nodes').height();
		jQuery('html, body').animate({ scrollTop: bottom }, 2000);
		fetch(false);
	}

	function modal_img (e) {
		e.preventDefault();
		jQuery(new Image()).attr('src', jQuery(this).attr('href')).modal({
			autoResize: true,
			position: ['3%'],
			minWidth: 400,
			maxWidth: 415,
			maxHeight: 500,
			overlayClose: true
		});
	}

	/* OnLoad */
	jQuery(document).ready(function($){
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
		window.setInterval(fetch, delay, true);
		// load more
		$(document).on('click', '.gig-morebtn', Gignal_more);
		// modal click event
		$(document).on('click', '.modal', modal_img);
	});

})();
