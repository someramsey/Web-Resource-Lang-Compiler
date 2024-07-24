import fs from "fs";
import { compile } from "./core/compiler";
import { Instruction } from "./instruction";
import { UnresolvedExpression } from "./expression";

const data = fs.readFileSync("data/.sample", "utf-8");
const result = compile(data);

if(result.errors.length > 0) {
    console.log("Errors:");
    console.log(result.errors);
    process.exit(1);
}

result.output.forEach((instruction: Instruction<UnresolvedExpression>) => {
    console.log(instruction);
});