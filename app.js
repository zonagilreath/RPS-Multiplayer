game = {
    config: {
        apiKey: "AIzaSyCdoIu9DXnUqfVnf-ew5bNBcc6y0lrJZvA",
        authDomain: "rock-paper-scissors-881ef.firebaseapp.com",
        databaseURL: "https://rock-paper-scissors-881ef.firebaseio.com",
        projectId: "rock-paper-scissors-881ef",
        storageBucket: "rock-paper-scissors-881ef.appspot.com",
        messagingSenderId: "658810098192"
    },

    form: $("#game-form"),
    username: null,
    opponent: null,

    initFBase: function(){
        firebase.initializeApp(this.config);
        
        game.db = firebase.database();
        game.players = game.db.ref("/players");
        game.waiting = game.db.ref("/waiting");
        game.games = game.db.ref("/games");
    },

    newPlayerListeners: function(){
        game.form.on('submit', function(event){
            event.preventDefault();
            let username = $("#uName").val();
            let timestamp = new Date().getTime();
            // let playStatus = 0;
            // let opponent = '';
            // let move = null;
            game.players.child(username).once("value", function(snap){
                if (snap.exists()){
                    alert("Username taken!");
                }
                else {
                    let data = {
                        username,
                        timestamp,
                        // playStatus,
                        // opponent,
                        // move,
                    }
                    game.players.child(username).set(data)
                    .then(()=>{
                        console.log("new player added");
                        game.username = username;
                        return "Ok"
                    }).catch((error)=>{
                        console.log(error);
                    });
                }
            });
            
        });
        
        const now = new Date().getTime();
        const newPlayers = game.players.orderByChild("timestamp").startAt(now);
        
        newPlayers.once("child_added", function(newPlayerSnapshot){
            game.waiting.orderByChild("timestamp").limitToFirst(1).once("value", function(waitingPlayerSnap){
                if (waitingPlayerSnap.exists()) {
                    waitingPlayersObj = waitingPlayerSnap.val();
                    let player1key = Object.keys(waitingPlayersObj)[0];
                    game.waiting.child(player1key).remove();
                    game.opponent = player1key;
                    let player2key = newPlayerSnapshot.key;
                    game.players.child(player1key).update({opponent: player2key});
                    game.players.child(player2key).update({opponent: player1key});
                    game.gameUI();
                } else {
                    let data = {};
                    data[newPlayerSnapshot.key] = newPlayerSnapshot.val();
                    game.waiting.set(data);
                    game.players.child(game.username).on("value", function(snap){
                        if (snap.child("opponent").exists()){
                            game.opponent = snap.child("opponent").val();
                            game.gameUI();
                            game.players.child(game.username).off();
                        }
                    })
                
                }
            })
        });

    },

    init: function(){
        game.initFBase();
        game.newPlayerListeners();
    },

    gamePlayListeners: function(){
        game.form.on('submit', function(event){
            event.preventDefault();
            game.playerMove = $('#move').val();
            // TODO: add player move to player object in DB, change play status
            // TODO: add listener to each other's play status, so when both are 1 game checks for winner
            game.players.child(game.username).update({move: game.playerMove})
            game.players.child(game.opponent).on("value", function(opponentSnap){
                if (opponentSnap.child("move").exists()) {
                    game.opponentMove = opponentSnap.child("move").val()
                    console.log(game.opponentMove);
                    game.gameLogic();
                }
            })
        })
    },

    gameUI: function(){
        game.form.prepend($('<p id="opponent-name">'));
        $("#opponent-name").text("You are playing with " + game.opponent);
        let moveChoice = $('<select id="move">');
        let rock = $('<option value="rock">').text("Rock");
        let paper = $('<option value="paper">').text("Paper");
        let scissors = $('<option value="scissors">').text("Scissors");
        moveChoice.append(rock, paper, scissors)
        let input = game.form.find("input");
        input.replaceWith(moveChoice);
        let button = game.form.find("button");
        button.text("Play");
        game.form.off();
        game.gamePlayListeners();
    },

    gameLogic: function(){
        if (game.playerMove == game.opponentMove){
            $("body").html("<h1>TIE!</h1>")
        } else if (
            (game.playerMove == "rock" && game.opponentMove == "scissors") ||
            (game.playerMove == "scissors" && game.opponentMove == "paper") ||
            (game.playerMove == "paper" && game.opponentMove == "rock")
        ){
            $("body").html("<h1>YOU WIN!</h1>")
        }else {
            $("body").html("<h1>YOU LOSE, SORRY!</h1>")
        }
        game.players.child(game.username).remove();
    }
}

game.init();
