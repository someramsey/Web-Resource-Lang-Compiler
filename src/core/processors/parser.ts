import { UnresolvedDefinition } from "../../definition";
import { Expression } from "../../expression";
import { Iteration } from "../../iteration";
import { ProcessorError, ProcessorResult } from "../processor";
import { Token } from "./tokenizer";
import { transform } from "./transformer";

const bindings = new Map<string, Expression>();


export type ParseResult = { definitions: UnresolvedDefinition[], bindings: Map<string, Expression> };

export function parse(tokens: Token[]): ProcessorResult<ParseResult> {
    const iteration = new Iteration(tokens);

    const bindings = new Map<string, Expression>();
    const definitions: UnresolvedDefinition[] = [];
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
    const parseAssignment = () => {
        next();
        const identifier = expectIdentifier();

        next();
        expectSymbol(":");

        next();
        const body = readExpression();

        expectSymbol(";");

        if (bindings.has(identifier)) {
            throw new ProcessorError(`Cannot redeclare '${identifier}'`, iteration.current.range);
        }

        bindings.set(identifier, body);
    };

    const parseThemeDefinition = () => {
        next();
        const identifier = expectIdentifier();

        next();
        expectSymbol(":");

        next();
        const body = readExpression();

        if (body.kind != "literal" || body.data.meta != "block") {
            throw new ProcessorError("Expected a block literal", iteration.current.range);
        }

        expectSymbol(";");

        definitions.push({
            body,
            signature: {
                type: "theme",
                identifier
            }
        });
    };

    const parseFontDefinition = () => {
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
        const current = iteration.current;

        if (current.kind === "none" && current.value === "from") {
            next();

            if (iteration.current.kind !== "value" || iteration.current.data.meta !== "string") {
                throw new ProcessorError("Expected a string literal", iteration.current.range);
            }

            source = iteration.current.data.value;
            next();
        }

        expectSymbol(";");

        definitions.push({
            body,
            signature: {
                type: "font",
                identifier,
                source,
            }
        });
    }

    const parse = () => {
        if (iteration.current.kind !== "none") {
            throw new ProcessorError("Unexpected token, expected a statement", iteration.current.range);
        }

        switch (iteration.current.value) {
            case "let": parseAssignment(); break;
            case "theme": parseThemeDefinition(); break;
            case "font": parseFontDefinition(); break;

            default: throw new ProcessorError("Unknown instruction", iteration.current.range);
        }
    }

    while (iteration.next()) {
        try {
            parse();
        } catch (error) {
            errors.push(error as ProcessorError);
        }
    }

    return { output: { bindings, definitions }, errors }
}