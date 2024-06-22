import fs from "fs";
import { Iteration } from "./iteration";
import { tokenizer } from "./processors/tokenizer";
import { transformer } from "./processors/transformer";

const data = fs.readFileSync("data/.sample", "utf-8");

const tokenizationResult = tokenizer(data);
transformer(tokenizationResult.output);

while (true);
