import { Expression, ReferenceExpression, ResolvedExpression, ValueLiteralExpression } from "../../expression";
import { InstructionRuleSet, ThemeDefinition } from "../../instruction";
import { ArrayItem, ArrayMetaData, BlockMetaData, GroupMetaData, NodeMetaData } from "../../meta";
import { ProcessorError, ProcessorResult } from "../processor";

export function resolve(instructions: Expressive<Expression>[]): ProcessorResult<InstructionRuleSet> {
    const output: InstructionRuleSet = [];
    const errors: ProcessorError[] = [];

    const resolveExpression = (expression: Expression): ResolvedExpression => {
        const unwrapMetaData = (data: NodeMetaData<Expression>): NodeMetaData<ResolvedExpression> => {
            const resolveGroup = (data: GroupMetaData<Expression>): GroupMetaData<ResolvedExpression> => {
                return {
                    meta: "group",
                    value: resolveExpression(data.value)
                };
            };

            const resolveArray = (data: ArrayMetaData<Expression>): ArrayMetaData<ResolvedExpression> => {
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

            const resolveBlock = (data: BlockMetaData<Expression>): BlockMetaData<ResolvedExpression> => {
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

        //TODO: check for cross references
        const traceReference = (reference: ReferenceExpression): NodeMetaData<Expression> => {
            type UnresolvedValueLiteralExpression = ValueLiteralExpression<NodeMetaData<Expression>>;

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


            let target = lookup(reference.name).data;
            let path: string[] = [reference.name];

            const follow = (expression: Expression) => {
                switch (expression.kind) {
                    case "literal": target = expression.data; break;
                    case "reference": target = traceReference(expression); break;
                }
            }

            const followAccessor = (key: string) => {
                if (target.meta !== "block") {
                    throw new ProcessorError(`Cannot use acessor on non-block data`, reference.range);
                }

                for (const property of target.value) {
                    if (property.key == key) {
                        follow(property.expression);
                        path.push(key);
                        return;
                    }
                }

                throw new ProcessorError(`Property '${key}' does not exist on '${path.join(".")}'`, reference.range);
            };

            const followIndexer = (indexExpression: Expression) => {
                let indexData: NodeMetaData<Expression>;

                if (indexExpression.kind == "reference") {
                    indexData = traceReference(indexExpression);
                } else {
                    indexData = indexExpression.data
                }

                switch (target.meta) {
                    case "array": {
                        if (indexData.meta !== "number") {
                            throw new ProcessorError(`'${indexData.meta} cannot be used as an index on an array`, reference.range);
                        }

                        const index = indexData.value;
                        const array = target.value;

                        if (index < 0 || index >= array.length) {
                            throw new ProcessorError(`Index out of bounds, index (${index}) of array (${array})`, reference.range);
                        }

                        const item = array[index];

                        if (item.kind == "range") {
                            throw new ProcessorError(`Cannot reference a ranged array item`, reference.range);
                        }

                        follow(item.expression);
                        path.push(`[${index}]`);
                    } break;

                    case "block": {
                        if (indexData.meta !== "string") {
                            throw new ProcessorError(`'${indexData.meta} cannot be used as an index on an object`, reference.range);
                        }

                        const key = indexData.value;
                        const block = target.value as BlockMetaData<Expression>["value"];

                        for (const property of block) {
                            if (property.key == key) {
                                follow(property.expression);
                                path.push(key);
                                return;
                            }
                        }

                        throw new ProcessorError(`Property '${key}' does not exist on '${path.join(".")}'`, reference.range);
                    };

                    default: throw new ProcessorError(`Type is not indexable, indexer can only be used on arrays and blocks`, reference.range);
                }

            }

            for (const extender of reference.extenders) {
                switch (extender.kind) {
                    case "acessor": followAccessor(extender.name); break;
                    case "indexer": followIndexer(extender.expression); break;
                }
            }

            return target;
        }

        switch (expression.kind) {
            case "literal": return { data: unwrapMetaData(expression.data) };
            case "reference": return { data: unwrapMetaData(traceReference(expression)) };
        }
    }

    const resolveTheme = (instruction: ThemeDefinition<Expression>) => {
        output.push({
            type: "theme",
            identifier: instruction.identifier,
            expression: resolveExpression(instruction.expression) as ValueLiteralExpression<BlockMetaData<ResolvedExpression>>
        });
    };

    for (const instruction of instructions) {
        switch (instruction.type) {
            case "theme": resolveTheme(instruction); break;
        }
    }

    return { output, errors };
}