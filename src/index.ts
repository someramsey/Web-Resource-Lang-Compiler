import fs from "fs";

const data = fs.readFileSync("data/sample", "utf-8");

const iterator = data[Symbol.iterator]();


let next = iterator.next();

while(next.done) {
    
    next = iterator.next();
}


