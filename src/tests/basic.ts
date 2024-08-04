import { compile } from "../core/compiler";
import { logResult, readFile } from "./_utility";

const data = readFile(process.argv[2]);
const result = compile(data);

logResult(result);

debugger;