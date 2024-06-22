import fs from "fs";
import { Iteration } from "./iteration";
import { tokenizer } from "./processors/tokenizer";

const data = fs.readFileSync("data/sample", "utf-8");



console.log(tokenizer(data));
while (true);
