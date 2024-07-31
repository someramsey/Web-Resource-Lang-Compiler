import { Definition, UnresolvedDefinition } from "../../definition";
import { Expression, ValueLiteralExpression } from "../../expression";
import { ArrayMetaData, BlockMetaData, GroupMetaData, Interpolation, NodeMetaData, UnresolvedArrayMetaData, UnresolvedBlockMetaData, UnresolvedGroupMetaData } from "../../meta";
import { ProcessorError, ProcessorResult } from "../processor";
import { ParseResult } from "./parser";

function hexToRgb(hex: string): { r: number, g: number, b: number } {
    const data = hex.substring(1);
    const bigint = parseInt(data, 16);

    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    }
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

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

                if (!Number.isInteger(interpolation.steps)) {
                    throw new ProcessorError("Interpolation steps must be a an integer", item.range);
                }

                if (interpolation.steps && interpolation.steps < 1) {
                    throw new ProcessorError("Interpolation steps must be above '1'", item.range);
                }

                const step = interpolation.steps ?
                    ((to - from) / (interpolation.steps - (item.inclusive ? 1 : 0))) : 1;



                if (item.inclusive) {
                    for (let i = from; i <= to; i += step) {
                        resolvedItems.push({ meta: "number", value: i });
                    }
                } else {
                    for (let i = from; i < to; i += step) {
                        resolvedItems.push({ meta: "number", value: i });
                    }
                }
            };

            const fabricateHexRange = (from: string, to: string, interpolation: Interpolation) => {
                const mode = "FLAT"//interpolation.mode || "FLAT";

                switch (mode) {
                    case "FLAT": {

                        const colorA = hexToRgb(from);
                        const colorB = hexToRgb(to);

                        const steps = interpolation.steps || 3;

                        const stepR = ((colorB.r - colorA.r) / (steps));
                        const stepG = ((colorB.g - colorA.g) / (steps));
                        const stepB = ((colorB.b - colorA.b) / (steps));

                        for (let i = 0; i < (steps); i++) {
                            const r = Math.round(colorA.r + (stepR * i));
                            const g = Math.round(colorA.g + (stepG * i));
                            const b = Math.round(colorA.b + (stepB * i));

                            resolvedItems.push({ meta: "hex", value: rgbToHex(r, g, b) });
                        }
                    } break;
                }

                //TODO: add other modes

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

    resolveExpression((parseResult.bindings.get("palette")! as ValueLiteralExpression<UnresolvedBlockMetaData>).data.value[3].expression);

    parseResult.definitions.forEach((definition: UnresolvedDefinition) => {
        const signature = definition.signature;

        switch (signature.type) {
            case "theme": {

            } break;
        }
    });

    return { output, errors };
}