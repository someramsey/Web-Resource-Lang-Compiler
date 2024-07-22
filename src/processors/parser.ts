import { Expression, ValueLiteralExpression } from "../expression";
import { Assignment, Instruction, ThemeDefinition } from "../instruction";
import { Iteration } from "../iteration";
import { BlockMetaData } from "../meta";
import { ProcessorError, ProcessorResult } from "../processor";
import { Token } from "./tokenizer";
import { transformer } from "./transformer";



export function parser(tokens: Token[]): ProcessorResult<Instruction[]> {
    const iteration = new Iteration(tokens);

    const output: Instruction[] = [];
    const errors: ProcessorError[] = [];

    const expectIdentifier = (): string => {
        if (iteration.current.kind !== "none") {
            throw new ProcessorError("Expected an identifier", iteration.current.range);
        }

        return iteration.current.value;
    };

    const expectSymbol = (value: string) => {
        if (iteration.current.kind !== "symbol" || iteration.current.value !== value) {
            throw new ProcessorError(`Expected '${value}'`, iteration.current.range);
        }
    };

    const next = () => {
        if (!iteration.next()) {
            throw new ProcessorError("Unexpected end of file", iteration.last.range);
        }
    };

    const readExpression = (): Expression => {
        const expressionTokens: Token[] = [];

        while (iteration.current) {
            if (iteration.current.kind === "symbol" && iteration.current.value === ";") {
                return transformer(expressionTokens);
            }

            expressionTokens.push(iteration.current);
            next();
        }

        throw new ProcessorError("Unexpected end of file", iteration.last.range);
    }

    //instructions
    const parseAssignment = (): Assignment => {
        next();
        const identifier = expectIdentifier();

        next();
        expectSymbol(":");

        next();
        const expression = readExpression();

        return { type: "assignment", identifier, expression };
    };

    const parseThemeDefinition = (): ThemeDefinition => {
        next();
        const identifier = expectIdentifier();

        next();
        expectSymbol(":");

        next();
        const expression = readExpression();

        if (expression.kind != "literal") {
            throw new ProcessorError("Expected a block literal", iteration.current.range);
        }

        if (expression.data.meta != "block") {
            throw new ProcessorError("Expected a block literal", iteration.current.range);
        }

        return {
            type: "theme", identifier,
            expression: expression as ValueLiteralExpression & { data: BlockMetaData } //bad cast, cuz ts is dumb and doesn't allow circular generic types
        };

    };

    const parse = (): Instruction => {
        if (iteration.current.kind !== "none") {
            throw new ProcessorError("Unexpected token, expected a statement", iteration.current.range);
        }

        switch (iteration.current.value) {
            case "let": return parseAssignment();
            case "theme": return parseThemeDefinition();
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