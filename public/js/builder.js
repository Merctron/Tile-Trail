var map_sch;
var itm_sch;

var map_ent;
var itm_ent;

var marker;
var marker_x = 0;
var marker_y = 0;

var lvl_len_x = 0;
var lvl_len_y = 0;

var hop = 80;

var level_name = "";
var lvl_obj = 0;

$(document).ready(function() {
	window.alert = function(txt) {
        createCustomAlert(txt);
	}
	$('#alertb').click(function() {
		$('#underlay').removeClass("blur");
		$('#overlay').removeClass("blur");
		$('#alert').css("display", "none");
	});
	init();
	$('#generate').click(function() {
		level_name =  $("#lvl_name").val();
		lvl_obj = parseInt($("#lvl_obj").val());
		
		buildMapSchema($("#hl").val(), $("#vl").val());
		console.log(level_name, lvl_obj);
	});
	$('#reset_b').click(function() {
		reset();
	});
	$('#pubb').click(function() {
		publishMap();
	});
	$('#helpb').click(function() {
		$('#overlay').css("display", "block");
		$('#underlay').addClass("blur");
	});
	$('#contb').click(function() {
		level_name = $("#lvl_name").val();
		lvl_obj = parseInt($("#lvl_obj").val());
		var x = parseInt($("#hl").val());
		var y = parseInt($("#vl").val());
		console.log("level: ", level_name, lvl_obj);

		if (level_name != "" && level_name != null && 
			lvl_obj >= 1 && x >= 2 && y >= 2) {
			$('#underlay').css("display", "block");
			$('#overlay').css("display", "none");
			buildMapSchema($("#hl").val(), $("#vl").val());
		}
		else {
			alert("Sorry. One or more of the fields has inavlid values.");
		}
	});
	$('#backb').click(function() {
		window.location = "/";
	});
	$('#upb').click(function() {
		Crafty.viewport.y += 80;
	});
	$('#leftb').click(function() {
		Crafty.viewport.x += 80;
	});
	$('#rightb').click(function() {
		Crafty.viewport.x -= 80;
	});
	$('#downb').click(function() {
		Crafty.viewport.y -= 80;
	});
	$('#zoomin').click(function() {
		Crafty.viewport.scale(Crafty.viewport._scale + 0.1);
	});
	$('#zoomout').click(function() {
		Crafty.viewport.scale(Crafty.viewport._scale - 0.1);
	});
});

function buildMapSchema(len_x, len_y) {
	reset();
	map_sch = [];
	itm_sch  = [];

	map_ent = [];
	itm_ent = [];

	lvl_len_x = parseInt(len_x);
	lvl_len_y = parseInt(len_y);
	console.log(lvl_len_x);
	console.log(lvl_len_y);

	for (var i = 0; i < len_y; i++) {
		map_sch.push([]);
		itm_sch.push([]);
		map_ent.push([]);
		itm_ent.push([]);

		for (var j = 0; j < len_x; j++) {
			map_sch[i].push(0);
			itm_sch[i].push(0);
			var newTile = null; 

			newTile = Crafty.e("2D, Canvas, tile, SpriteAnimation")
			.attr({x: j*80, y: i*80});

			map_ent[i].push(newTile);
			itm_ent[i].push(null);
		}	
	}

	marker = Crafty.e('2D, DOM, Color').attr({x: 15, y: 15, w: 50, h: 50}).color('black');
	setupMarkupKeys();
}

function setupMarkupKeys() {
	Crafty.bind('KeyDown', function(e) {
			if (e.key === Crafty.keys.LEFT_ARROW) {
				marker.x -= hop;
				marker_x--;
			} else if (e.key === Crafty.keys.RIGHT_ARROW) {
				marker.x += hop;
				marker_x++;
			} else if (e.key === Crafty.keys.UP_ARROW) {
				marker.y -= hop;
				marker_y--;
			} else if (e.key === Crafty.keys.DOWN_ARROW) {
				marker.y += hop;
				marker_y++;
			} else if (e.key === Crafty.keys.B) {
				var newBlock = null; 
				newBlock = Crafty.e("2D, Canvas, ice_block, SpriteAnimation")
				.attr({x: marker_x*hop, y: marker_y*hop});

				map_ent[marker_y][marker_x].destroy();
				map_ent[marker_y][marker_x] = newBlock;

				map_sch[marker_y][marker_x] = 1;
			} else if (e.key === Crafty.keys.F) {
				var newItm = Crafty.e("2D, Canvas, food, SpriteAnimation")
				.attr({x: marker_x*hop, y: marker_y*hop});

				if (itm_ent[marker_y][marker_x]) {
					itm_ent[marker_y][marker_x].destroy();
				}
				itm_ent[marker_y][marker_x] = newItm;
				itm_sch[marker_y][marker_x] = 2;
			} else if (e.key === Crafty.keys.D) {
				var newItm = Crafty.e("2D, Canvas, dest, SpriteAnimation")
				.attr({x: marker_x*hop, y: marker_y*hop});

				if (itm_ent[marker_y][marker_x]) {
					itm_ent[marker_y][marker_x].destroy();
				}
				itm_ent[marker_y][marker_x] = newItm;
				itm_sch[marker_y][marker_x] = 1;
			} else if (e.key === Crafty.keys.T) {
				var newTile = null; 
				newTile = Crafty.e("2D, Canvas, tile, SpriteAnimation")
				.attr({x: marker_x*hop, y: marker_y*hop});

				map_ent[marker_y][marker_x].destroy();
				map_ent[marker_y][marker_x] = newTile;

				map_sch[marker_y][marker_x] = 0;
			}
			console.log(map_sch);
			console.log(itm_sch);
	});
}

function init() {
	Crafty.init(640, 640, document.getElementById('game-screen'));
	Crafty.sprite(80, "assets/tile_sheet.png", {tile:[0,0]});
	Crafty.sprite(80, 80, "assets/block_sheet.png", {ice_block:[0,0]});
	Crafty.sprite(80, 70, "assets/hiker_sheet.png", {player_f:[0,0], player_b:[0,1], player_l:[1,1], player_r:[2,1]});
	Crafty.sprite(80, 80, "assets/item_sheet.png", {dest:[0,0], food:[1,0]});
	Crafty.sprite(480, 320, "assets/game_over_panel.png", {gm_panel:[0,0]});
	Crafty.sprite(480, 320, "assets/lvl_com_panel.png", {lc_panel:[0,0]});
}

function reset() {
	Crafty('obj').each(function() { this.destroy(); });
	map_sch = null;
	itm_sch = null;
	map_ent = null;
	itm_ent = null;
	marker = null;
	marker_x = 0;
	marker_y = 0;
	lvl_len_x = 0;
	lvl_len_y = 0;
	$("#lvl_name").val('');
	$("#lvl_obj").val('');
	$("#hl").val('');
	$("#vl").val('');
}

function publishMap() {
	var final_map = {
		level_name: level_name,
		map_grid: map_sch,
		map_items: itm_sch,
		lvl_obj: lvl_obj,
		len_x: parseInt(lvl_len_x),
		len_y: parseInt(lvl_len_y)
	};

	console.log(JSON.stringify(final_map));

	if (validateMap(final_map)) {
		$.post("/level/save", {level: final_map}, function(result){
			var data = JSON.parse(result);
	    	console.log(data);
	    	if (data.success == true) {
	    		alert("Your map is valid and has been submitted! Your map complexity is: " 
	    			+ data.result.time + ". Share your creation using the link: https://tile-trail.herokuapp.com/" + data.level_name);
	    	}
	    	else {
	    		alert("Sorry this map is invalid or unsolvable.");
	    	}
	    });
	}
}

function validateMap(map) {
	var valid = true;

	if (map.level_name == null || map.map_grid == null || map.map_items == null 
		|| map.lvl_obj == null || map.len_x == null || map.len_y == null) {
		valid = false;
	}	

	if (!valid) {
		alert("Game map submission is not valid.");
	}
	
	return valid;
}

function createCustomAlert(txt) {
	$('#alert-text').text(txt);
	$('#underlay').addClass("blur");
	$('#overlay').addClass("blur");
	$('#alert').css("display", "block");
}