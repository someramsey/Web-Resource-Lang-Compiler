import { Expression, LiteralExpressionFragment, ReferenceExpressionFragment } from "../instructions/expression";
import { Instruction } from "../instructions/instruction";
import { Iteration } from "../iteration";
import { ProcessorError, ProcessorResult } from "../processor";
import { Token } from "./tokenizer";
import { Node } from "./transformer";

function identifier(iteration: Iteration<Node>) {
    const node = iteration.next();

    if (node.kind !== "none") {
        throw new ProcessorError("Expected identifier", node.range);
    }

    return node.value;
}

function symbol(node: Node, value: string) {
    if (node.kind !== "symbol" || node.value !== value) {
        throw new ProcessorError(`Expected '${value}'`, node.range);
    }
}

//TODO: check for eof on every match
export function parser(nodes: Node[]): ProcessorResult<Instruction[]> {
    const iteration = new Iteration(nodes);

    const output: Instruction[] = [];
    const errors: ProcessorError[] = [];

    const evaluateValueFragment = (node: Node): LiteralExpressionFragment | ReferenceExpressionFragment => {
        if (node.kind === "none") {
            return {
                kind: "reference",
                target: node.value
            };
        } else if (node.kind === "value") {
            return {
                kind: "literal",
                meta: node.meta,
                value: node.value
            };
        }

        throw new ProcessorError("Failed to evaluate: Unexpected token", node.range);
    }

    const evaluate = (iteration: Iteration<Node>): Expression => {
        const expression: Expression = [];


        return expression;
    };

    const assignment = () => {
        const id = identifier(iteration);
        symbol(iteration.next(), ":");
        const expression = evaluate(iteration);
        symbol(iteration.current, ";");

        output.push({ kind: "assignment", id, expression });
    };

    const font = () => {
        let name: Token[] = [];

        errors.push(new ProcessorError("Unfinished statement at eof", iteration.current.range));
    };

    const instruction = () => {
        if (iteration.current.kind !== "none") {
            throw new ProcessorError("Unexpected token, expected instruction", iteration.current.range);
        }

        switch (iteration.current.value) {
            case "let": return assignment();
            case "font": return font();
        }

        throw new ProcessorError("Unknown instruction", iteration.current.range);
    }

    while (iteration.next()) {
        try {
            instruction();
        } catch (error) {
            errors.push(error as ProcessorError);
        }
    }

    return { output, errors }
}