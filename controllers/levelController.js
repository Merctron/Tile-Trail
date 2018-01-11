var dbUrl 			= process.env.MONGODB_URI || 'mongodb://localhost:27017/tile-trail';
var uuid 			= require('node-uuid');
var mongoClient 	= require('mongodb').MongoClient;
var levelController = module.exports = {};
var timeBound_n  		= 1000000000;
var timeBound  			= 2; 
var depthBound 			= 900;
var scoreBound 			= 201;
var easyScoreBound 		= 75;
var mediumScoreBound 	= 150;

var diffMap = {
	EASY: 	0,
	MEDIUM: 1,
	HARD: 	2
}

// Get a specific level by name
levelController.getLevel = function(req, res) {
	var resp = { success: false };
	mongoClient.connect(dbUrl, function(err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB, cannot get level:', err);
			res.status(500).end(JSON.stringify(resp));
		} 
		else {
			var collection = db.collection("levels");
			collection.findOne({'level_name': req.params.level_name}, function(err, result) {
				if (err || result == null) {
					console.log(err);
					resp.err = 'Level does not exist.';
					res.status(500).end(JSON.stringify(resp));
					db.close();
				}
				else {
					resp.success = true;
					resp.result = result;
					res.end(JSON.stringify(resp));
					db.close();
				}
			});
		}
	});
}

// Get a random level, TODO: fetch random level by difficulty
levelController.getRandomLevel = function(req, res) {
	var resp = { success: false };
	mongoClient.connect(dbUrl, function(err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB, cannot get level:', err);
			res.status(500).end(JSON.stringify(resp));
		} 
		else {
			var collection = db.collection("levels");
			collection.aggregate([{$sample: {size: 1}}], function(err, result) {
				if (err || result == null) {
					console.log(err);
					resp.err = 'Level does not exist.';
					res.status(500).end(JSON.stringify(resp));
					db.close();
				}
				else {
					resp.success = true;
					resp.result = result[0];
					res.end(JSON.stringify(resp));
					db.close();
				}
			});
		}
	});
}

// Get random level by difficulty
levelController.getRandomLevelByDifficulty = function(req, res) {
	var resp = { success: false };
	var data = req.body;

	var lowerBound = 0;
	var upperBound = easyScoreBound;

	if (data.difficulty == diffMap.EASY) {
		lowerBound = 0;
		upperBound = easyScoreBound;
	}
	else if (data.difficulty == diffMap.MEDIUM) {
		lowerBound = easyScoreBound;
		upperBound = mediumScoreBound;
	}
	else if (data.difficulty == diffMap.HARD) {
		lowerBound = mediumScoreBound;
		upperBound = scoreBound;
	}

	mongoClient.connect(dbUrl, function(err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB, cannot get level:', err);
			res.status(500).end(JSON.stringify(resp));
		} 
		else {
			var collection = db.collection("levels");
			collection.find({ 'c_score': { $gte: lowerBound, $lt: upperBound} }, function(err, result) {
				if (err || result == null) {
					resp.err = 'A level with that c_score does not exist.';
					res.status(500).end(JSON.stringify(resp));
					db.close();
				}
				else {
					// Get level at random index from all the levels found
					var randIndex = Math.random() * (result.length - 0) + 0;
					resp.success = true;
					resp.result = result[randIndex];
					res.end(JSON.stringify(resp));
					db.close();
				}
			});
		}
	});
}

// Saves a submitted level
levelController.saveLevel = function(req, res) {
	var resp = { success: false };
	var data = req.body;

	// First validate request object
	if (!levelController.validateSaveLevelRequest(data)) {
		res.status(200).end(JSON.stringify(resp));
		return;
	}

	// Add UUID to create unique level name
	data.level.level_name += "--" + uuid.v1();

	// Check if level is solvable
	if (levelController.validateLevel(data.level)) {
		mongoClient.connect(dbUrl, function(err, db) {
			if (err) {
				console.log('Unable to connect to the mongoDB server, level will not be created:', err);	
				res.status(500).end(JSON.stringify(resp));
			} 
			else {
				var collection = db.collection("levels");
				collection.insert(data.level, function (err, result) {
					if (err) {
						console.log(err);
						res.status(500).end(JSON.stringify(resp));
					} else {
						console.log('Level saved:', result.length, result);
						resp.success = true;
						resp.result = data.level;
						res.status(200).end(JSON.stringify(resp));
					}
					db.close();
				});
			}	
		});
	}
	else {
		res.err = "The level submitted is invalid or unsolvable";
		res.status(200).end(JSON.stringify(resp));
	}
}

// Deprecated: save levels submitted publicly
levelController.saveSubmittedLevel = function(req, res) {
	console.log(req.body);
	var resp = {
		success: false
	};
	mongoClient.connect(dbUrl, function(err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server, new collection will not be created:', err);	
			res.status(500).end(JSON.stringify(resp));
		} 
		else {
			var collection = db.collection("submitted-levels");
			collection.insert(req.body.level, function (err, result) {
				if (err) {
					console.log(err);
					res.status(500).end(JSON.stringify(resp));
				} else {
					console.log('Inserted %d documents into the "posts" collection. The documents inserted with "_id" are:', result.length, result);
					resp.success = true;
					resp.result = result;
					res.status(200).end(JSON.stringify(resp));
				}
				db.close();
			});
		}	
	});
}

// Gets total number of levels available
levelController.getLevelStats = function(req, res) {
	var resp = {
		success: false
	};
	mongoClient.connect(dbUrl, function(err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server, new collection will not be created:', err);	
			res.status(500).end(JSON.stringify(resp));
		} 
		else {
			var collection = db.collection("levels");
			collection.count({}, function (error, count) {
			 	if (error) {
			 		resp.err = error;
					res.status(500).end(JSON.stringify(resp));
			 	}
			 	else {
			 		resp.success = true;
			 		resp.total_lvls = count;
			 		res.status(200).end(JSON.stringify(resp));
			 	}
			 	db.close();
			});
		}	
	});
};

/*
Map Grid Schema Definition:

level_name: str,
map_grid  : 2D array; 0 - normal tiles; 1 - ice block,
map_items : 2D array; 0 - no item; 1 - dest; 2 - food,
lvl_obj	  : int; amount of food to be consumed,
len_x	  : int; horizontal length,
len_y	  : int; vertical length

TODO:
1. Optimize with memoization/dynamic programming - Space optimized
2. record time/space complexity and auto generate complexity score - Done
*/

// Validates request object structure
levelController.validateSaveLevelRequest = function(data) {
	if (data.level) {
		var level = data.level;

		// Check name and level constants
		if (level.level_name == "" || level.level_name == null || 
	 		level.lvl_obj <= 0 || level.len_x <= 1 || 
	 		level.len_y <= 1) 
		{
			return false;
		}

		// Check map grid and items existence
		if (!level.map_grid || !level.map_items) {
			return false;
		}

		// Check that level constants match up with the grid
		if (level.map_grid.length != level.len_y || 
			level.map_grid[0].length != level.len_x) 
		{
			return false;
		}

		// All checks have been completed.
		return true;
	}

	return false;
}

// Recursive validation call
levelController.validateLevel = function(level) {
	// Start at position [0,0] and travel in every direction
	// Collect food along the way

	// Start profiling
	var time = process.hrtime();

	// Start map validation
	var depth = levelController.isLevelValid(0, 0, 0, 
		level.lvl_obj, 
		level.map_grid, 
		level.map_items, 
		level.map_grid, 0);
	if (depth != 0) 
	{	
		// Stop profiling and record the time taken
		var diff = process.hrtime(time);
		level.time = diff;
		level.depth = depth;
		level.c_score =  computeComplexityScore(diff, depth);
		if (level.c_score <= scoreBound) {
			return true;
		}
		else {
			return false;
		}
	}

	return false;
};

// y_pos is vertical(row) position.
// x_pos is horizontal(col) position.
// map_mem stores a memoized map keeping track of paths previously traversed.
// Space complexity is kept constant because a single instance of the map is shared between recursive calls.
levelController.isLevelValid = function(x_pos, y_pos, food_col, food_obj, map_grid, map_items, map_mem, depth) {
	// Check if x/y positions are out of bounds
	if (x_pos < 0 || x_pos >= map_grid[0].length) return 0;
	if (y_pos < 0 || y_pos >= map_grid.length) return 0;

	// Check current tile type, if it is an ice block there is no path
	if (map_grid[y_pos][x_pos] == 1) {
		return 0;
	}

	// Check current tile item, if dest, check if food objective has been met
	if (map_items[y_pos][x_pos] == 1) {
		if (food_col >= food_obj) {
			return depth;
		}
		else {
			return 0;
		}
	}

	if (map_items[y_pos][x_pos] == 2) {
		food_col++;
	} 

	// Record current tile inaccessible
	map_grid[y_pos][x_pos] = 1;
	

	// Check path in each direction
	depth_r = levelController.isLevelValid(x_pos + 1, y_pos, 
		food_col, food_obj, map_grid, map_items, map_mem, depth + 1);
	if (depth_r != 0) return depth_r;
	depth_l = levelController.isLevelValid(x_pos - 1, y_pos, 
		food_col, food_obj, map_grid, map_items, map_mem, depth + 1);
	if (depth_l != 0) return depth_l;
	depth_u = levelController.isLevelValid(x_pos, y_pos + 1, 
		food_col, food_obj, map_grid, map_items, map_mem, depth + 1);
	if (depth_u != 0) return depth_u;
	depth_d = levelController.isLevelValid(x_pos, y_pos - 1, 
		food_col, food_obj, map_grid, map_items, map_mem, depth + 1);
	if (depth_d != 0) return depth_d;

	// Reset current tile while moving up the recursion stack
	map_grid[y_pos][x_pos] = 0;

	return 0;
}

levelController.computeComplexityScore = function(diff, depth) {
	var total_time = diff[0] + (diff[1] / timeBound_n);
	var score = (((depth / depthBound) + (total_time / timeBound)) / 2) * 100;
	return score;
}

// Profile grid search solve time for a given level
levelController.profileLevel = function(req, res) {
	console.log(req.body);
	var resp = {
		success: false
	};

	var time = process.hrtime();
	var success = levelController.validateLevel(req.body.level);
	var diff = process.hrtime(time);
	resp.time = diff;
	resp.success = success;
	res.end(JSON.stringify(resp));
}
