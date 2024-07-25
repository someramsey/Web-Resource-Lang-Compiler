import fs from "fs";
import { compile } from "./core/compiler";

const data = fs.readFileSync("data/.sample", "utf-8");
const result = compile(data);

console.log(result);
while (true);