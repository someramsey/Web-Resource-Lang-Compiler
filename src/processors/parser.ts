import { Instruction } from "../instructions/instruction";
import { ExpressionFragment } from "../instructions/AssignmentInstruction";
import { Iteration } from "../iteration";
import { ProcessorError, ProcessorResult } from "../processor";
import { Node, isValueNode } from "./transformer";

type MatchResult<T> = { match: true, result: T } | { match: false, expected: string };

function expect<T>(node: Node, predicates: ((node: Node) => MatchResult<T>)[]): T {
    const expectations: string[] = [];

    for (const predicate of predicates) {
        const matchResult = predicate(node);

        if (matchResult.match) {
            return matchResult.result;
        }

        expectations.push(matchResult.expected)
    }

    throw new ProcessorError(`Expected ${expectations.join(", ")} found ${node.kind}`, node.range);
}

function identifier(iteration: Iteration<Node>) {
    const node = iteration.next();

    if (node.kind !== "none") {
        throw new ProcessorError("Expected identifier", node.range);
    }

    return node.value;
}

function symbol(iteration: Iteration<Node>, value: string) {
    const node = iteration.next();

    if (node.kind !== "symbol" || node.value !== value) {
        throw new ProcessorError(`Expected '${value}'`, node.range);
    }
}

//TODO: check for eof on every match
export function parser(nodes: Node[]): ProcessorResult<Instruction[]> {
    const iteration = new Iteration(nodes);

    const output: Instruction[] = [];
    const errors: ProcessorError[] = [];

    let node: Node;

    const evaluateFragment = (node: Node): ExpressionFragment => {
        if (isValueNode(node)) {
            // return {
            //     kind: "value",
            //     type: node.,
            //     value: node.value
            // };
        }

        if (node.kind === "none") {
            return {
                kind: "reference",
                target: node.value
            };
        }

        throw new ProcessorError("Failed to evaluate: Unexpected token", node.range);
    }

    const evaluate = (iteration: Iteration<Node>) => {
        let expression: ExpressionFragment[] = [];

        while (node = iteration.next()) {
            
        }

        // if (isValueNode(iteration.next())) {
        //     expression.push({
        //         kind: "value",
        //         type: "string",
        //         value: "value"
        //     });
        // } else if (node.kind === "none") {
        //     expression.push({
        //         kind: "reference",
        //         target: node.value
        //     });

        //     //accessor
        //     node = iteration.next();

        //     if (node.kind === "array") {
        //         if (node.items.length > 1) {
        //             errors.push(new ProcessorError("Unexpected token, array accessors must have one item", node.range));
        //         }


        //         //push array accessor
        //         expression.push({
        //             kind: "accessor",
        //             query: {
        //                 kind: "value",
        //                 type: "number",
        //                 value: evaluate()
        //             }
        //         });
        //     }
        // }
    };

    const assignment = () => {
        const id = identifier(iteration);
        symbol(iteration, ":");
        evaluate(iteration);
        symbol(iteration, ";");
    };

    const instruction = () => {
        if (node.kind !== "none") {
            throw new ProcessorError("Unexpected token", node.range);
        }

        switch (node.value) {
            case "let": return assignment();
        }

        throw new ProcessorError("Unknown instruction", node.range);
    }

    while (node = iteration.next()) {
        try {
            instruction();
        } catch (error) {
            errors.push(error as ProcessorError);
        }
    }

    return { output, errors }
}