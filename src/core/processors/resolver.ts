import { Expression, ReferenceExpression, ValueLiteralExpression } from "../../expression";
import { Definition, ThemeDefinition, UnresolvedDefinition } from "../../instruction";
import { ArrayMetaData, BlockMetaData, GroupMetaData, NodeMetaData, PrimeMetaData } from "../../meta";
import { ProcessorError, ProcessorResult } from "../processor";

export type ResolvedArrayData = ResolvedData[];
export type ResolvedBlockData = {
    [key: string]: ResolvedData;
};

export type ResolvedData = PrimeMetaData | ResolvedBlockData | ResolvedArrayData;

export function resolve(definitions: UnresolvedDefinition[]): ProcessorResult<Definition[]> {
    const output: Definition[] = [];
    const errors: ProcessorError[] = [];

    const traceReference = (reference: ReferenceExpression): ValueLiteralExpression => {
        const lookup = (reference: ReferenceExpression): ValueLiteralExpression => {
            for (const definition of definitions) {
                if (definition.type == "assignment" && definition.identifier == reference.name) {
                    if (definition.body.kind == "literal") {
                        return definition.body;
                    }

                    return lookup(definition.body);
                }
            }

            throw new ProcessorError(`Reference could not be found: ${reference.name}`, reference.range);
        };

        // //TODO: check for cross references

        let target: ValueLiteralExpression = lookup(reference);
        let path: string[] = [reference.name];

        const follow = (expression: Expression) => {
            switch (expression.kind) {
                case "literal": target = expression; break;
                case "reference": target = traceReference(expression); break;
            }
        }

        const followAccessor = (key: string) => {
            if (target.data.meta !== "block") {
                throw new ProcessorError(`Cannot use acessor on non-block data`, reference.range);
            }

            for (const property of target.data.value) {
                if (property.key == key) {
                    follow(property.expression);
                    path.push(key);
                    return;
                }
            }

            throw new ProcessorError(`Property '${key}' does not exist on '${path.join(".")}'`, reference.range);
        };

        const followIndexer = (indexExpression: Expression) => {
            let indexData: NodeMetaData;

            if (indexExpression.kind == "reference") {
                indexData = traceReference(indexExpression).data;
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
                    const block = target.data.value as BlockMetaData["value"];

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
    };

    const unwrapReference = (expression: Expression): ValueLiteralExpression => {
        if (expression.kind === "reference") {
            return traceReference(expression);
        }

        return expression;
    };

    const resolveGroup = (expression: ValueLiteralExpression<GroupMetaData>): ResolvedData => {
        return resolveExpresion(expression.data.value);
    };

    const resolveArray = (expression: ValueLiteralExpression<ArrayMetaData>): ResolvedArrayData => {
        return expression.data.value.map(item => {
            if (item.kind == "single") {
                return resolveExpresion(item.expression);
            }

            const rangeBegin = unwrapReference(item.from);
            const rangeEnd = unwrapReference(item.to);

            if (rangeBegin.data.meta !== rangeEnd.data.meta) {
                throw new ProcessorError("Ranged array bounds must be of the same type", expression.range);
            }

            switch (rangeBegin.data.meta) { //TODO: generate the values for ranged items
                case "number": break;
                case "hex": break;
            }

            throw new ProcessorError("Invalid type for ranged array bounds", expression.range);
        });
    };

    const resolveBlock = (expression: ValueLiteralExpression<BlockMetaData>): ResolvedBlockData => {
        return expression.data.value.reduce((acc: ResolvedBlockData, property) => {
            acc[property.key] = resolveExpresion(property.expression);
            return acc;
        }, {});
    };

    const resolveExpresion = (expression: Expression): ResolvedData => {
        const resolveData = (valueExpression: ValueLiteralExpression): ResolvedData => {
            switch (valueExpression.data.meta) {
                case "block": return resolveBlock(valueExpression as ValueLiteralExpression<BlockMetaData>);
                case "array": return resolveArray(valueExpression as ValueLiteralExpression<ArrayMetaData>);
                case "group": return resolveGroup(valueExpression as ValueLiteralExpression<GroupMetaData>);
            }

            return valueExpression.data
        };

        switch (expression.kind) {
            case "literal": return resolveData(expression);
            case "reference": return resolveData(traceReference(expression));
        }
    };



    const resolveThemeDefinition = (definition: ThemeDefinition<Expression>) => {
        if (definition.body.kind !== "literal" || definition.body.data.meta !== "block") {
            throw new ProcessorError("Expected body to be a block literal", definition.body.range);
        }

        const body = resolveBlock(definition.body as ValueLiteralExpression<BlockMetaData>);

        output.push({
            type: "theme",
            identifier: definition.identifier,
            body
        });
    };



    for (const definition of definitions) {
        try {
            switch (definition.type) {
                case "theme": resolveThemeDefinition(definition); break;
            }
        } catch (error) {
            errors.push(error as ProcessorError);
        }
    }

    return { output, errors };
}