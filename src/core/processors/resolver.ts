import { ResolvedExpression, UnresolvedExpression } from "../../expression";
import { Instruction } from "../../instruction";
import { ProcessorError, ProcessorResult } from "../processor";

function resolveExpression(expression: UnresolvedExpression): ResolvedExpression {
    if (expression.kind == "literal") {
        switch(expression.data.meta) {
            
        }
    }

    throw new Error("Not implemented");
}

export function resolve(instructions: Instruction<UnresolvedExpression>[]): ProcessorResult<Instruction<ResolvedExpression>[]> {
    const output: Instruction<ResolvedExpression>[] = [];
    const errors: ProcessorError[] = [];

    const resolveAssignment = (instruction: Instruction<UnresolvedExpression>) => {
        
    };

    for (const instruction of instructions) {
        switch (instruction.type) {
            case "assignment": resolveAssignment(instruction); break;
        }
    }

    return { output, errors };
}