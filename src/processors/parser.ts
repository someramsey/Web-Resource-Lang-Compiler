import { Expression } from "../expression";
import { Iteration } from "../iteration";
import { ProcessorError, ProcessorResult } from "../processor";
import { Token } from "./tokenizer";
import { Node } from "./transformer";

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

    const expectSymbol = (node: Node, value: string) => {
        if (node.kind !== "symbol" || node.value !== value) {
            throw new ProcessorError(`Expected '${value}'`, node.range);
        }
    }

    const next = () => {
        if (!iteration.next()) {
            throw new ProcessorError("Unexpected end of file", iteration.current.range);
        }
    }

    const assignment = () => {
        next();
        const identifier = expectIdentifier();

        next();
        expectSymbol(iteration.next(), ":");

        
        while (iteration.next()) {
            if(iteration.current.kind === "symbol" && iteration.current.value === ";") {
                break;
            }
        }
    };

    const parse = () => {
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
            parse();
        } catch (error) {
            errors.push(error as ProcessorError);
        }
    }

    return { output, errors }
}