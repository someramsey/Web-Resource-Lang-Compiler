import { Iteration } from "../iteration";
import { ProcessorError, ProcessorResult } from "../processor";
import { Node } from "./transformer";

type AssignmentInstruction = {
    kind: "assignment";
    id: string;
    value: Node;
}

type Instruction = AssignmentInstruction;

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

function array(node: Node): MatchResult<Node> {
    if (node.kind === "array") {
        return { match: true, result: node };
    }

    return { match: false, expected: "array" };
}

function block(node: Node): MatchResult<Node> {
    if (node.kind === "block") {
        return { match: true, result: node };
    }

    return { match: false, expected: "block" };
}

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

    throw new ProcessorError(`Expected ${expectations.join(", ")}`, node.range);
}

export function parser(nodes: Node[]): ProcessorResult<Instruction[]> {
    const iteration = new Iteration(nodes);

    const output: Instruction[] = [];
    const errors: ProcessorError[] = [];

    let node: Node;

    const assignment = () => {
        const id = identifier(iteration);
        symbol(iteration, ":");
        const value = expect(iteration.next(), [array, block]);
        symbol(iteration, ";");

        output.push({ kind: "assignment", id, value });
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

    return { errors, output }
}