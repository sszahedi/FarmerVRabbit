var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/static'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', function (req, res) {
    res.render('index');
});

server.listen(8000, function () {
    console.log(`Listening on ${server.address().port}`);
});


// GAME CODE

var players = {};
var playerCount = 0;
var carrot = {
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    grabbed: false
};

var scores = {
    farmer: 0,
    rabbit: 0
};

io.on('connection', function (socket) {
    console.log('a user connected: ', socket.id);
    // create a new player and add it to our players object
    players[socket.id] = {
        rotation: 0,
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        playerId: socket.id,
        displayWidth: 53,
        // team: (Math.floor(Math.random() * 2) == 0) ? 'rabbit' : 'farmer'
        team: ( (Math.floor(Math.random()*3)) % 3 != 0 ) ? 'farmer' : 'rabbit'
      };
      playerCount++;
    // if (Object.keys(players).length == 0) {
    //     players[socket.id] = {
    //         x: Math.floor(Math.random() * 700) + 50,
    //         y: Math.floor(Math.random() * 500) + 50,
    //         playerId: socket.id,
    //         team: 'farmer'
    //     };

    // }
    // else if (Object.keys(players).length == 1) {
    //     players[socket.id] = {
    //         x: Math.floor(Math.random() * 700) + 50,
    //         y: Math.floor(Math.random() * 500) + 50,
    //         playerId: socket.id,
    //         team: 'rabbit'
    //     };
    // }


    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // send the star object to the new player
    if (Object.keys(players).length >= 2) {
        io.emit('carrotLocation', carrot);
    

    }
    // send the current scores
    socket.emit('scoreUpdate', scores);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // when a player disconnects, remove them from our players object
    socket.on('disconnect', function () {
        console.log('user disconnected: ', socket.id);
        delete players[socket.id];
        // emit a message to all players to remove this player
        io.emit('disconnect', socket.id);
    });

    // when a player moves, update the player data
    socket.on('playerMovement', function (movementData) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].displayWidth = movementData.displayWidth;
        // emit a message to all players about the player that moved
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });

    socket.on('carrotCollected', function (carrot) {
        if (players[socket.id].team === 'rabbit') {
            scores.rabbit += 1;
        }
        else if(players[socket.id].team === 'farmer'){
            scores.farmer += 1;
        }
        var carrot = {
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50
        };
        // console.log(carrot);
        io.emit('carrotLocation', carrot);
        io.emit('scoreUpdate', scores);
    });

    socket.on('rabbitCaught', () => {
        scores.farmer += 1;
        io.emit('scoreUpdate', scores);
    });
});