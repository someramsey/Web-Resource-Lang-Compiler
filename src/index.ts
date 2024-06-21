import fs from "fs";
import { Iteration } from "./iteration";
import { lexer } from "./processors/lexer";

const data = fs.readFileSync("data/sample", "utf-8");



lexer(data);
