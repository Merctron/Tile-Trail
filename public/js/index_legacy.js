var player_x = 0;
var player_y = 0;
var grid_len_x = 8;
var grid_len_y = 8;
var hop_len = 80;
var game_over = false;
var lvl_over = false;

var grid = [];
var grid_items = [];
var player;
var panel;

var lvl_1;
var lvl_1_items;

var lvl_obj = 2;
var lvl_obj_gained = 0;
var cur_lvl = 0;

var vp_dx = 0;
var vp_dy = 0;
var vpo_dx = 0;
var vpo_dy = 0;

$(document).ready(function() {
	$('#playb').click(function() {
		$('#overlay').css("display", "none");
		$('#underlay').removeClass("blur");
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
		resetGame();
	});

	$.getJSON("/stat", function(result) {
		console.log(result);
		for (var i = 0; i < result.total_lvls; i++) {
			if (i % 2 == 0) {
				$( "#lvlrow1" ).append( "<button data=" + i.toString() + " type='button' class='btn lvlsb' style='margin-top: 5px; width: 50px; font-size: 30px;'>" + i.toString() + "</button>" );
			}
			else {
				$( "#lvlrow2" ).append( "<button data=" + i.toString() + "type='button' class='btn lvlsb' style='margin-top: 5px; width: 50px; font-size: 30px;'>" + i.toString() + "</button>" );
			}
		}
		loadLevel(cur_lvl);
	});

	$(document).on('click', '.lvlsb', function(obj) {
		console.log(obj.target.attributes.data.value);
		cur_lvl = parseInt(obj.target.attributes.data.value);
		resetGame();
		$('#menubpanel').css("display", "block");
		$('#levelpanel').css("display", "none");
		$('#overlay').css("display", "none");
		$('#underlay').removeClass("blur");
	});
});

function loadLevel(lvl) {
	var url = "/level/get/level_" + lvl.toString();
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

		$("#lvl_header").text("LEVEL: " + lvl.toString());
		$("#obj_header").text("FOOD NEEDED: " + lvl_obj.toString());
	 	loadAssets();
		buildLevel(lvl_1, lvl_1_items);
		startGame(lvl_1, lvl_1_items);
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
}

function buildLevel(lvl, lvl_items) {
	for (var i = 0; i < grid_len_y; i++) {
		grid.push([]);
		grid_items.push([]);
		for (var j = 0; j < grid_len_x; j++) {
			var newTile = null; 
			if (lvl[i][j] == 0) {
				newTile = Crafty.e("2D, Canvas, tile, SpriteAnimation")
				.attr({x: j*80, y: i*80})
				.reel('tile_cracking', 200, 0, 0, 2)
				.reel('tile_cracking_2', 1000, 1, 0, 4);
				newTile.sprite('tile');
				var tile_obj = {
					cracked_status: false,
					entity: newTile
				};

				grid[i].push(tile_obj);
			}
			else {
				newTile = Crafty.e("2D, Canvas, ice_block")
				.attr({x: j*80, y: i*80})
				grid[i].push(newTile);
			}

			var newItem = null;
			if (lvl_items[i][j] == 1) {
				newItem = Crafty.e("2D, Canvas, dest")
					.attr({x: j*80 + 5, y: i*80 + 5, w: 70, h: 70});
			}
			else if (lvl_items[i][j] == 2) {
				newItem = Crafty.e("2D, Canvas, food, FI")
					.attr({x: j*80 + 5, y: i*80 + 5, w: 70, h: 70});
			}
			grid_items[i].push(newItem);
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

	//Crafty.viewport.centerOn(player, 3000);
	//Crafty.viewport.follow(player, 8, 7);
}

function startGame(lvl, lvl_items) {
	Crafty.bind('KeyDown', function(e) {
		if (!game_over && !lvl_over) {
			
			var nxt_mv = {
				x: 0,
				y: 0,
				next_hop_x: 0,
				next_hop_y: 0
			};

			if (e.key === Crafty.keys.LEFT_ARROW) {
				nxt_mv.x = player_x - 1;
				nxt_mv.y = player_y;
				nxt_mv.next_hop_x -= hop_len;
		  		player.sprite('player_l');
		  		player.animate('player_lan', -1);
			} else if (e.key === Crafty.keys.RIGHT_ARROW) {
				nxt_mv.x = player_x + 1;
				nxt_mv.y = player_y;
				nxt_mv.next_hop_x += hop_len;
		  		player.sprite('player_r');
		  		player.animate('player_ran', -1);
			} else if (e.key === Crafty.keys.UP_ARROW) {
				nxt_mv.x = player_x;
				nxt_mv.y = player_y - 1;
				nxt_mv.next_hop_y -= hop_len;
				player.sprite('player_b');
				player.animate('player_ban', -1);
			} else if (e.key === Crafty.keys.DOWN_ARROW) {
				nxt_mv.x = player_x;
				nxt_mv.y = player_y + 1;
				nxt_mv.next_hop_y += hop_len;
		  		player.sprite('player_f');
		  		player.animate('player_fan', -1);
			}

			if (lvl[nxt_mv.y][nxt_mv.x] == 0) {
				if (grid[nxt_mv.y][nxt_mv.x].cracked_status == true) {
					game_over = true;
					grid[nxt_mv.y][nxt_mv.x].entity.animate('tile_cracking_2', 1);
					player.x += nxt_mv.next_hop_x;
					player.y += nxt_mv.next_hop_y;
					player_x = nxt_mv.x;
					player_y = nxt_mv.y;
					player.animate('player_drown', 1);
					player.animate('player_drown_2', -1);
					panel = Crafty.e("2D, Tween, Canvas, gm_panel")
						.attr({alpha: 0.1, x: 80, y: 160, w: 480, h: 320})
						.tween({alpha: 1.0, x: 80, y: 160}, 3000);
					Crafty.viewport.centerOn(panel, 3000);
					return;
				}
				grid[player_y][player_x].entity.animate('tile_cracking', 1);
				grid[player_y][player_x].cracked_status = true;
				player.x += nxt_mv.next_hop_x;
				player.y += nxt_mv.next_hop_y;
				player_x = nxt_mv.x;
				player_y = nxt_mv.y;

				if (nxt_mv.next_hop_x > 0 && vpo_dx > 0 && player_x >= 6) {
					Crafty.viewport.x -= nxt_mv.next_hop_x;
					vp_dx++;
					vpo_dx--;
				}
				else if (nxt_mv.next_hop_x < 0 && vp_dx > 0) {
					Crafty.viewport.x -= nxt_mv.next_hop_x;
					vp_dx--;
					vpo_dx++;
				}

				if (nxt_mv.next_hop_y > 0 && vpo_dy > 0 && player_y >= 6) {
					Crafty.viewport.y -= nxt_mv.next_hop_y;
					vp_dy++;
					vpo_dy--;
				}
				else if (nxt_mv.next_hop_y < 0 && vp_dy > 0) {
					Crafty.viewport.y -= nxt_mv.next_hop_y;
					vp_dy--;
					vpo_dy++;
				}

			}

			if (lvl_items[player_y][player_x] == 1) {
				if (lvl_obj_gained >= lvl_obj) {
					cur_lvl++;
					cur_lvl = cur_lvl % 5;
					lvl_over = true;
					panel = Crafty.e("2D, Tween, Canvas, lc_panel")
						.attr({alpha: 0.1, x: 80, y: 160, w: 480, h: 320})
						.tween({alpha: 1.0, x: 80, y: 160}, 3000);
					Crafty.viewport.centerOn(panel, 3000);
				}
			}
		}
		else if (lvl_over) {
			resetGame();
			return;
		}
  	});

	player.checkHits("FI").bind("HitOn", function(hitData) {
		grid_items[player_y][player_x].destroy();
		lvl_obj_gained++;
	});
}

function resetGame() {
	Crafty('obj').each(function() { this.destroy(); });
	Crafty.stop(true);
	game_over = false;
	lvl_over = false;
	grid = [];
	grid_items = [];
	player = null;
	player_x = 0;
	player_y = 0;
	vp_dx = 0;
	vp_dy = 0;
	panel = null;
	lvl_obj_gained = 0;
	loadLevel(cur_lvl);
	//loadAssets();
	//buildLevel(lvl_1, lvl_1_items);
	//startGame(lvl_1, lvl_1_items);
}

