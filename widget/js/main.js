var eventid = 7;
var limit = 10;
var since_time = 0;
var delay = 5000; /* milliseconds */
var calling = false; /* make sure only one getJSON runs at a time */
var container = null;
var api_url = 'http://dev.gignal.com/event/api/eventId/';

$(window).error(function (msg, url, line) {
	// todo: post to Loggly
});

function sortByDate (a, b) {
	return (new Date(a.created_on)).getTime() - (new Date(b.created_on)).getTime();
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
		var nodes = [];
		$.each(data.photos, function(key, val) {
			if (val.thumb_photo !== null) {
				val.type = 'image';
				nodes.push(val);
			}
		});
		$.each(data.text, function(key, val) {
			val.type = 'text';
			nodes.push(val);
		});
		nodes.sort(sortByDate);
		var output = '';
		$.each(nodes, function(key, node) {
			switch (node.type) {
				case 'text':
					output = templates.post.render(node);
					break;
				case 'image':
					output = templates.image.render(node);
					break;
				default:
					output = '';
					break;
			}
			container.prepend(output).masonry('reload');
		});
	});
	jqxhr.error(function(){
		calling = false;
	});
}

/* OnLoad */
$(function(){
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
