game_on = false;

var url = 'ws://178.62.124.78:22580/websocket/';
var ws;

function connect() {
	ws = new WebSocket(url);
	if(!ws) {
		setTimeout(connect, 5000);
	}
}

connect();


user = {
	authenticate: function() {
		var user_name = '',
			i = 0;

		while(!user_name.length && i < 25){
			user_name = prompt('Enter your name');
			i++;
		}

		if(user_name.length){
			ws.send(JSON.stringify({name: 'name', data: user_name}));
		} else {
			$('body').html('<h1>You are not allowed to play, bad guy!</h1>');
		}
	},
	name: '',
	id: ''
};

sign = {
	clicked: function(which){
		if(!game_on){
			return;
		}

		ws.send(JSON.stringify({name: 'sign', data: $(which).attr('alt')}));

		$('.sign').removeClass('active');
		$(which).addClass('active');
	}
};

$(document).ready(function(){

ws.onopen = function(event) {
	user.authenticate();
	ws.onmessage = handleMessage;
};

// ACTIONS
	$('.sign').click(function(){
		sign.clicked($(this));
	});
// END ACTIONS

// SOCKET
var handleMessage = function(event) {
	var message = JSON.parse(event.data);
	console.log('onMessage : [', message.name, '] : ', message.data);
	
	switch(message.name) {
		case 'id':
			user.id = message.data;
			break;
		case 'init':
			game_on = true;
			$('#status').html('Play!');
			$('#interval').html(message.data.interval);
			setTimeout(start_counter, 1000);
			$('#results').fadeOut('slow', function(){
				$('#winners, #winners_showed, #players').empty();
			});
			break;
		case 'end':
			game_on = false;
			$('#status').html('Wait');
			$('.sign').removeClass('active');
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
			var result = message.data;
			$('#winners_holder').hide();

			if(result.winners.length){
				$('#winners').html(pluck(result.winners, 'name').join(', '));
				$('#winners_showed').html(result.data[result.winners[0].id].vote);
				$('#winners_holder').show();
			}

			var players = [];
			for(var i in result.data){
				players.push(result.data[i].name + ' (' + result.data[i].vote + ')<br />');
			}

			$('#players').html(players);
			$('#results').fadeIn('fast');
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
