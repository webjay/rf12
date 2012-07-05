(function(){

	'use strict';

	var eventid = 0; /* Must be set */
	var tags; /* tag msg */
	var limit = 18; /* How many items to get */
	var delay = 2000; /* How often we fetch in milliseconds */
	var nodes_max = limit; /* maximum number of nodes in DOM */
	var /* the freshest reult we have */
		sinceTimePhoto = 0,
		sinceTimeText = 0;
	var api_url = 'http://api.gignal.com/event/api/eventId/';
	var calling = false; /* makes sure only one getJSON runs at a time */
	var /* where to put content */
		container_photos,
		container_text;
	var shufflesizer;
	var isotope_options = {
		layoutMode: 'masonry',
		resizesContainer: false,
		itemSelector: '.box-img',
		columnWidth: 80,
		sortBy: 'original-order'
	}
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
	
	function fetch () {
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
			var append = (sinceTimePhoto > 0) ? false : true;
			// text
			$.each(data.text, function (k, node) {
				if (sinceTimeText < node.saved_on) {
					sinceTimeText = node.saved_on;
				}
				node.orange = (node.username === 'orangefeeling') ? 'orangefeeling' : '';
				node.text = node.text.replace(re_links, '');
				var box = templates.screen_post.render(node);
				if (append) {
					$(box).hide().appendTo(container_text).slideDown();
				} else {
					$(box).hide().prependTo(container_text).slideDown();
				}
			});
			// remove > nodes_max from the DOM.
			container_text.find('.box:gt(' + (nodes_max - 1) + ')').remove();
			// photos
			if (data.photos.length === 0) {
				return;
			}
			window.clearInterval(shufflesizer);
			$.each(data.photos, function (k, node) {
				if (sinceTimePhoto < node.saved_on) {
					sinceTimePhoto = node.saved_on;
				}
				// preload then insert
				var img = new Image();
				img.src = node.thumb_photo;
				$(img).on('load', function(){
					var boxes = templates.screen_image.render(node);
					if (append) {
						container_photos.append(boxes).isotope('reloadItems').isotope(isotope_options);
					} else {
						container_photos.prepend(boxes).isotope('reloadItems').isotope(isotope_options);
					}
				});
			});
			//phocus();
			// remove > nodes_max from Isotope instance and the DOM.
			container_photos.isotope('remove', $('#nodes .box-img').slice(nodes_max - 1));
			// shufflesize
			shufflesizer = window.setInterval(phocus, 8000);
		});
		jqxhr.error(function(){
			calling = false;
		});
	}

	function phocus () {
		var n = Math.floor(Math.random() * container_photos.find('.box-img').length);
		var img = container_photos.find('.box-img').eq(n).find('img').attr('src');
		if (img) {
			$('#phocus').css('background-image', 'url(' + img + ')');
		}
		//container_photos.isotope('reLayout');
		container_photos.isotope('shuffle');
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
		container_photos = $('#isotope1');
		container_text = $('#text');
		/* Isotope options */
		container_photos.isotope(isotope_options);
		// set height
		$(document).resize(function(){
			var height = $(document).height() - ($('header').height() + $('footer').height());
			$('#nodes').height(height);
			//$('#photos, #photoshow').width($(document).width() + 80);
			$('#photoshow').width($(document).width() - 120);
		});
		$(document).resize();
		// ajaxSetup
		jQuery.ajaxSetup({
			cache: false,
			timeout: 5000
		});
		// get data now
		fetch();
		// get data every {delay} millisecond
		window.setInterval(fetch, delay);
	});

})();
