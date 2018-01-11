var mongoClient = require('mongodb').MongoClient;
var dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/tile-trail';

var KEYS = {
    KEY_SPACE   : 32,
    KEY_LEFT    : 37,
    KEY_UP      : 38,
    KEY_RIGHT   : 39,
    KEY_DOWN    : 40
};

var LVL_CONSTANTS = {
    TILE         : 0,
    BLOCK        : 1,
    CRACKED_TILE : 2,
    FOOD         : 3,
    DEST         : 4
};

var gameController = module.exports = {};

gameController.processMove = function(move) {
    var lvl        = move.lvl;        // Original lvl configuration
    var lvl_items  = move.lvl_items;  // Original lvl items configuration
    var lvl_obj    = move.lvl_obj;    // Food collection objective
    var grid       = move.grid;       // Current lvl state
    var grid_items = move.grid_items; // Current lvl items state
    var lvl_obj_cl = move.lvl_obj_cl; // Food collected
    var player_x   = move.player_x;
    var player_y   = move.player_y;
    var vp_dx      = move.vp_dx;
    var vp_dy      = move.vp_dy;
    var vpo_dx     = move.vpo_dx;
    var vpo_dy     = move.vpo_dy;
    var game_over  = false;
    var lvl_comp   = false;
    
    var nxt_mv = {
        x: 0,
        y: 0,
        next_hop_x: 0,
        next_hop_y: 0
    };

    switch(move.key) {
        case KEYS.KEY_SPACE:
            break;
        case KEYS.KEY_LEFT:
            nxt_mv.x = player_x - 1;
            nxt_mv.y = player_y;
            nxt_mv.next_hop_x = -1;
            break;
        case KEYS.KEY_RIGHT:
            nxt_mv.x = player_x + 1;
            nxt_mv.y = player_y;
            nxt_mv.next_hop_x = 1;
            break;
        case KEYS.KEY_UP:
            nxt_mv.x = player_x;
            nxt_mv.y = player_y - 1;
            nxt_mv.next_hop_y = -1;
            break;
        case KEYS.KEY_DOWN:
            nxt_mv.x = player_x;
            nxt_mv.y = player_y + 1;
            nxt_mv.next_hop_y = 1;
            break;
    }

    var grid_y = grid.length;
    var grid_x = grid[0].length;

    if ((nxt_mv.x >= 0 && nxt_mv.x <= grid_x - 1) && 
        (nxt_mv.y >= 0 && nxt_mv.y <= grid_y - 1)) {
        if (lvl[nxt_mv.y][nxt_mv.x] == LVL_CONSTANTS.TILE) {
            if (grid[nxt_mv.y][nxt_mv.x] == LVL_CONSTANTS.CRACKED_TILE) {
                // Update player position
                player_x = nxt_mv.x;
                player_y = nxt_mv.y;
                game_over = true;
            }
            else {
                // Record previous tile as broken
                grid[player_y][player_x] = LVL_CONSTANTS.CRACKED_TILE;

                // Update player position
                player_x = nxt_mv.x;
                player_y = nxt_mv.y;

                // Update viewport
                if (nxt_mv.next_hop_x > 0 && vpo_dx > 0 && player_x >= 6) {
                    vp_dx++;
                    vpo_dx--;
                }
                else if (nxt_mv.next_hop_x < 0 && vp_dx > 0) {
                    vp_dx--;
                    vpo_dx++;
                }

                if (nxt_mv.next_hop_y > 0 && vpo_dy > 0 && player_y >= 6) {
                    vp_dy++;
                    vpo_dy--;
                }
                else if (nxt_mv.next_hop_y < 0 && vp_dy > 0) {
                    vp_dy--;
                    vpo_dy++;
                }


                // If player is at dest -> lvl com
                if (grid_items[player_y][player_x] == LVL_CONSTANTS.DEST) {
                    if (lvl_obj_cl >= lvl_obj) {
                        lvl_comp = true;
                    }
                }

                // If player is at item -> lvl obj++
                if (grid_items[player_y][player_x] == LVL_CONSTANTS.FOOD) {
                    lvl_obj_cl++;
                    grid_items[player_y][player_x] = LVL_CONSTANTS.CRACKED_TILE;
                }
            }
        }
    }

    

    var processedState = {
        lvl        : lvl,
        lvl_items  : lvl_items,
        lvl_obj    : lvl_obj,
        grid       : grid,
        grid_items : grid_items,
        lvl_obj_cl : lvl_obj_cl,
        player_x   : player_x,
        player_y   : player_y,
        game_over  : game_over, 
        lvl_comp   : lvl_comp,
        vp_dx      : vp_dx,
        vp_dy      : vp_dy,
        vpo_dx     : vpo_dx,
        vpo_dy     : vpo_dy 
    };

    return processedState;
};