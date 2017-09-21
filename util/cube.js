const DEBUG = true;
const MAX_SEARCH_DEPTH = 100;
Cube.DEBUG = DEBUG;

function Cube () {
	// U is 0
	// L is 1
	// F is 2
	// R is 3
	// B is 4
	// D is 5
	this.state = Uint8Array.from([
		0, 0, 0, 0, 0, 0, 0, 0, 0,
		1, 1, 1, 1, 1, 1, 1, 1, 1,
		2, 2, 2, 2, 2, 2, 2, 2, 2,
		3, 3, 3, 3, 3, 3, 3, 3, 3,
		4, 4, 4, 4, 4, 4, 4, 4, 4,
		5, 5, 5, 5, 5, 5, 5, 5, 5,
		0, 0, 0, 0, 0, 0, 0, 0, 0, // preallocated swap space for later (this was what yielded 400nps -> 800nps)
		1, 1, 1, 1, 1, 1, 1, 1, 1,
		2, 2, 2, 2, 2, 2, 2, 2, 2,
		3, 3, 3, 3, 3, 3, 3, 3, 3,
		4, 4, 4, 4, 4, 4, 4, 4, 4,
		5, 5, 5, 5, 5, 5, 5, 5, 5
	]);
	this.statePtr = 0|0;
	this.stateFlipper = 54|0;
}

// For each value in the move array, newstate[index_of_value] = oldstate[value]
// For inverse moves, newstate[value] = oldstate[index_of_value]
// Copying cubid's method: All moves can be represented in terms of U, x, and y
Cube.moves = {
	"U": [
		6, 3, 0, 7, 4, 1, 8, 5, 2,
		18, 19, 20, 12, 13, 14, 15, 16, 17,
		27, 28, 29, 21, 22, 23, 24, 25, 26,
		36, 37, 38, 30, 31, 32, 33, 34, 35,
		9, 10, 11, 39, 40, 41, 42, 43, 44,
		45, 46, 47, 48, 49, 50, 51, 52, 53
	],
	"x": [
		18, 19, 20, 21, 22, 23, 24, 25, 26,
		11, 14, 17, 10, 13, 16, 9, 12, 15,
		45, 46, 47, 48, 49, 50, 51, 52, 53, 
		33, 30, 27, 34, 31, 28, 35, 32, 29,
		8, 7, 6, 5, 4, 3, 2, 1, 0, 
		44, 43, 42, 41, 40, 39, 38, 37, 36
	],
	"y": [
		6, 3, 0, 7, 4, 1, 8, 5, 2,
		18, 19, 20, 21, 22, 23, 24, 25, 26,
		27, 28, 29, 30, 31, 32, 33, 34, 35,
		36, 37, 38, 39, 40, 41, 42, 43, 44,
		9, 10, 11, 12, 13, 14, 15, 16, 17,
		47, 50, 53, 46, 49, 52, 45, 48, 51,
	],
	"F": "x U x'",
	"R": "y F y'",
	"L": "y' F y",
	"D": "x F x'",
	"B": "y R y'",
	"z": "x y x'",
	"f": "B z",
	"r": "L x",
	"u": "D y",
	"l": "R x'",
	"d": "U y'",
	"b": "F z'",
	"M": "l L'",
	"E": "d D'",
	"S": "f F'",
	"U2": "U U",
	"x2": "x x",
	"y2": "y y",
	"F2": "F F",
	"R2": "R R",
	"L2": "L L",
	"B2": "B B",
	"D2": "D D",
	"z2": "z z",
	"f2": "f f",
	"r2": "r r",
	"u2": "u u",
	"l2": "l l",
	"d2": "d d",
	"b2": "b b",
	"M2": "M M",
	"E2": "E E",
	"S2": "S S"
};

Cube.axes = {
	"U": 0,
	"x": 1,
	"y": 0,
	"F": 2,
	"R": 1,
	"L": 1,
	"D": 0,
	"B": 2,
	"z": 2,
	"f": 2,
	"r": 1,
	"u": 0,
	"l": 1,
	"d": 0,
	"b": 2,
	"M": 1,
	"E": 0,
	"S": 2,
	"U2": 0,
	"x2": 1,
	"y2": 0,
	"F2": 2,
	"R2": 1,
	"L2": 1,
	"D2": 0,
	"B2": 2,
	"z2": 2,
	"f2": 2,
	"r2": 1,
	"u2": 0,
	"l2": 1,
	"d2": 0,
	"b2": 2,
	"M2": 1,
	"E2": 0,
	"S2": 2
};

Cube.moveGroup = Object.keys(Cube.moves);
Cube.moveGroup = Cube.moveGroup.concat(Cube.moveGroup.map(
  (e) => (e.length == 1) ? e + "'" : ""
).filter((e) => (e !== "")));

Cube.prototype.applyNUI = function (moves, isInverse) {
	moves = moves.split(/\s+/);
	isInverse = isInverse || false;
	
	if (isInverse) {
		moves.reverse();
	}
	
	for (var i = 0; i < moves.length; i ++) {
		var move = moves[i];

		if (!move) {
			continue;
		}
		
		switch (move[move.length - 1]) {
			case "'":
				this.applyMoveNUI(move[0], !isInverse);
			break; default:
				this.applyMoveNUI(move, isInverse);
		}
	}
};

Cube.prototype.applyMoveNUI = function (raw, isInverse) {
	var move = Cube.moves[raw];

	isInverse = isInverse || false;
	
	if (typeof move == "string") {
		return this.apply(move, isInverse);
	}
	
	var newState = this.state.slice();
	
	for (var i = 0; i < move.length; i ++) {
		if (isInverse) {
			newState[move[i]] = this.state[i];
		} else {
			newState[i] = this.state[move[i]];
		}
	}
	
	this.state = newState;
};

Cube.prototype.applyMove = function (move) {
  move = move << 6;
	
	var oldPtr = this.statePtr|0;
	this.statePtr ^= this.stateFlipper;
	
	var i = 54; while (i--) {
	  this.state[this.statePtr + i] = this.state[oldPtr + Cube.moves[move | i]];
	}
};

Cube.prototype.applyMove = function (move) {
  move = move << 6;
	
	var oldPtr = this.statePtr|0;
	this.statePtr ^= this.stateFlipper;
	
	var i = 54; while (i--) {
	  this.state[this.statePtr + i] = this.state[oldPtr + Cube.moves[move | i]];
	}
};

Cube.prototype.applyMoveInverse = function (move) { // splitting into 2 fns was consistently faster
  move = move << 6;
	
	var oldPtr = this.statePtr|0;
	this.statePtr ^= this.stateFlipper;
	
	var i = 54; while (i--) {
	  this.state[this.statePtr + Cube.moves[move | i]] = this.state[oldPtr + i];
	}
};

Cube.prototype.bruteForce = function (goal, moveGroup, maxDepth, depth, accu, nodes) {
	// compute heuristic
	var heuristic = 0|0;
	var i = goal.length|0, j = (goal.length + this.statePtr)|0;
	
	while (i--) {
	  j--;
		if (i % 3) {
			heuristic += (this.state[j] != goal[i]) | (this.state[j - 1] != goal[i - 1]);
		}
		if (i - 2) {
			heuristic += (this.state[j] != goal[i]) | (this.state[j - 3] != goal[i - 3]);
		}
	}
	heuristic = (heuristic * 3) >> 3; // int multiply by 3/8
	if (depth + heuristic > maxDepth) {
	  return false;
	}

	if (depth == maxDepth) {
	  var i = goal.length; while (i--) { // always stops checking asap
	    if (goal[i] != this.state[this.statePtr + i]) {
	      return false;
	    }
	  }
	  return accu;
	}
	
	outerLoop:
	for (var i = 0; i < moveGroup.length; i ++) {
		var move = moveGroup[i];
    for (var j = accu[0]; (j > 0) && (Cube.axes[move] == Cube.axes[accu[j]]); j --) {
			if ((Cube.types[move] == Cube.types[accu[j]]) || (moveGroup.indexOf(accu[j]) >= i))
				continue outerLoop;
		}
		
		accu[++ accu[0]] = move;
		this.applyMove(move);
		
		var attempt = this.bruteForce(goal, moveGroup, maxDepth, depth + 1, accu, nodes);
		
		if (attempt)
			return accu;
		
		this.applyMoveInverse(move);
		-- accu[0];
		
		if (DEBUG) {
			nodes[0] ++;
		}
	}

	return false;
};

Cube.prototype.iterativeDeepening = function (goal, nodes) {
  nodes = nodes || [0];
	var moveGroup = [
		"U", "L", "F", "R", "B", "D", "M", "E", "S",
		"U'", "L'", "F'", "R'", "B'", "D'", "M'", "E'", "S'",
		"U2", "L2", "F2", "R2", "B2", "D2", "M2", "E2", "S2"
	].map((e) => Cube.moveGroup.indexOf(e));
	
  var goalArray = goal.split("").map((e) => e|0);
  var accu = new Uint8Array(MAX_SEARCH_DEPTH); // [length, item1, item2, ..]
	
	for (var i = 0; true; i ++) {
		if (DEBUG) {
			console.log("Searching depth " + i);
		}
		
		var searchResult = this.bruteForce(goalArray, moveGroup, i, 0, accu, nodes);

		if (searchResult) {
		  var s = [];
		  for (var i = 1; i < accu[0] + 1; i ++) {
		    s.push(Cube.moveGroup[accu[i]]);
		  }
		  return s;
		}
	}
	
	return false;
};

(function () { // precompile all index maps (including inverses) using .*NUI methods
	for (var i = 0; i < Cube.moveGroup.length; i ++) {
	  var move = Cube.moveGroup[i];
	  if (!(move in Cube.moves)) {
	    Cube.moves[move] = move; // inverses
	  }
		if (typeof Cube.moves[move] == "string") {
			var hack = new Cube();
      hack.state = hack.state.map((e, i) => i);

			hack.applyNUI(Cube.moves[move]);
			Cube.moves[move] = hack.state;
		}
	}
})();

(function () { // convert Cube.moves from {} to Uint8Array
	var uimoves = new Uint8Array(Cube.moveGroup.length << 6);
	
	for (var i = 0; i < Cube.moveGroup.length; i ++) {
		for (var j = 0; j < 54; j ++) {
			uimoves[(i << 6) | j] = Cube.moves[Cube.moveGroup[i]][j];
		}
	}
	
	Cube.moves = uimoves;
})();

(function () { // convert Cube.axes from {} to Uint8Array, and construct Cube.types
	var uiaxes = Uint8Array.from(Cube.moveGroup.map((e) => Cube.axes[e[0]]));
	var uitypes = Uint8Array.from(Cube.moveGroup.map((e) => Cube.moveGroup.indexOf(e[0])));
	
	Cube.axes = uiaxes;
	Cube.types = uitypes;
})();

module.exports = Cube;
