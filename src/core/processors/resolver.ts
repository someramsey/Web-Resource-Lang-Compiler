import { Expression, ReferenceExpression, ResolvedExpression, UnresolvedExpression, ValueLiteralExpression } from "../../expression";
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
            type UnresolvedValueLiteralExpression = ValueLiteralExpression<NodeMetaData<UnresolvedExpression>>;

            const lookup = (name: string): UnresolvedValueLiteralExpression => {
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
            let path: string[] = [reference.name];

            const followAccessor = (key: string) => {
                if (target.data.meta !== "block") {
                    throw new ProcessorError(`Cannot use acessor on non-block data`, reference.range);
                }

                for (const property of target.data.value) {
                    if (property.key == key) {
                        switch (property.expression.kind) {
                            case "literal": target = property.expression; break;
                            case "reference": target = lookup(property.expression.name); break;
                        }

                        path.push(key);
                        return;
                    }
                }

                throw new ProcessorError(`Property '${key}' does not exist on '${path.join(".")}'`, reference.range);
            };

            const followIndexer = (indexExpression: UnresolvedExpression) => {
                let indexData: NodeMetaData<Expression>;

                if (indexExpression.kind == "reference") {
                    indexData = resolveReference(indexExpression);
                } else {
                    indexData = indexExpression.data
                }

                switch (target.data.meta) {
                    case "array": {
                        if (indexData.meta !== "number") {
                            throw new ProcessorError(`'${indexData.meta} cannot be used as an index on an array`, reference.range);
                        }

                        const index = indexData.value;
                        const array = target.data.value;

                        if(index < 0 || index >= array.length) {
                            throw new ProcessorError(`Index out of bounds, index (${index}) of array (${array})`, reference.range);
                        }

                        //TODO: Resolve array item
                    } break;
                    case "block": {
                        //TODO: index block
                    } break;

                    default: throw new ProcessorError(`Type is not indexable, indexer can only be used on arrays and blocks`, reference.range);
                }

            }



            for (const extender of reference.extenders) {
                switch (extender.kind) {
                    case "acessor": followAccessor(extender.name); break;
                    case "indexer": followIndexer(extender.expression); break;
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