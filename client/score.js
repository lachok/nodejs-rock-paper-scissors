game_on = false;

var url = 'ws://178.62.124.78:22580/websocket/';
var ws;

function connect() {
	ws = new WebSocket(url);
	if(!ws) {
		setTimeout(connect, 5000);
	}
}

function updateScore() {
	ws.send(JSON.stringify({name: 'score', data: 'score_board'}));
	setTimeout(updateScore, 5000);
}

connect();


$(document).ready(function(){

ws.onopen = function(event) {
	ws.send(JSON.stringify({name: 'name', data: 'score_board'}));
	updateScore();
	ws.onmessage = handleMessage;
};

// SOCKET
var handleMessage = function(event) {
	var message = JSON.parse(event.data);
	console.log('onMessage : [', message.name, '] : ', message.data);
	
	switch(message.name) {
		case 'score':
			var score = message.data;
			
			var table = $('<table>');
			var header = '<thead><tr><th>Name</th><th>Points</th><tr></thead>';
			for(var i in score) {
				table.append('<tr><td>' + score[i].name + '</td><td>' + score[i].points + '</td></tr>')
			}
			$('#results').show();		
			$('#results').html($('<table class="table">' + header + table.html() + '</table>'))
			break;
		case 'init':
			game_on = true;
			$('#status').html('Play!');
			$('#interval').html(message.data.interval);
			setTimeout(start_counter, 1000);
			break;
		case 'end':
			game_on = false;
			$('#status').html('Wait');
			break;
		case 'online':
			$('#online_number').html(message.data);
			break;
		case 'log':
			console.log(message.data);
			break;
		case 'name':
			user.name = message.data;
			break;
		case 'result':
			break;
		default:
			break;
	}
}
// END SOCKET

	function start_counter(){
		var n = $('#interval').html() * 1 - 1;

		if(n > 0){
			$('#interval').html(n < 10 ? '0' + n : n);
			setTimeout(start_counter, 1000);
		}else{
			$('#interval').html('0');
		}
	}

	function pluck(arr, field){
		var ret = [];

		for(var i in arr){
			ret.push(arr[i][field]);
		}

		return ret;
	}
});
