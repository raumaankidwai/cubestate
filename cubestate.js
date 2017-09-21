const Cube = require("./cube.js");

function compile (code) {
	var cube = new Cube();
	var codestack = "";
	
	var lastFaceChars = 9;
	
	code = code.split("\n");
	
	while (!code[code.length - 1].length) {
		code = code.slice(0, code.length - 1);
	}
	
	if (+code[code.length - 1]) {
		lastFaceChars = +code[code.length - 1];
		code = code.slice(0, code.length - 1);
	}
	
	for (var i = 0; i < code.length; i ++) {
		var line = code[i].split(" ");
		var moves = line.slice();
		
		var stdout = false;
		var stdin = false;
		
		switch (line[line.length - 1][0]) {
			case ".":
				stdout = true;
				moves = moves.slice(0, moves.length - 1);
				break;
			case ",":
				stdin = true;
				moves = moves.slice(0, moves.length - 1);
		}
		
		cube.apply(moves.join(" "));
		
		codestack += cube.state.slice(0, (stdout || stdin) ? +line[line.length - 1][1] : (i == code.length - 1) ? lastFaceChars : 9).map((e) => ["+", "[", ">", "]", "<", "-"][e]).join("") + (stdout ? "." : stdin ? "," : "");
	}
	
	return codestack;
}

function chunkBF (code) {
	var chunked = [""];
	
	for (var i = 0; i < code.length; i ++) {
		if (chunked[chunked.length - 1].length == 9) {
			chunked.push("");
		}
		
		chunked[chunked.length - 1] += code[i];
		
		if (code[i] == "." || code[i] == ",") {
			chunked.push("");
		}
	}
	
	while (!chunked[chunked.length - 1].length) {
		chunked = chunked.slice(0, chunked.length - 1);
	}
	
	return chunked;
}

function generateCS (code) {
	var chunked = chunkBF(code.replace(/[^+\-><[\].,]/g, "")).map((e) => e
		.replace(/\+/g, "0")
		.replace(/\[/g, "1")
		.replace(/>/g, "2")
		.replace(/]/g, "3")
		.replace(/</g, "4")
		.replace(/-/g, "5"));
	var cube = new Cube();
	
	var lfs = 0;
	
	var nodes = [0];
	var start = new Date().getTime();
	
	for (var i = 0; i < chunked.length; i ++) {
		var chunk = chunked[i];
		var appendix = "";
		
		if (isNaN(+chunk[chunk.length - 1])) {
			appendix = " " + chunk[chunk.length - 1] + (chunk.length - 1);
			chunk = chunk.slice(0, chunk.length - 1);
		} else if (i == chunked.length - 1) {
			lfs = chunk.length;
		}
		
		chunked[i] = cube.iterativeDeepening(chunk, nodes).join(" ") + appendix;
		
		if (chunked[i][0] == " ") {
			chunked[i] = chunked[i].slice(1);
		}
	}
	
	if (lfs) {
		chunked.push("" + lfs);
	}
	
	if (Cube.DEBUG) {
		var end = (new Date().getTime() - start) / 1000;
		console.log("Completed in " + end + " seconds and searched " + nodes[0] + " nodes at " + (nodes[0] / end) + " nodes per second.");
	}
	
	return chunked.join("\n")
        .replace(/F S(\s|$)/g, "f$1")
        .replace(/F' S'/g, "f'")
        .replace(/B S'/g, "b")
        .replace(/B' S(\s|$)/g, "b'$1")
        .replace(/L M(\s|$)/g, "l$1")
        .replace(/L' M'/g, "l'")
        .replace(/R M'/g, "r")
        .replace(/R' M(\s|$)/g, "r'$1")
        .replace(/D E(\s|$)/g, "d$1")
        .replace(/D' E'/g, "d'")
        .replace(/U E'/g, "u")
        .replace(/U' E(\s|$)/g, "u'$1")
        .replace(/F2 S2/g, "f2")
        .replace(/B2 S2/g, "b2")
        .replace(/L2 M2/g, "l2")
        .replace(/R2 M2/g, "r2")
        .replace(/D2 E2/g, "d2")
        .replace(/U2 E2/g, "u2")
        .replace(/S F(\s|$)/g, "f$1")
        .replace(/S' F'/g, "f'")
        .replace(/S' B(\s|$)/g, "b")
        .replace(/S B'/g, "b'")
        .replace(/M L(\s|$)/g, "l$1")
        .replace(/M' L'/g, "l'")
        .replace(/M' R(\s|$)/g, "r$1")
        .replace(/M R'/g, "r'")
        .replace(/E D(\s|$)/g, "d$1")
        .replace(/E' D'/g, "d'")
        .replace(/E' U(\s|$)/g, "u$1")
        .replace(/E U'/g, "u'")
        .replace(/S2 F2/g, "f2")
        .replace(/S2 B2/g, "b2")
        .replace(/M2 L2/g, "l2")
        .replace(/M2 R2/g, "r2")
        .replace(/E2 D2/g, "d2")
        .replace(/E2 U2/g, "u2");
}

module.exports = {
	chunkBF: chunkBF,
	compile: compile,
	generateCS: generateCS
};
