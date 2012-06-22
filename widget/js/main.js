var eventid = 7;
var since_time = 0;
var delay = 5000; /* milliseconds */
var calling = false; /* make sure only one getJSON runs at a time */
var container = null;
var api_url = 'http://dev.gignal.com/event/api/eventId/';

function sortByDate (a, b) {
	return new Date(a.created_on).getTime() - new Date(b.created_on).getTime();
}

function fetch (eventid) {
	if (calling) {
		return;
	}
	calling = true;
	var url = api_url + eventid;
	var options = {
		limit: 20,
		sinceId: since_time
	};
	$.getJSON(url, options, function (data) {
		calling = false;
		since_time = new Date().getTime();
		var nodes = [];
		$.each(data.photos, function(key, val) {
			val.type = 'image';
			nodes.push(val);
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
			container.prepend(output);
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
		});
	});
}

/* OnLoad */
$(function(){
	container = $('#nodes');
	// get data now
	fetch(eventid);
	// get data every {delay} millisecond
	window.setInterval(fetch, delay, eventid);
});
