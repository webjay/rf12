var eventid = 0; /* Must be set with ?eventid= */
var limit = 10; /* Can be set with url parameter */
var delay = 2500; /* milliseconds */
var since_time = 0; /* last time we got some */
var calling = false; /* make sure only one getJSON runs at a time */
var container = null;
var api_url = 'http://api.gignal.com/event/api/eventId/';

$(window).error(function (msg, url, line) {
	// todo: post to Loggly
});

function getUrlParams () {
	params = {};
	re = /[?&]+([^=&]+)=([^&]*)/g
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
		sinceId: since_time
	};
	var jqxhr = $.getJSON(url, options, function (data) {
		calling = false;
		if (data.text.length === 0 && data.photos.length === 0) {
			return;
		}
		since_time = Math.round((new Date()).getTime() / 1000);
		// insert photos
		$.each(data.photos, function(key, node) {
			if (node.thumb_photo !== null) {
				container.prepend(templates.image.render(node)).masonry('reload');
			}
		});
		// insert text
		$.each(data.text, function(key, node) {
			container.prepend(templates.post.render(node)).masonry('reload');
		});
	});
	jqxhr.error(function(){
		calling = false;
	});
}

/* OnLoad */
$(function(){
	// get eventid
	var urlParams = getUrlParams();
	eventid = parseInt(urlParams.eventid, 10);
	if (!eventid) {
		console.error('I need an eventid');
		return;
	}
	// limit?
	if (parseInt(urlParams.limit, 10) > 0) {
		limit = parseInt(urlParams.limit, 10);
		if (limit > 100) {
			limit = 100;
		}
	}
	// init 
	container = $('#nodes');
	container.imagesLoaded(function(){
		container.masonry({
			itemSelector: '.gig-outerbox',
			isAnimated: true,
			animationOptions: {
				duration: 750,
				easing: 'linear',
				queue: false
			}
		});
	});
	// get data now
	fetch(eventid);
	// get data every {delay} millisecond
	window.setInterval(fetch, delay, eventid);
});
