#!/bin/bash

tmp=$(mktemp)

node -e 'console.log(require("./cubestate.js").compile(require("fs").readFileSync("'"$1"'").toString()))' > $tmp

./bfi $tmp

rm $tmp
