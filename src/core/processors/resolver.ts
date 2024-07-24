import { ReferenceExpression, ResolvedExpression, UnresolvedExpression, ValueLiteralExpression } from "../../expression";
import { Instruction } from "../../instruction";
import { ArrayItem, ArrayMetaData, BlockMetaData, GroupMetaData, NodeMetaData } from "../../meta";
import { ProcessorError, ProcessorResult } from "../processor";

export function resolve(instructions: Instruction<UnresolvedExpression>[]): ProcessorResult<Instruction<ResolvedExpression>[]> {
    const output: Instruction<ResolvedExpression>[] = [];
    const errors: ProcessorError[] = [];

    const resolveExpression = (expression: UnresolvedExpression): ResolvedExpression => {
        const unwrapMetaData = (data: NodeMetaData<UnresolvedExpression>): NodeMetaData<ResolvedExpression> => {
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

            const resolveBlock = (data: BlockMetaData<UnresolvedExpression>): BlockMetaData<ResolvedExpression> => {
                return {
                    meta: "block",
                    value: data.value.map(property => ({
                        key: property.key,
                        expression: resolveExpression(property.expression)
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
            const lookup = (name: string): ValueLiteralExpression<NodeMetaData<UnresolvedExpression>> => {
                for (const instruction of instructions) {
                    if (instruction.identifier == name) {
                        if (instruction.expression.kind == "literal") {
                            return instruction.expression;
                        }

                        return lookup(instruction.expression.name);
                    }
                }

                throw new ProcessorError(`Reference could not be found: ${name}`, reference.range);
            };

            let target = lookup(reference.name);

            for (const extender of reference.extenders) {
                switch (extender.kind) {
                    case "acessor": {
                        if(target.data.meta !== "block") {
                            throw new ProcessorError(`Cannot use acessor on non-block data`, reference.range);
                        }

                        for(const property of target.data.value) {
                            if(property.key == extender.name) {
                                //TODO: trace up until the end
                                break;
                            }
                        }

                        throw new ProcessorError(`Property '${extender.name}' does not exist on '${reference.name}'`, reference.range);
                    }
                }
            }
        }

        switch (expression.kind) {
            case "literal": return { data: unwrapMetaData(expression.data) };
            case "reference": return { data: resolveReference(expression) };
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