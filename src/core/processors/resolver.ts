import { Expression, ResolvedExpression, UnresolvedExpression } from "../../expression";
import { Instruction } from "../../instruction";
import { ArrayItem, ArrayMetaData, CompoundMetaData, GroupMetaData, NodeMetaData } from "../../meta";
import { ProcessorError, ProcessorResult } from "../processor";


function resolveExpression(expression: UnresolvedExpression): ResolvedExpression {
    const resolveGroup = (data: GroupMetaData<UnresolvedExpression>): GroupMetaData<ResolvedExpression> => {
        return {
            meta: "group",
            value: resolveExpression(data.value)
        };
    };

    const resolveArray = (data: ArrayMetaData<UnresolvedExpression>): ArrayMetaData<ResolvedExpression> => {
        return {
            meta: "array",
            value: data.value.map<ArrayItem<ResolvedExpression>>(item => {
                if (item.kind == "single") {
                    return {
                        ...item,
                        expression: resolveExpression(item.expression)
                    }
                } else {
                    return {
                        ...item,
                        from: resolveExpression(item.from),
                        to: resolveExpression(item.to)
                    }
                }
            })
        }
    };

    if (expression.kind == "literal") {
        switch (expression.data.meta) {
            case "group": return { data: resolveGroup(expression.data) }
            case "array": return { data: resolveArray(expression.data) }
            case "block": null //TODO
        }

        return { data: expression.data };
    }
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