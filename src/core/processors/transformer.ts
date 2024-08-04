import { ExpressionExtender, Expression, ValueLiteralExpression } from "../../expression";
import { Iteration } from "../../iteration";
import { ArrayItem, UnresolvedArrayMetaData, UnresolvedBlockMetaData, UnresolvedCompoundMetaData, UnresolvedGroupMetaData, UnresolvedMetaData, Property } from "../../meta";
import { Position, Range } from "../../range";
import { ProcessorError } from "../processor";
import { Token, ValueToken } from "./tokenizer";

export type Node = Token | ValueToken<UnresolvedCompoundMetaData>;

//TODO: refactor
//TODO: only allow to transform a single expression
export function transform(tokens: Token[]): Expression {
    const iteration = new Iteration(tokens);

    let token: Token = iteration.next();

    const readExpressionExtenders = (): ExpressionExtender[] => {
        const extenders: ExpressionExtender[] = [];
        let state = "none";

        while (token = iteration.next()) {
            switch (state) {
                case "accessor": {
                    if (token.kind !== "none") {
                        throw new ProcessorError("Expected identifier", token.range);
                    }

                    extenders.push({
                        kind: "acessor",
                        name: token.value
                    });

                    state = "none";
                } break;

                case "indexer": {
                    const indexExpression = readExpression();

                    if (token.kind !== "symbol" || token.value !== "]") {
                        throw new ProcessorError("Expected ']'", token.range);
                    }

                    extenders.push({
                        kind: "indexer",
                        expression: indexExpression
                    });

                    state = "none";
                } break;

                case "none": {
                    if (token.kind === "symbol") {
                        if (token.value === ".") {
                            state = "accessor";
                        } else if (token.value === "[") {
                            state = "indexer";
                        } else {
                            return extenders;
                        }
                    } else {
                        return extenders;
                    }
                };
            }
        }

        return extenders;
    }

    const readExpression = (): Expression => {
        const node = transform(token);

        if (node.kind == "value") {
            const value: ValueLiteralExpression<UnresolvedMetaData> = {
                kind: "literal",
                data: node.data,
                range: node.range
            };

            token = iteration.next();

            return value;
        } else if (node.kind == "none") {
            return {
                kind: "reference",
                name: node.value,
                extenders: readExpressionExtenders(),
                range: node.range
            };
        }

        throw new ProcessorError("Expected expression", node.range);
    };


    const transform = (token: Token): Node => {
        if (token.kind !== "symbol") {
            return token;
        }

        const begin = iteration.current;
        let data: UnresolvedCompoundMetaData;

        switch (token.value) {
            case "(": data = readGroup(); break;
            case "[": data = readArray(); break;
            case "{": data = readBlock(); break;
            default: return token;
        }

        return {
            kind: "value", data,
            range: Range.between(begin, iteration.last)
        };
    };

    const readGroup = (): UnresolvedGroupMetaData => {
        token = iteration.next();

        const beginPos = iteration.current.range.begin;
        const expression = readExpression();

        if (token.kind !== "symbol" || token.value !== ")") {
            throw new ProcessorError("Expected ')'", token.range);
        }

        return {
            meta: "group",
            value: {
                expression,
                range: Range.from(beginPos, iteration.last.range.end)
            }
        };
    };

    const readArray = (): UnresolvedArrayMetaData => {
        const items: ArrayItem[] = [];
        const begin = iteration.current;

        while (token = iteration.next()) {
            const beginPos = iteration.current.range.begin;
            const expression = readExpression();

            if (token.kind !== "symbol") {
                throw new ProcessorError("Expected ']' or comma or range operator", token.range);
            }

            switch (token.value) {
                case "]": {
                    items.push({
                        kind: "single", expression,
                        range: Range.from(beginPos, iteration.last.range.end)
                    });

                    return {
                        meta: "array",
                        value: items
                    };
                };

                case ",": {
                    items.push({
                        kind: "single", expression,
                        range: Range.from(beginPos, iteration.last.range.end)
                    });
                } break;

                case "..": case "...": {
                    const inclusive = token.value === "..";

                    token = iteration.next();

                    const endValueExpression = readExpression();

                    if (token.kind !== "symbol") {
                        throw new ProcessorError("Expected '^' , ']' or coma", token.range);
                    }

                    let interpSteps: number | null = null;
                    let interpMode: string | null = null;

                    if (token.value === "^") {
                        token = iteration.next();

                        if (token.kind !== "value" || token.data.meta !== "number") {
                            throw new ProcessorError("Expected number", token.range);
                        }

                        interpSteps = token.data.value;

                        token = iteration.next();

                        if (token.kind === "symbol" && token.value === ":") {
                            token = iteration.next();

                            if (token.kind !== "none") {
                                throw new ProcessorError("Expected a transpolation mode", token.range);
                            }

                            interpMode = token.value;

                            token = iteration.next();
                        }
                    }

                    items.push({
                        kind: "range",
                        inclusive,
                        from: expression,
                        to: endValueExpression,
                        interpolation: {
                            steps: interpSteps,
                            mode: interpMode
                        },
                        range: Range.from(beginPos, iteration.last.range.end)
                    });

                    if (token.kind !== "symbol") {
                        throw new ProcessorError("Expected comma or ']'", token.range);
                    }

                    if (token.value == "]") {
                        return {
                            meta: "array",
                            value: items
                        };
                    } else if (token.value !== ",") {
                        throw new ProcessorError("Expected comma or ']'", token.range);
                    }

                } break;

                default: {
                    throw new ProcessorError("Expected ']' or comma or range operator", token.range);
                }
            }
        }

        throw new ProcessorError("Unclosed array", Range.between(begin, iteration.last));
    };

    const readBlock = (): UnresolvedBlockMetaData => {
        const properties: Property[] = [];
        const begin = iteration.current;

        let key = "";
        let state = "key";

        token = iteration.next();

        while (token) {
            if (token.kind === "symbol") {
                if (token.value === "}") {
                    return {
                        meta: "block",
                        value: properties
                    };
                }
            }

            switch (state) {
                case "key": {
                    if (token.kind !== "none") {
                        throw new ProcessorError("Expected key", token.range);
                    }

                    key = token.value;
                    state = "colon";
                } break;

                case "colon": {
                    if (token.kind !== "symbol" || token.value !== ":") {
                        throw new ProcessorError("Expected colon", token.range);
                    }

                    state = "object";
                } break;

                case "object": {
                    const beginPos = iteration.current.range.begin;

                    properties.push({
                        key, expression: readExpression(),
                        range: Range.from(beginPos, iteration.last.range.end)
                    });

                    state = "seperator";
                    continue;
                }

                case "seperator": {
                    if (token.kind !== "symbol" || (token.value !== "," && token.value !== ";")) {
                        throw new ProcessorError("Expected comma or semicolon", token.range);
                    }

                    state = "key";
                } break;
            }

            token = iteration.next();
        }

        throw new ProcessorError("Unclosed block", Range.between(begin, iteration.last));
    };

    return readExpression();
}