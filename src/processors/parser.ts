import { Instruction } from "../instructions/instruction";
import { Expression, ExpressionFragment, LiteralExpressionFragment, ReferenceExpressionFragment } from "../instructions/assignment";
import { Iteration } from "../iteration";
import { ProcessorError, ProcessorResult } from "../processor";
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
        const expression: Expression = [
            evaluateValueFragment(iteration.next())
        ];

        const node = iteration.next();

        if (node.kind === "value" && node.meta == "array") {
            if (node.value.length > 1) {
                throw new ProcessorError("Unexpected token, array accessors must have one item", node.range);
            }

            expression.push({
                kind: "accessor",
                query: evaluateValueFragment(node.value[0])
            });

            iteration.next();
        }

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
        while (iteration.next()) {
            //read name

            if(iteration.current.kind == "value" && iteration.current.meta == "block") {
                //start parsing the contents of the set
            }
        }

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