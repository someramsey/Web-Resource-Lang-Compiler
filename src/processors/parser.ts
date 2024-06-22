import { Iteration } from "../iteration";
import { ProcessorError, ProcessorResult } from "../processor";
import { Node } from "./transformer";

type Instruction = {



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

function array(node: Node) {
    if(node.kind === "array") {
        return node;
    }

    return null;
}

type Matcher<T> = (node: Node) => T | null;

function predicate<T extends object>(iteration: Iteration<Node>, matchers: Matcher<T>[]): T {
    const node = iteration.next();

    for (const matcher of matchers) {
        const result = matcher(node);

        if (result !== null) {
            return result;
        }
    }

    throw new Error(); 
}

export function parser(nodes: Node[]): ProcessorResult<Instruction[]> {
    const iteration = new Iteration(nodes);

    const output: Instruction[] = [];
    const errors: ProcessorError[] = [];

    let node: Node;

    const assignment = () => {
        const id = identifier(iteration);
        symbol(iteration, ":");
        predicate(iteration, [array]).kind === "array";
    };

    const instruction = () => {
        if (node.kind !== "none") {
            throw new ProcessorError("Unexpected token", node.range);
        }

        switch (node.value) {
            case "let": return assignment();
        }
    }

    while (node = iteration.next()) {
        try {
            instruction();
        } catch (error) {
            errors.push(error as ProcessorError);
        }
    }

    return {
        output,
        errors
    }
}

//Unholy type matching:
// type MatchResult<T> = { match: boolean; result?: T; };

// function predicate<V, T extends ((node: Node) => MatchResult<V>)[], TReturn extends ReturnType<T[number]>["result"]>(matchers: T): TReturn {
//     return matchers[0]({
//         kind: "none", range: { begin: { column: 0, line: 0, index: 0 }, end: { column: 0, line: 0, index: 0 } }, value: ""
//     }).match as TReturn;
// }

// const a = predicate([array])