import { UnresolvedExpression, ValueLiteralExpression } from "../../expression";
import { Assignment, FontDefinition, Instruction, ThemeDefinition } from "../../instruction";
import { Iteration } from "../../iteration";
import { BlockMetaData } from "../../meta";
import { ProcessorError, ProcessorResult } from "../processor";
import { Token } from "./tokenizer";
import { transform } from "./transformer";

export function parse(tokens: Token[]): ProcessorResult<Instruction<UnresolvedExpression>[]> {
    const iteration = new Iteration(tokens);

    const output: Instruction<UnresolvedExpression>[] = [];
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

    //TODO: prevent transformer from reading extra tokens
    const readExpression = (): UnresolvedExpression => {
        const expressionTokens: Token[] = [];

        while (iteration.current) {
            if (iteration.current.kind === "symbol" && iteration.current.value === ";") {
                return transform(expressionTokens);
            }

            expressionTokens.push(iteration.current);
            next();
        }

        throw new ProcessorError("Unexpected end of file", iteration.last.range);
    }

    //instructions
    const parseAssignment = (): Assignment<UnresolvedExpression> => {
        next();
        const identifier = expectIdentifier();

        next();
        expectSymbol(":");

        next();
        const expression = readExpression();

        expectSymbol(";");

        return { type: "assignment", identifier, expression };
    };

    const parseThemeDefinition = (): ThemeDefinition<UnresolvedExpression> => {
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

        expectSymbol(";");

        return {
            type: "theme", identifier,
            expression: expression as ValueLiteralExpression<BlockMetaData<UnresolvedExpression>>
        };

    };

    const parseFontDefinition = (): FontDefinition<UnresolvedExpression> => {
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

        let source: string | null = null;
        const current = iteration.current; //to prevent typescript from trying to overlap types after calling next

        if (current.kind === "none" && current.value === "from") {
            next();

            if (iteration.current.kind !== "value" || iteration.current.data.meta !== "string") {
                throw new ProcessorError("Expected a string literal", iteration.current.range);
            }

            source = iteration.current.data.value;
            next();
        }

        expectSymbol(";");

        return {
            type: "font", identifier, source,
            expression: expression as ValueLiteralExpression<BlockMetaData<UnresolvedExpression>>
        };
    }

    const parse = (): Instruction<UnresolvedExpression> => {
        if (iteration.current.kind !== "none") {
            throw new ProcessorError("Unexpected token, expected a statement", iteration.current.range);
        }

        switch (iteration.current.value) {
            case "let": return parseAssignment();
            case "theme": return parseThemeDefinition();
            case "font": return parseFontDefinition();
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