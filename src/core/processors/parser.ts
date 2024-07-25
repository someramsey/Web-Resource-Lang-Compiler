import { Expression } from "../../expression";
import { Assignment, FontDefinition, ThemeDefinition, UnresolvedDefinition } from "../../instruction";
import { Iteration } from "../../iteration";
import { ProcessorError, ProcessorResult } from "../processor";
import { Token } from "./tokenizer";
import { transform } from "./transformer";

export function parse(tokens: Token[]): ProcessorResult<UnresolvedDefinition[]> {
    const iteration = new Iteration(tokens);

    const output: UnresolvedDefinition[] = [];
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
    const readExpression = (): Expression => {
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
    const parseAssignment = (): Assignment => {
        next();
        const identifier = expectIdentifier();

        next();
        expectSymbol(":");

        next();
        const expression = readExpression();

        expectSymbol(";");

        return {
            type: "assignment",
            identifier,
            body: expression
        };
    };

    const parseThemeDefinition = (): ThemeDefinition<Expression> => {
        next();
        const identifier = expectIdentifier();

        next();
        expectSymbol(":");

        next();
        const expression = readExpression();

        if (expression.kind != "literal" || expression.data.meta != "block") {
            throw new ProcessorError("Expected a block literal", iteration.current.range);
        }

        expectSymbol(";");

        return {
            type: "theme", 
            identifier,
            body: expression
        };

    };

    const parseFontDefinition = (): FontDefinition<Expression> => {
        next();
        const identifier = expectIdentifier();

        next();
        expectSymbol(":");

        next();
        const body = readExpression();

        if (body.kind != "literal" || body.data.meta != "block") {
            throw new ProcessorError("Expected a block literal", iteration.current.range);
        }

        let source: string | null = null;
        const current = iteration.current; //to prevent typescript from trying to overlap types after calling next

        if (current.kind === "none" && current.value === "from") {
            next(); //This here cuz readExpression() already has an extra offset

            if (iteration.current.kind !== "value" || iteration.current.data.meta !== "string") {
                throw new ProcessorError("Expected a string literal", iteration.current.range);
            }

            source = iteration.current.data.value;
            next();
        }

        expectSymbol(";");


        return {
            type: "font", 
            identifier, 
            source,
            body
        };
    }

    const parse = (): UnresolvedDefinition => {
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