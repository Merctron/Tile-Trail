var express 	 = require('express');
var app 		 = express();
var http 		 = require('http').Server(app);
var bodyParser 	 = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoClient  = require('mongodb').MongoClient;
var dbUrl 		 = process.env.MONGODB_URI || 'mongodb://localhost:27017/tile-trail';
var cors  		 = require('cors');
var Promise 	 = require('promise');
var trim 		 = require("trim");
var session 	 = require('express-session');
var io 		     = require('socket.io')(http);
var uuid 	     = require('node-uuid');

var levelController = require('./controllers/levelController');
var gameController  = require('./controllers/gameController');

// Setup pug view engine
app.set('view engine', 'pug')

// app.use(SSL_redirect);
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(session({
    name: 'sess.id',
    secret: 'tiletrailsecret',
    proxy: false,
    resave: false,
    saveUninitialized: false
}));

var indexRouter = express.Router();
app.use(cors());
app.use('/', indexRouter);

indexRouter.get('/', function(req, res) { res.sendfile('./views/game.html'); });
indexRouter.get('/play', function(req, res) { res.sendfile('./views/game.html'); });
indexRouter.get('/builder', function(req, res) { res.sendfile('./views/builder.html'); });

indexRouter.get('/stat', levelController.getLevelStats);
indexRouter.get('/level/get/:level_name', levelController.getLevel);
indexRouter.post('/level/profile', levelController.profileLevel);
indexRouter.get('/level/get', levelController.getRandomLevel);
indexRouter.get('/level/getbydiff', levelController.getRandomLevelByDifficulty);
indexRouter.post('/level/save', levelController.saveLevel);
indexRouter.post('/level/save/public', levelController.saveSubmittedLevel);

/* Setup socket.io for the game. */
io.on('connection', function(socket) {
	socket.on('player_action', function(move) {
		socket.emit('action_result', {gameState: gameController.processMove(move)});
	});

	socket.on('start_game', function(msg) {
		// On game start, assign the player a UUID and save it to the player map
		// Send the player current state of the game and its UUID to store
		var newPlayerUUID = uuid.v1();
		socket.emit('start_game', {id: newPlayerUUID});
	});
});

var port = app.get('port') || process.env.PORT || 3000;
http.listen(port, function() {
	console.log('listening on *: ' + port);
});