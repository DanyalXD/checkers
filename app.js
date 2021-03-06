'use strict';
var express = require('express');
var app = express();
var config = require('./checkers_config');

var http = require('http').Server(app);
var socketio = require('socket.io')(http);
//var socketio = require('./checkers_socket'); // this isn't working. Perhaps its becuase it uses a new http and listen is being set here.
var redis = require('./checkers_redis');



app.use(express.static('public'));
app.use(express.static('bower_components'));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/index.html');
});




//dispatcher isn't working. Nothing recieved in client.
var dispatcher = function(type, obj, toid){
	console.log(obj);
	socketio.to(toid).emit(type, obj);
};


var associateGame = function(obj){
	if(obj.found){
		//console.log('associateGame assignGame');
		redis.assignGame(obj.game, obj.socket.id, dispatcher);


		//socket.to(obj.socket.id).emit('player2');
	}else{
		//console.log('associateGame createGame');
		redis.createGame(obj.socket.id, dispatcher);

		//socket.to(obj.socket.id).emit('player1');
	}
};

socketio.on('connection', function(socket){
	console.log('user connected', socket.id);
	redis.checkAwaitingGames(socket, associateGame, dispatcher);
	
	socket.on('disconnect', function(){
		redis.closeGame(socket.id, dispatcher);
		console.log('user disconnected');
	});
	socket.on('chat message', function(message){
		//socket.broadcast.emit(message);
		socket.emit('chat message',message);
		console.log('message: ' + message);
	});

	socket.on('move taken', function(obj){
		console.log('move taken', obj);
		redis.getOpponent(obj, dispatcher);
		
	});

	socket.on('taken piece', function(obj){
		console.log('taken piece', obj);
		redis.sendTakenPiece(obj, dispatcher);
	});
});




http.listen(config.server_port, function(){
	console.log('Listening on port ' + config.server_port);
});
