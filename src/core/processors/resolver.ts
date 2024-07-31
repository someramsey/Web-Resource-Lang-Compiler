import { Range } from "../../range";
import { ParseResult } from "./parser";
import { Definition, UnresolvedDefinition } from "../../definition";
import { Expression, ValueLiteralExpression } from "../../expression";
import { Interpolation, ArrayMetaData, BlockMetaData, GroupMetaData, NodeMetaData, UnresolvedArrayMetaData, UnresolvedBlockMetaData, UnresolvedGroupMetaData } from "../../meta";
import { ProcessorError, ProcessorResult } from "../processor";

export function resolve(parseResult: ParseResult): ProcessorResult<Definition[]> {
    const output: Definition[] = [];
    const errors: ProcessorError[] = [];

    const resolveGroup = (group: UnresolvedGroupMetaData): GroupMetaData => {
        return {
            meta: "group",
            value: {
                item: resolveExpression(group.value.expression)
            }
        };
    };

    const resolveArray = (array: UnresolvedArrayMetaData): ArrayMetaData => {
        const resolvedItems: NodeMetaData[] = [];

        array.value.forEach((item) => {
            if (item.kind == "single") {
                resolvedItems.push(resolveExpression(item.expression));
                return;
            }

            const fromValue = resolveExpression(item.from);
            const toValue = resolveExpression(item.to);

            if (fromValue.meta !== toValue.meta) {
                throw new ProcessorError("Ranged item bounds must be of the same kind", item.range);
            }

            const fabricateNumberRange = (from: number, to: number, interpolation: Interpolation) => {
                if (from > to) {
                    throw new ProcessorError("Invalid range bounds, lower bound of the range must be less than the upper bound", item.range);
                }

                const endIndex = item.inclusive ? to : to - 1;

                const steps = interpolation.steps ?
                    ((to - from) / interpolation.steps) : 1;

                for (let i = from; i <= endIndex; i += steps) {
                    resolvedItems.push({ meta: "number", value: i });
                }

                console.log(resolvedItems);
            };

            const fabricateHexRange = (from: string, to: string, interpolation: Interpolation) => {
                console.log(interpolation);
            };

            switch (fromValue.meta) {
                case "number": fabricateNumberRange(fromValue.value, toValue.value as number, item.interpolation); break;
                case "hex": fabricateHexRange(fromValue.value, toValue.value as string, item.interpolation); break;

                default: throw new ProcessorError("Invalid type for ranged item bounds", item.range);
            }
        })

        return { meta: "array", value: resolvedItems };
    };

    const resolveBlock = (block: UnresolvedBlockMetaData): BlockMetaData => {
        const value: { [key: string]: NodeMetaData } = block.value.reduce((acc, property) => {
            acc[property.key] = resolveExpression(property.expression);
            return acc;
        }, {});

        return { meta: "block", value };
    }

    const resolveExpression = (expression: Expression): NodeMetaData => {
        const resolveLiteral = (literal: ValueLiteralExpression): NodeMetaData => {
            switch (literal.data.meta) {
                case "group": return resolveGroup(literal.data);
                case "array": return resolveArray(literal.data);
                case "block": return resolveBlock(literal.data);
            }

            return literal.data;
        };

        switch (expression.kind) {
            case "literal": return resolveLiteral(expression);
            case "reference": throw new Error("Not implemented");
        }
    };

    // resolveExpression((parseResult.bindings.get("palette")! as ValueLiteralExpression<UnresolvedBlockMetaData>).data.value[2].expression);

    parseResult.definitions.forEach((definition: UnresolvedDefinition) => {
        const signature = definition.signature;

        switch (signature.type) {
            case "theme": {

            } break;
        }
    });

    return { output, errors };
}