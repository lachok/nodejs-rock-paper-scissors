Rock Paper Scissors

The game starts when 2 or more players are online. :-)
connect:
```javascript
let ws = new WebSocket('ws://178.62.124.78:22580/websocket/')
```

After connecting a client should send a message with its name:
message:
```
name: 'name'
data: CLIENT_NAME
```
example:
```javascript
ws.onopen = function(event) {
    let message = JSON.stringify({
        name: 'name',
        data: user_name
    })
    ws.send(message)
})
```

Then the client will receive a message with a unique client id.
message:
```
name: 'id'
data: UNIQUE_CLIENT_ID
```
example:
```javascript
function handleMessage(event) {
	var message = JSON.parse(event.data)
	
	if(message.name == 'id') {
        console.log('client id:', message.data)
    }
}
```

As soon as there are at least two clients, each client will receive an 'init' message
message:
```
name: 'init'
data:
    interval: TIME_UNTIL_NEXT_GAME_IN_SECONDS
```
example:
```javascript
function handleMessage(event) {
	var message = JSON.parse(event.data)
	
	if(message.name == 'init') {
        console.log('next game starts in ', message.data.interval, 'seconds')
    }
}
```

When a game ends the client receives an 'end' message
message:
```
name: 'end'
```
example:
```javascript
function handleMessage(event) {
	var message = JSON.parse(event.data)
	
	if(message.name == 'end') {
        console.log('the game has ended')
    }
}
```

The server will periodically broadcast an 'online' message that tells each client how many players there are currently in the game
message:
```
name: 'online'
data: NUMBER_OF_ONLINE_PLAYERS
```
example:
```javascript
function handleMessage(event) {
	var message = JSON.parse(event.data)
	
	if(message.name == 'online') {
        console.log('There are currently', message.data, 'players online')
    }
}
```

When a game ends a 'result' message will be broadcast to all clients. It contains a list of clients and the sign each client played in the last game; and a list of winners.
message:
```
name: 'result'
data: 
    winners: ARRAY_OF_WINNING_PLAYERS
        id: CLIENT_ID
        name: PLAYER_NAME
    data: MAP_OF_SIGNS_BY_PLAYER_ID
        name: NAME_OF_PLAYER
        vote: SIGN_PLAYED
```
example:
```javascript
function handleMessage(event) {
	var message = JSON.parse(event.data)
	
	if(message.name == 'result') {
        console.log('The winners are', message.data.winners.map(winner => '[id:' + winner.id + ', name:' + winner.name + ']').join(' | '))
        console.log('The votes were', JSON.stringify(message.data.data))
    }
}
```



Not officially supported message types
--------------------------------------
Log message.
message:
```
name: 'log'
data: DATA_TO_LOG
```
