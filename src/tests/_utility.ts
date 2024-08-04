import fs from "fs";
import { CompilationResult } from "../core/compiler";

const basePath = "./examples";

export function readFile(file: string): string {
    if (!file) {
        console.log("No file provided");
        process.exit(1);
    }

    const path = `${basePath}/${file}`;

    if (!fs.existsSync(path)) {
        console.log(`File not found, available files: [${fs.readdirSync(basePath).join(", ")}]`);
        process.exit(1);
    }

    return fs.readFileSync(path, "utf-8");
}

export function logResult(result: CompilationResult) {
    console.log("Compilation Output: " + JSON.stringify(result.output, null, 2));

    if (result.errors.length > 0) {
        console.error(`Encountered errors during compilation: ${JSON.stringify(result.errors.map(err => ({
            message: err.message,
            range: err.range
        })), null, 2)}`);
    }
}