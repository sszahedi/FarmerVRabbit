var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 1200,
    height: 600,
    backgroundColor: '#336600',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

function preload() {
    this.load.image('farmer', 'images/farmer2.png'); // farmer2 is the scaled down version
    this.load.image('rabbit', 'images/rabbit2.png'); // rabbit2 is scaled down version
    this.load.image('carrot', 'images/carrot.png');
    this.load.audio('afterdark', 'audio/demoAfterDark.m4a');
    this.load.audio('crunch', 'audio/carrotCrunch.m4a');
}

var music;

function create() {
    var self = this;
    this.socket = io();
    // music = self.sound.play('afterdark',{loop: true});

    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                addPlayer(self, players[id]);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });
    this.socket.on('newPlayer', function (playerInfo) {
        addOtherPlayers(self, playerInfo);
    });
    this.socket.on('disconnect', function (playerId) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerId === otherPlayer.playerId) {
                otherPlayer.destroy();
            }
        });
    });
    this.socket.on('playerMoved', function (playerInfo) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            // console.log(otherPlayer);
            if (playerInfo.playerId === otherPlayer.playerId) {
                // otherPlayer.setDisplayWidth(playerInfo.displayWidth);
                if(playerInfo.team === 'rabbit'){

                    otherPlayer.setPosition(playerInfo.x, playerInfo.y).setDisplaySize(playerInfo.displayWidth, 40);
                    // otherPlayer.body.setSize(53, 40, 0 , 0);
                }
                else if (playerInfo.team === 'farmer'){
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y).setDisplaySize(playerInfo.displayWidth, 120);
                }
            }
        });
    });
    this.cursors = this.input.keyboard.createCursorKeys();

    this.blueScoreText = this.add.text(275, 16, '', { fontSize: '32px', fill: '#0000FF' });
    this.redScoreText = this.add.text(675, 16, '', { fontSize: '32px', fill: '#FF0000' });

    this.socket.on('scoreUpdate', function (scores) {
        music = self.sound.play('crunch');
        self.blueScoreText.setText('Farmer: ' + scores.farmer);
        self.redScoreText.setText('Rabbit: ' + scores.rabbit);
    });

    this.socket.on('carrotLocation', function (carrotLocation) {
        if (self.carrot) self.carrot.destroy();
        self.carrot = self.physics.add.image(carrotLocation.x, carrotLocation.y, 'carrot').setOrigin(0.5, 0.5).setDisplaySize(30, 40);
        //if (self.farmer.texture.key === 'rabbit') {
            self.physics.add.overlap(self.farmer, self.carrot, function () {

                self.carrot.destroy();
                // music = self.sound.play('crunch');

                this.socket.emit('carrotCollected', carrotLocation);
            }, null, self);

        //}
        // else if (self.farmer.texture.key === 'farmer') {

        //     self.physics.add.overlap(self.farmer, self.otherPlayers, function () {
        //         this.socket.emit('rabbitCaught');

        //     }, null, self);
        // }



    });
    
}

function addPlayer(self, playerInfo) {
    if (playerInfo.team === 'farmer') {
        console.log("i'm a farmer");
        self.farmer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'farmer').setOrigin(0.5, 0.5).setDisplaySize(53, 120);
        console.log(self.farmer);



    }
    else {
        console.log("i'm a rabbit");
        self.farmer = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'rabbit').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
        console.log(self.farmer);

    }

}

function addOtherPlayers(self, playerInfo) {
    if (playerInfo.team === 'rabbit') {
        var otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'rabbit').setOrigin(0.5).setDisplaySize(53, 40);
        // if(otherPlayer.body) otherPlayer.body.width = 40;
    }
    else if (playerInfo.team === "farmer") {
        var otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'farmer').setOrigin(0.5).setDisplaySize(53, 120);
        // if(otherPlayer.body) otherPlayer.body.width = 120;
        
    }
    // otherPlayer.body.width = 53;
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
}

function update() {
    if (this.farmer) {
        if (this.cursors.left.isDown) {
            (this.farmer.texture.key === 'rabbit') ? this.farmer.x -= 8 : this.farmer.x -= 6;
            this.farmer.displayWidth = 53;
            this.farmer.facing = 53;
        } else if (this.cursors.right.isDown) {
            (this.farmer.texture.key === 'rabbit') ? this.farmer.x += 8 : this.farmer.x += 6;
            this.farmer.displayWidth = -53;
            // this.farmer.flipX;
            this.farmer.facing = -53;
            // console.log(this.farmer.facing);
        } 

        if (this.cursors.up.isDown) {
            (this.farmer.texture.key === 'rabbit') ? this.farmer.y -= 8 : this.farmer.y -= 6;
        }
        else if (this.cursors.down.isDown) {
            (this.farmer.texture.key === 'rabbit') ? this.farmer.y += 8 : this.farmer.y += 6;
        }
        
        this.physics.world.wrap(this.farmer, 5);
        // emit player movement
        var x = this.farmer.x;
        var y = this.farmer.y;
        if (this.farmer.oldPosition && (x !== this.farmer.oldPosition.x || y !== this.farmer.oldPosition.y)) {
            // console.log("displayWidth: ", this.farmer.displayWidth);
            this.socket.emit('playerMovement', { x: this.farmer.x, y: this.farmer.y, displayWidth: this.farmer.facing });
        }
        // save old position data
        this.farmer.oldPosition = {
            x: this.farmer.x,
            y: this.farmer.y,
            displayWidth: this.farmer.facing
        };
    }

    $('#reset').click(()=>{
        console.log('reset');
        this.socket.emit('reset');
    });
}
