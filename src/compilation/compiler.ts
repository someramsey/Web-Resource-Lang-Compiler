import { Instruction } from "./instruction";
import { ProcessorResult } from "./processor";
import { parser } from "./processors/parser";
import { tokenizer } from "./processors/tokenizer";

export function compile(data: string): ProcessorResult<Instruction[]> {
    const tokenizationResult = tokenizer(data);
    const parserResult = parser(tokenizationResult.output);

    const compilationErrors = [
        ...tokenizationResult.errors,
        ...parserResult.errors
    ];

    return {
        output: parserResult.output, 
        errors: compilationErrors
    };
}
