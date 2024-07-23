import { UnresolvedExpression } from "./expression";
import { Instruction } from "./instruction";
import { ProcessorResult } from "./processor";
import { parse } from "./processors/parser";
import { tokenize } from "./processors/tokenizer";

export function compile(data: string): ProcessorResult<Instruction<UnresolvedExpression>[]> {
    const tokenizationResult = tokenize(data);
    const parserResult = parse(tokenizationResult.output);

    const compilationErrors = [
        ...tokenizationResult.errors,
        ...parserResult.errors
    ];

    return {
        output: parserResult.output, 
        errors: compilationErrors
    };
}
