import { Expression, ReferenceExpression, ResolvedExpression, UnresolvedExpression, ValueLiteralExpression } from "../../expression";
import { Instruction } from "../../instruction";
import { ArrayItem, ArrayMetaData, BlockMetaData, CompoundMetaData, GroupMetaData, NodeMetaData } from "../../meta";
import { ProcessorError, ProcessorResult } from "../processor";





export function resolve(instructions: Instruction<UnresolvedExpression>[]): ProcessorResult<Instruction<ResolvedExpression>[]> {
    const output: Instruction<ResolvedExpression>[] = [];
    const errors: ProcessorError[] = [];

    const resolveExpression = (expression: UnresolvedExpression, premature: boolean): ResolvedExpression => {
        const unwrapMetaData = (data: NodeMetaData<UnresolvedExpression>): NodeMetaData<ResolvedExpression> => {
            const resolveGroup = (data: GroupMetaData<UnresolvedExpression>): GroupMetaData<ResolvedExpression> => {
                return {
                    meta: "group",
                    value: resolveExpression(data.value, premature)
                };
            };

            const resolveArray = (data: ArrayMetaData<UnresolvedExpression>): ArrayMetaData<ResolvedExpression> => {
                return {
                    meta: "array",
                    value: data.value.map<ArrayItem<ResolvedExpression>>(item => {
                        if (item.kind == "single") {
                            return {
                                ...item,
                                expression: resolveExpression(item.expression, premature)
                            }
                        } else {
                            return {
                                ...item,
                                from: resolveExpression(item.from, premature),
                                to: resolveExpression(item.to, premature)
                            }
                        }
                    })
                }
            };

            const resolveBlock = (data: BlockMetaData<UnresolvedExpression>): BlockMetaData<ResolvedExpression> => {
                return {
                    meta: "block",
                    value: data.value.map(property => ({
                        key: property.key,
                        expression: resolveExpression(property.expression, premature)
                    }))
                }
            }

            switch (data.meta) {
                case "group": return resolveGroup(data)
                case "array": return resolveArray(data)
                case "block": return resolveBlock(data)
            }

            return data;
        }

        const resolveReference = (reference: ReferenceExpression): NodeMetaData<ResolvedExpression> => {
            instructions.forEach(instruction => {
                if (instruction.identifier == reference.name) {
                    const expression = resolveExpression(instruction.expression, false);








                }
            })
        }




        if (expression.kind == "literal") {
            return { data: unwrapMetaData(expression.data) };
        } else {
            return { data: resolveReference(expression) };
        }
    }

    const resolveAssignment = (instruction: Instruction<UnresolvedExpression>) => {

    };

    for (const instruction of instructions) {
        switch (instruction.type) {
            case "assignment": resolveAssignment(instruction); break;
        }
    }

    return { output, errors };
}