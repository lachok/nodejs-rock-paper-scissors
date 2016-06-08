#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');

var interval = 10 * 1000, waiting = 5 * 1000, heartbeat_interval = 60 * 1000, // times in ms
	connections = [], names = {}, signs = {}, disallowed = [], port = 22580, game_on = false // additions
    connectionId = 1, score = {};
 
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(port, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});
 
wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production 
    // applications, as it defeats all standard cross-origin protection 
    // facilities built into the protocol and the browser.  You should 
    // *always* verify the connection's origin and decide whether or not 
    // to accept it. 
    autoAcceptConnections: false
});
 
function originIsAllowed(origin) {
    console.log(origin);
  // put logic here to detect whether the specified origin is allowed. 
  return true;
}
 
wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin 
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection accepted.');
    
    connection.id = connectionId++;
	connections.push(connection); // and push it in the array
	broadcast('online', connections.length); // broadcast the online number
    connection.send(JSON.stringify({name: 'id', data: connection.id}));
    
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            
            var messageJson = JSON.parse(message.utf8Data);
            
            switch(messageJson.name) {
                case 'name':
                    names[connection.id] = messageJson.data;
                    break;
                case 'sign':
                    if(!game_on || disallowed.indexOf(connection.id) !== -1){
                        return;
                    }
                    signs[connection.id] = messageJson.data;
                    break;
				case 'score':
					var sortedScore = Object.keys(score).map(function(key) {
						return {
							id: key,
							name: score[key].name,
							points: score[key].points
						};
					});
					sortedScore.sort(function compare(a, b) {
						if (a.points < b.points) {
							return -1;
						}
						if (a.points < b.points) {
							return 1;
						}
						// a must be equal to b
						return 0;
					})
					connection.send(JSON.stringify({name: 'score', data: sortedScore}));
					break;
                default:
                    break;
            }
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        
        connections.splice(connections.indexOf(connection), 1); // remove from the array
		delete names[connection.id];
		broadcast('online', connections.length); // broadcast the online number
    });
});


function broadcast(key, msg){
    msg = msg || {};
	for(var i in connections){
		connections[i].send(JSON.stringify({name: key, data: msg}));
	}
}

function init(){
	if(connections.length >= 2){
        console.log('At least 2 players, starting game...')
		game_on = true;
		broadcast('init', {interval: interval / 1000});
	}

	signs = {};
	setTimeout(end, interval);
}

function end(){
	if(game_on){
		game_on = false;
		broadcast('end');
		results();
        console.log('Ending game...')
	}

	setTimeout(init, waiting);
}

function results(){
	var result = {
		winners: [],
		data: copy(names)
	},
    state = {
		s: find_first(signs, 'scissors') !== -1,
		r: find_first(signs, 'rock') !== -1,
		p: find_first(signs, 'paper') !== -1
	},
    sum = state.s + state.r + state.p;

	switch(sum){
		case 2:
			result.winners = get_winners(state);
			add_disallowed(result);
			break;
		case 3:
			break;
		default: // case 1:
			disallowed = [];
	}

	check_reset(result);
	add_signs(result);
//	console.log(result);
	
	update_score(result);
	broadcast('result', result);
}

function copy(obj){
	var new_obj = {};
	for(var i in obj){
		new_obj[i] = obj[i];
	}
	return new_obj;
}

function find_first(arr, word){
	for(var i in arr){
		if(arr[i] == word){
			return i;
		}
	}

	return -1;
}

function check_reset(result){
	var winners = 0;
	for(var i in result.winners){
		winners++;
	}

	if(winners <= 1){
		disallowed = [];
	}
}

function add_disallowed(result){
	for(var i in result.data){
		var winner_found = false;

		for(var j in result.winners){
			if(result.winners[j].id === i){
				winner_found = true;
			}
		}

		if(!winner_found){
			disallowed.push(i);
		}
	}
}

function add_signs(result){
	for(var i in result.data){
		result.data[i] = {
			name: result.data[i],
			vote: signs[i] || '---'
		};
	}
}

function get_winners(state){
	var win = state.s && state.p ? 'scissors' : (state.r && state.p ? 'paper' : 'rock'),
		winners = [];

	for(var i in signs){
		if(signs[i] == win){
			winners.push({
				id: i,
				name: names[i]
			});
		}
	}

	return winners;
}

function update_score(result) {
	result.winners.forEach(function(winner) {
		score[winner.id] = score[winner.id] || {};
		score[winner.id].name = winner.name;
		score[winner.id].points = score[winner.id].points || 0;
		score[winner.id].points++;
	})
} 

function heartbeat(){
	broadcast('online', connections.length);

	setTimeout(heartbeat, heartbeat_interval);
}

init();
heartbeat();