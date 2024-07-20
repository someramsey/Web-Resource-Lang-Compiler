import { Iteration } from "../iteration";
import { ProcessorError, ProcessorResult } from "../processor";
import { Node } from "./transformer";





type Instruction = {};

//TODO: check for eof on every match
export function parser(nodes: Node[]): ProcessorResult<Instruction[]> {
    const iteration = new Iteration(nodes);

    const output: Instruction[] = [];
    const errors: ProcessorError[] = [];

    const assignment = () => {
        // const id = identifier(iteration);
        // symbol(iteration.next(), ":");

        // const expressionNodes: Node[] = [];

        // while (iteration.next()) {
        //     if (iteration.current.kind === "symbol" && iteration.current.value === ";") {
        //         break;
        //     }

        //     expressionNodes.push(iteration.current);
        // }

        // output.push({ kind: "assignment", id, expression: [] }); //TODO: reimplement evaluation
    };

    const parse = () => {
        if (iteration.current.kind !== "none") {
            throw new ProcessorError("Unexpected token, expected a statement", iteration.current.range);
        }

        switch (iteration.current.value) {
            case "let": return assignment();
        }

        throw new ProcessorError("Unknown instruction", iteration.current.range);
    }

    while (iteration.next()) {
        try {
            parse();
        } catch (error) {
            errors.push(error as ProcessorError);
        }
    }

    return { output, errors }
}