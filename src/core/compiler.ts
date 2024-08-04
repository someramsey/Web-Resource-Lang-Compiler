import { Definition } from "../definition";
import { ProcessorResult } from "./processor";
import { parse } from "./processors/parser";
import { resolve } from "./processors/resolver";
import { tokenize } from "./processors/tokenizer";

export type CompilationResult = ProcessorResult<Definition[]>;

export function compile(data: string): CompilationResult {
    const tokenizationResult = tokenize(data);
    const parserResult = parse(tokenizationResult.output);
    const resolverResult = resolve(parserResult.output);

    const compilationErrors = [
        ...tokenizationResult.errors,
        ...parserResult.errors,
        ...resolverResult.errors
    ];

    return {
        output: resolverResult.output,
        errors: compilationErrors
    };
}
