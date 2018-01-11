var LVL_CONSTANTS = {
    TILE         : 0,
    BLOCK        : 1,
    CRACKED_TILE : 2,
    FOOD         : 3,
    DEST         : 4
};

var player_x 	= 0;
var player_y 	= 0;
var grid_len_x 	= 8;
var grid_len_y 	= 8;
var hop_len 	= 80;
var game_over 	= false;
var lvl_over 	= false;

var grid 	   = [];
var grid_items = [];
var grid_sprties = [];
var grid_items_sprites = [];
var player;
var panel;

var lvl_1;
var lvl_1_items;

var lvl_obj 	   = 2;
var lvl_obj_gained = 0;
var cur_lvl 	   = 0;
var cur_lvl_name   = '';

var vp_dx 	= 0;
var vp_dy 	= 0;
var vpo_dx 	= 0;
var vpo_dy 	= 0;
var socket 	= io.connect("/");
var UUID    = '';
var canvas  = {};
var assets  = {
	loaded : false
};

var gameLoopHandle;

$(document).ready(function() {
	$('#playb').click(function() {
		socket.emit('start_game', null);
		socket.on('start_game', function(setup) {
			UUID = setup.id;
			$('#overlay').css("display", "none");
			$('#underlay').removeClass("blur");

			loadEventHandler();

			socket.on('action_result', function(result) {
				grid 			= result.gameState.grid;
				grid_items 		= result.gameState.grid_items;
				lvl_obj_gained 	= result.gameState.lvl_obj_cl;
				player_x 		= result.gameState.player_x;
				player_y 		= result.gameState.player_y;
				game_over 		= result.gameState.game_over;
				lvl_over 		= result.gameState.lvl_comp;
				vp_dx 			= result.gameState.vp_dx;
				vp_dy 			= result.gameState.vp_dy;
				vpo_dx 			= result.gameState.vpo_dx;
				vpo_dy 			= result.gameState.vpo_dy;
				$("#obj_header").text("FOOD NEEDED: " + (lvl_obj - lvl_obj_gained));
				console.log(lvl_over);
			});

			startGameLoop();
    	})
	});
	$('#buildb').click(function() {
		window.location = "/builder";
	});
	$('#levelb').click(function() {
		$('#menubpanel').css("display", "none");
		$('#levelpanel').css("display", "block");
	});
	$('#aboutb').click(function() {
		$('#menubpanel').css("display", "none");
		$('#textpanel').css("display", "block");
	});
	$('#backb').click(function() {
		$('#menubpanel').css("display", "block");
		$('#textpanel').css("display", "none");
	});
	$('#backb2').click(function() {
		$('#menubpanel').css("display", "block");
		$('#levelpanel').css("display", "none");
	});
	$('#helpb').click(function() {
		$('#overlay').css("display", "block");
		$('#underlay').addClass("blur");
		$('#menubpanel').css("display", "none");
		$('#textpanel').css("display", "block");
	});
	$('#menub').click(function() {
		$('#overlay').css("display", "block");
		$('#underlay').addClass("blur");
	});
	$('#reset_b').click(function() {
		resetGame(cur_lvl_name);
	});

	// $.getJSON("/stat", function(result) {
	// 	console.log(result);
	// 	for (var i = 0; i < result.total_lvls; i++) {
	// 		if (i % 2 == 0) {
	// 			$( "#lvlrow1" ).append( "<button data=" + i.toString() + " type='button' class='btn lvlsb' style='margin-top: 5px; width: 50px; font-size: 30px;'>" + i.toString() + "</button>" );
	// 		}
	// 		else {
	// 			$( "#lvlrow2" ).append( "<button data=" + i.toString() + "type='button' class='btn lvlsb' style='margin-top: 5px; width: 50px; font-size: 30px;'>" + i.toString() + "</button>" );
	// 		}
	// 	}
	// 	loadLevel(cur_lvl);
	// });
	loadLevel(null);
	$(document).on('click', '.lvlsb', function(obj) {
		console.log(obj.target.attributes.data.value);
		cur_lvl = parseInt(obj.target.attributes.data.value);
		console.log("Number of Levels: " + cur_lvl);
		resetGame();
		$('#menubpanel').css("display", "block");
		$('#levelpanel').css("display", "none");
		$('#overlay').css("display", "none");
		$('#underlay').removeClass("blur");
	});
});

function loadLevel(level_name) {
	var url = "/level/get";
	if (level_name) {
		url = "/level/get/name/" + level_name;
	}
	$.getJSON(url, function(result) {
		var data = result.result;
		lvl_obj = data.lvl_obj;
		lvl_1 = data.map_grid;
		lvl_1_items = data.map_items;
		grid_len_x = data.len_x; 
		grid_len_y = data.len_y;

		if (grid_len_x - 8 > 0) {
			vpo_dx = grid_len_x - 8;
		}

		if (grid_len_y - 8 > 0) {
			vpo_dy = grid_len_y - 8;
		}
		cur_lvl_name = data.level_name;
		$("#lvl_header").text("LEVEL: " + data.level_name);
		$("#obj_header").text("FOOD NEEDED: " + lvl_obj);
	 	loadAssets();
		buildLevel(lvl_1, lvl_1_items);
		drawBoard();
	}).fail(function(d, textStatus, error) {
        console.error("getJSON failed, status: " + textStatus + ", error: "+error)
    });
}

function loadAssets() {
	console.log("Loading Game Assets");
	Crafty.init(640, 640, document.getElementById('game-screen'));
	Crafty.sprite(80, "assets/tile_sheet.png", {tile:[0,0]});
	Crafty.sprite(80, 80, "assets/block_sheet.png", {ice_block:[0,0]});
	Crafty.sprite(80, 70, "assets/hiker_sheet.png", {player_f:[0,0], player_b:[0,1], player_l:[1,1], player_r:[2,1]});
	Crafty.sprite(80, 80, "assets/item_sheet.png", {dest:[0,0], food:[1,0]});
	Crafty.sprite(480, 320, "assets/game_over_panel.png", {gm_panel:[0,0]});
	Crafty.sprite(480, 320, "assets/lvl_com_panel.png", {lc_panel:[0,0]});
	Crafty.viewport.clampToEntities = false;
	assets.loaded = true;
}

function loadEventHandler() {
	Crafty.bind('KeyDown', function(e) {
	    var key = e.keyCode ? e.keyCode : e.which;
	    console.log('keypress');
	    if (!game_over && !lvl_over) {
	    	socket.emit('player_action', {
	    		id: UUID, 
	    		key: key,
	    		lvl: lvl_1,
	    		lvl_items: lvl_1_items,
	    		lvl_obj: lvl_obj, 
	    		grid: grid,
	    		grid_items: grid_items,
	    		lvl_obj_cl: lvl_obj_gained,
	    		player_x: player_x,
	    		player_y: player_y,
	    		vp_dx: vp_dx,
	    		vp_dy: vp_dy,
	    		vpo_dx: vpo_dx,
	    		vpo_dy: vpo_dy 
	    	});
	    }
	    else if (game_over) {
	    	resetGame(cur_lvl_name);
	    }
	    else if (lvl_over) {
	    	resetGame(null);
	    }
	});
}

function buildLevel(lvl, lvl_items) {
	for (var i = 0; i < grid_len_y; i++) {
		grid.push([]);
		grid_items.push([]);
		grid_sprties.push([]);
		grid_items_sprites.push([]);
		for (var j = 0; j < grid_len_x; j++) {
			var newTile = null; 
			if (lvl[i][j] == 0) {
				grid[i][j] = LVL_CONSTANTS.TILE;
				newTile = Crafty.e("2D, Canvas, tile, SpriteAnimation")
				.attr({x: j*80, y: i*80})
				.reel('tile_cracking', 200, 0, 0, 2)
				.reel('tile_cracking_2', 1000, 1, 0, 4);
				newTile.sprite('tile');
				var tile_obj = {
					cracked_status: false,
					entity: newTile
				};

				grid_sprties[i].push(tile_obj);
			}
			else {
				grid[i][j] = LVL_CONSTANTS.BLOCK;
				newTile = Crafty.e("2D, Canvas, ice_block")
				.attr({x: j*80, y: i*80})
				grid_sprties[i].push(newTile);
			}

			var newItem = null;
			if (lvl_items[i][j] == 1) {
				grid_items[i][j] = LVL_CONSTANTS.DEST;
				newItem = Crafty.e("2D, Canvas, dest")
					.attr({x: j*80 + 5, y: i*80 + 5, w: 70, h: 70});
			}
			else if (lvl_items[i][j] == 2) {
				grid_items[i][j] = LVL_CONSTANTS.FOOD;
				newItem = Crafty.e("2D, Canvas, food, FI")
					.attr({x: j*80 + 5, y: i*80 + 5, w: 70, h: 70});
			}
			else {
				grid_items[i][j] = null;
			}
			grid_items_sprites[i].push(newItem);
		}
	}

	player = Crafty.e("2D, Canvas, player_f, Collision, SpriteAnimation")
		.attr({x: 8, y: 7, w: 64, h: 56})
		.reel('player_drown', 1200, 0, 0, 7)
		.reel('player_drown_2', 650, 5, 0, 2)
		.reel('player_fan', 10000, 0, 1, 7)
		.reel('player_ban', 10000, 0, 2, 7)
		.reel('player_lan', 10000, 0, 3, 7)
		.reel('player_ran', 10000, 0, 4, 7)
		.animate('player_fan', -1);
}

function drawBoard() {
	//canvas.context.fillStyle = '#333333';
	//canvas.context.fillRect(0, 0, 640, 640);
	// Draw grid
	for (var i = 0; i < grid_len_y; i++) {
		for (var j = 0; j < grid_len_x; j++) {
			if (grid[i][j] == LVL_CONSTANTS.TILE) {
				//canvas.context.drawImage(assets.tile, (j - vp_dx)*80, (i - vp_dy)*80);
			}
			if (grid[i][j] == LVL_CONSTANTS.BLOCK) {
				//canvas.context.drawImage(assets.block, (j - vp_dx)*80, (i - vp_dy)*80);
			}
			if (grid[i][j] == LVL_CONSTANTS.CRACKED_TILE && !grid_sprties[i][j].cracked_status) {
				if (!grid_sprties[i][j].cracked_status) {
					grid_sprties[i][j].entity.animate('tile_cracking', 1);
					grid_sprties[i][j].cracked_status = true;
				}
				//canvas.context.drawImage(assets.tile, 80, 0, 80, 80, (j - vp_dx)*80, (i - vp_dy)*80, 80, 80);
			}
		}
	}
	// Draw Items
	for (var i = 0; i < grid_len_y; i++) {
		for (var j = 0; j < grid_len_y; j++) {
			if (grid_items[i][j] == LVL_CONSTANTS.CRACKED_TILE) {
				grid_items_sprites[i][j].destroy();
			}
			if (grid_items[i][j] == LVL_CONSTANTS.FOOD) {
				//canvas.context.drawImage(assets.items, 80, 0, 80, 80, (j - vp_dx)*80 + 8, (i - vp_dy)*80 + 7, 64, 56);
			}
			if (grid_items[i][j] == LVL_CONSTANTS.DEST) {
				//canvas.context.drawImage(assets.items, 0, 0, 80, 80, (j - vp_dx)*80 + 8, (i - vp_dy)*80 + 7, 64, 56);
			}
		}
	}
	// Draw Player
	//canvas.context.drawImage(assets.hiker, 0, 0, 80, 70, (player_x - vp_dx)*80 + 8, (player_y -vp_dy)*80 + 7, 64, 56);
	player.x = 8 + (player_x * 80);
	player.y = 7 + (player_y * 80);
	if (game_over) {
		grid_sprties[player_y][player_x].entity.animate('tile_cracking_2', 1);
		player.animate('player_drown', 1);
		player.animate('player_drown_2', -1);
		panel = Crafty.e("2D, Tween, Canvas, gm_panel")
			.attr({alpha: 0.1, x: 80, y: 160, w: 480, h: 320})
			.tween({alpha: 1.0, x: 80, y: 160}, 3000);
		Crafty.viewport.centerOn(panel, 3000);
		window.cancelAnimationFrame(gameLoopHandle);
	}
	if (lvl_over) {
		cur_lvl++;
		cur_lvl = cur_lvl % 1;
		panel = Crafty.e("2D, Tween, Canvas, lc_panel")
			.attr({alpha: 0.1, x: 80, y: 160, w: 480, h: 320})
			.tween({alpha: 1.0, x: 80, y: 160}, 3000);
		Crafty.viewport.centerOn(panel, 3000);
		window.cancelAnimationFrame(gameLoopHandle);
	}
	Crafty.viewport.x = -vp_dx * 80;
	Crafty.viewport.y = -vp_dy * 80;
}

function startGameLoop() {
	gameLoopHandle = window.requestAnimationFrame(startGameLoop);
    loop();
}

function loop() {
    drawBoard();
}

function resetGame(level_name) {
	Crafty('obj').each(function() { this.destroy(); });
	Crafty.stop(true);
	window.cancelAnimationFrame(gameLoopHandle);

	gameLoopHandle 	   = undefined;
	game_over   	   = false;
	lvl_over 		   = false;
	grid 	    	   = [];
	grid_sprties 	   = [];
	grid_items 		   = [];
	grid_items_sprites = [];
	player 			   = null;
	player_x 		   = 0;
	player_y 		   = 0;
	vp_dx 			   = 0;
	vp_dy 			   = 0;
	panel 			   = null;
	lvl_obj_gained 	   = 0;

	loadLevel(level_name);
	loadEventHandler();
	startGameLoop();
}

