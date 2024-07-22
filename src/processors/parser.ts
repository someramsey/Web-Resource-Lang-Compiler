import { Expression } from "../expression";
import { Iteration } from "../iteration";
import { ProcessorError, ProcessorResult } from "../processor";
import { Token } from "./tokenizer";
import { Node, transformer } from "./transformer";

type Assignment = {
    identifier: string;
    expression: Expression;
};

type Instruction = Assignment;

export function parser(tokens: Token[]): ProcessorResult<Instruction[]> {
    const iteration = new Iteration(tokens);

    const output: Instruction[] = [];
    const errors: ProcessorError[] = [];

    const expectIdentifier = (): string => {
        if (iteration.current.kind !== "none") {
            throw new ProcessorError("Expected an identifier", iteration.current.range);
        }

        return iteration.current.value;
    }

    const expectSymbol = (value: string) => {
        if (iteration.current.kind !== "symbol" || iteration.current.value !== value) {
            throw new ProcessorError(`Expected '${value}'`, iteration.current.range);
        }
    }

    const next = () => {
        if (!iteration.next()) {
            throw new ProcessorError("Unexpected end of file", iteration.last.range);
        }
    }

    const assignment = (): Assignment => {
        next();
        const identifier = expectIdentifier();

        next();
        expectSymbol(":");

        
        let expressionTokens: Token[] = [];

        while (iteration.next()) {
            if(iteration.current.kind === "symbol" && iteration.current.value === ";") {
                return  {
                    identifier,
                    expression: transformer(expressionTokens)
                }
            }

            expressionTokens.push(iteration.current);
        }

        throw new ProcessorError("Unexpected end of file", iteration.last.range);
    };

    const parse = (): Instruction => {
        if (iteration.current.kind !== "none") {
            throw new ProcessorError("Unexpected token, expected a statement", iteration.current.range);
        }

        switch (iteration.current.value) {
            case "let": return assignment();
        }

        throw new ProcessorError("Unknown instruction", iteration.current.range);
    }

    while (iteration.next()) {
        try {
            output.push(parse());
        } catch (error) {
            errors.push(error as ProcessorError);
        }
    }

    return { output, errors }
}