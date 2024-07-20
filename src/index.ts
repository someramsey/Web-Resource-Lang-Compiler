import fs from "fs";
import { tokenizer } from "./processors/tokenizer";
import { transformer } from "./processors/transformer";
import { parser } from "./processors/parser";

const data = fs.readFileSync("data/.assignment", "utf-8");

const tokenizationResult = tokenizer(data);
console.log(tokenizationResult);
const transformerResult = transformer(tokenizationResult.output);
console.log(transformerResult);
const parserResult = parser(transformerResult.output);
console.log(parserResult);

while (true);
