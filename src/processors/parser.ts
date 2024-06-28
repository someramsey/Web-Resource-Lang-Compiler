import { Expression } from "../instructions/expression";
import { Instruction } from "../instructions/instruction";
import { Iteration } from "../iteration";
import { ProcessorError, ProcessorResult } from "../processor";
import { Token } from "./tokenizer";
import { Node, isCompound } from "./transformer";

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

    const evaluate = (nodes: Node[]): Expression => {
        const expression: Expression = [];

        let state = "initiator";

        for (const node of nodes) {
            switch (state) {
                case "initiator": {
                    if (node.kind === "none") {
                        state = "reference";
                        expression.push({ kind: "reference", target: node.value });
                        continue;
                    } else if (node.kind === "value") {
                        state = "end";



                        if(isCompound(node)) {

                        //TODO: evaluate children nodes of compounds
                        }

                        // expression.push({ kind: "literal", metaValue: node.metaValue });
                        continue;
                    }

                    throw new ProcessorError("Unexpected token", node.range);
                };

                case "reference": {
                    if (node.kind === "symbol" && node.value === ".") {
                        state = "accessor";
                        continue;
                    }

                    throw new ProcessorError("Unexpected token", node.range);
                };

                case "accessor": {
                    if (node.kind === "none") {
                        state = "reference";
                        expression.push({ kind: "reference", target: node.value });
                    }

                    throw new ProcessorError("Unexpected token", node.range);
                };
            }
        }

        return expression;
    };

    const assignment = () => {
        const id = identifier(iteration);
        symbol(iteration.next(), ":");

        const expressionNodes: Node[] = [];

        while (iteration.next()) {
            if (iteration.current.kind === "symbol" && iteration.current.value === ";") {
                break;
            }

            expressionNodes.push(iteration.current);
        }

        const expression = evaluate(expressionNodes);

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