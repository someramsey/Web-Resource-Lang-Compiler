import { Definition, FontStyle, FontStyles, UnresolvedDefinition } from "../../definition";
import { Expression, ReferenceExpression, ValueLiteralExpression } from "../../expression";
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

                if (interpolation.steps) {
                    if (interpolation.steps < 1) {
                        throw new ProcessorError("Interpolation steps must be above '1'", item.range);
                    }

                    if (!Number.isInteger(interpolation.steps)) {
                        throw new ProcessorError(`Interpolation steps must be a an integer, found ${interpolation.steps}`, item.range);
                    }
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
                const mode = interpolation.mode || "FLAT";

                //TODO: add other modes
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

                    default: throw new ProcessorError("Invalid interpolation mode", item.range);
                }
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

    const traceReference = (reference: ReferenceExpression): NodeMetaData => {
        //TODO: cache already resolved objects
        //TODO: handle cross references

        const trace = (reference: ReferenceExpression): ValueLiteralExpression => {
            const binding = parseResult.bindings.get(reference.name);

            if (!binding) {
                throw new ProcessorError(`Cannot resolve reference '${reference.name}'`, reference.range);
            }

            return settle(binding);
        };

        const settle = (expression: Expression): ValueLiteralExpression => {
            if (expression.kind === "reference") {
                return trace(expression);
            }

            return expression;
        };

        let target = trace(reference);
        let path: string = reference.name;

        for (let i = 0; i < reference.extenders.length; i++) {
            const extender = reference.extenders[i];

            switch (extender.kind) {
                case "acessor": {
                    if (target.data.meta !== "block") {
                        throw new ProcessorError("Cannot apply accessor to non-block data", reference.range);
                    }

                    let found = false;

                    for (const property of target.data.value) {
                        if (property.key === extender.name) {
                            target = settle(property.expression);
                            path += "." + extender.name;
                            found = true;
                            break;
                        }
                    }

                    if (!found) {
                        throw new ProcessorError(`Property '${path}' not found`, reference.range);
                    }
                } break;

                case "indexer": {
                    if (target.data.meta !== "array") {
                        throw new ProcessorError("Cannot apply indexer to non-array data", reference.range);
                    }

                    const indexExpression = settle(extender.expression);

                    if (indexExpression.data.meta !== "number") {
                        throw new ProcessorError("Indexer must be a number", reference.range);
                    }

                    const index = indexExpression.data.value as number;

                    if (index < 0 || index >= target.data.value.length) {
                        throw new ProcessorError("Index out of range", reference.range);
                    }

                    const array = resolveArray(target.data);
                    const item = array.value[index];

                    if (i < reference.extenders.length - 1) {
                        throw new ProcessorError("Array indexers must be the final extender on an expression", reference.range);
                    }

                    path += `[${index}]`;

                    return item;
                }
            }
        }

        return resolveExpression(target);

    };

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
            case "reference": return traceReference(expression);
        }
    };

    // // resolveExpression((parseResult.bindings.get("palette")! as ValueLiteralExpression<UnresolvedBlockMetaData>).data.value[3].expression);
    // console.log(resolveExpression(parseResult.bindings.get("palette")!));

    const resolveDefinition = (definition: UnresolvedDefinition): Definition => {
        switch (definition.type) {
            case "theme": {
                const resolvedExpression = resolveExpression(definition.body);

                if (resolvedExpression.meta !== "block") {
                    throw new ProcessorError("Theme definition must be a block", definition.body.range);
                }

                return {
                    type: "theme",
                    identifier: definition.identifier,
                    body: resolvedExpression
                };
            };

            case "font": {
                const resolvedExpression = resolveExpression(definition.body);

                if (resolvedExpression.meta !== "block") {
                    throw new ProcessorError("Font definition must be a block", definition.body.range);
                }

                const styleProperty = resolvedExpression.value["style"];
                const fontStyles: FontStyle[] = [];

                const parseFontStyle = (data: NodeMetaData) => {
                    if (data.meta === "array") {
                        data.value.forEach(parseFontStyle);
                        return;
                    }

                    if (data.meta !== "string") {
                        throw new ProcessorError(`Invalid font style value, (${data.meta}) ${data.value}`, definition.body.range);
                    }

                    if (!FontStyles.includes(data.value as FontStyle)) {
                        throw new ProcessorError(`Invalid font style, expected one of ${FontStyles.join(", ")}`, definition.body.range);
                    }

                    if (fontStyles.includes(data.value as FontStyle)) {
                        throw new ProcessorError(`Duplicate font style ${data.value}`, definition.body.range);
                    }

                    fontStyles.push(data.value as FontStyle);
                };

                parseFontStyle(styleProperty);

                const weightProperty = resolvedExpression.value["weights"];
                const fontWeights: number[] = [];

                const parseWeight = (data: NodeMetaData) => {
                    if (data.meta === "array") {
                        data.value.forEach(parseWeight);
                        return;
                    }

                    if (data.meta !== "number") {
                        throw new ProcessorError(`Invalid font weight value, (${data.meta}) ${data.value}`, definition.body.range);
                    }

                    if (data.value < 1 || data.value > 9) {
                        throw new ProcessorError(`Invalid font weight '${data.value}', expected a value between 1 and 9`, definition.body.range);
                    }

                    if (fontWeights.includes(data.value as number)) {
                        throw new ProcessorError(`Duplicate font weight ${data.value}`, definition.body.range);
                    }

                    fontWeights.push(data.value as number);
                };

                parseWeight(weightProperty);

                return {
                    type: "font",
                    identifier: definition.identifier,
                    source: definition.source,
                    body: {
                        style: fontStyles,
                        weights: fontWeights
                    }
                }
            }
        }
    }

    parseResult.definitions.forEach((definition: UnresolvedDefinition) => {
        try {
            output.push(resolveDefinition(definition));
        } catch (error) {
            errors.push(error as ProcessorError);
        }
    });

    return { output, errors };
}