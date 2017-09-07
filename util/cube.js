function Cube () {
	// U is 0
	// L is 1
	// F is 2
	// R is 3
	// B is 4
	// D is 5
	this.state = [
		0, 0, 0, 0, 0, 0, 0, 0, 0,
		1, 1, 1, 1, 1, 1, 1, 1, 1,
		2, 2, 2, 2, 2, 2, 2, 2, 2,
		3, 3, 3, 3, 3, 3, 3, 3, 3,
		4, 4, 4, 4, 4, 4, 4, 4, 4,
		5, 5, 5, 5, 5, 5, 5, 5, 5
	];
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
	"S": "f F'"
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
	"S": 2
};

Cube.prototype.apply = function (moves, isInverse) {
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
				this.applyMove(move[0], !isInverse);
			break; case "2":
				this.applyMove(move[0]);
				this.applyMove(move[0]);
			break; default:
				this.applyMove(move, isInverse);
		}
	}
};

Cube.prototype.applyMove = function (raw, isInverse) {
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

// epic
// I have the vaguest idea how this works, but I was told to do some modifications to fix some weird stuff so yeah
Cube.prototype.bruteForce = function (goal, moveGroup, maxDepth, depth, accu) {
	maxDepth = maxDepth || 0;
	depth = depth || 0;
	accu = accu || [];

	var currentState = this.state.join("");

	var lowerBound = 0;
	for (var i = 0; i < goal.length; i ++) {
		if (currentState[i] != goal[i]) {
			lowerBound ++;
		}
	}
	if ((depth + lowerBound/3) > maxDepth) {
		return false;
	}

	if (depth == maxDepth) {
		if (currentState.substring(0, goal.length) == goal) {
			return accu;
		} else {
			return false;
		}
	}

	outerLoop:
	for (var i = 0; i < moveGroup.length; i ++) {
		var move = moveGroup[i];
        	for (var j = accu.length - 1; (j >= 0) && (Cube.axes[move[0]] == Cube.axes[accu[j][0]]); j --) {
			if (move[0] == accu[j][0]) ||
			(moveGroup.indexOf(accu[j]) >= i))
			continue outerLoop;
		}
		
		accu.push(move);
		this.apply(move);
		
		var attempt = this.bruteForce(goal, moveGroup, maxDepth, depth + 1, accu);
		
		if (attempt)
			return accu;
		
		this.apply(move, true);
		accu.pop(move);
	}

	return false;
};

Cube.prototype.iterativeDeepening = function (goal) {
	var moveGroup = [
		"U", "L", "F", "R", "B", "D", "M", "E", "S",
		"U'", "L'", "F'", "R'", "B'", "D'", "M'", "E'", "S'",
		"U2", "L2", "F2", "R2", "B2", "D2", "M2", "E2", "S2"
	];
	
	var i = -1;
	
	while (true) {
		console.log("Searching depth " + ++i);
		var accu = [];

		var searchResult = this.bruteForce(goal, moveGroup, i, 0, accu);

		if (searchResult) {
			return accu;
		}
	}

	return false;
};

(function () {
	var keys = Object.keys(Cube.moves);
	
	for (var i = 0; i < keys.length; i ++) {
		if (typeof Cube.moves[keys[i]] == "string") {
			var hack = new Cube();

			for (var j = 0; j < hack.state.length; j ++) {
				hack.state[j] = j;
			}

			hack.apply(Cube.moves[keys[i]]);
			Cube.moves[keys[i]] = hack.state;
		}
	}
})();

module.exports = Cube;
