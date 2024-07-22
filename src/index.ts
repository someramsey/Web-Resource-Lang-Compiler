import fs from "fs";
import { parser } from "./processors/parser";
import { tokenizer } from "./processors/tokenizer";

const data = fs.readFileSync("data/.sample", "utf-8");

const tokenizationResult = tokenizer(data);
console.log(tokenizationResult);
const parserResult = parser(tokenizationResult.output);
console.log(parserResult);

while (true);
