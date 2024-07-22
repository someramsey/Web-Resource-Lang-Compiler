import { Expression, ExpressionExtender, ValueLiteralExpression } from "../expression";
import { Iteration } from "../iteration";
import { ArrayItem, ArrayMetaData, BlockMetaData, CompoundMetaData, GroupMetaData, PrimeMetaData, Property } from "../meta";
import { ProcessorError } from "../processor";
import { Range } from "../range";
import { Token, ValueToken } from "./tokenizer";

export type NodeMetaData = PrimeMetaData | CompoundMetaData;
export type Node = Token | ValueToken<CompoundMetaData>;

export function transformer(tokens: Token[]): Expression {
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
            const value: ValueLiteralExpression = {
                kind: "literal",
                data: node.data
            };

            token = iteration.next();

            return value;
        } else if (node.kind == "none") {
            return {
                kind: "reference",
                name: node.value,
                extenders: readExpressionExtenders()
            };
        }

        throw new ProcessorError("Expected expression", node.range);
    };

    
    const transform = (token: Token): Node => {
        if (token.kind !== "symbol") {
            return token;
        }

        const begin = iteration.current;
        let data: CompoundMetaData;

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

    const readGroup = (): GroupMetaData => {
        token = iteration.next();

        const expression = readExpression();

        if (token.kind !== "symbol" || token.value !== ")") {
            throw new ProcessorError("Expected ')'", token.range);
        }

        return {
            meta: "group",
            value: expression
        };
    };

    const readArray = (): ArrayMetaData => {
        const items: ArrayItem[] = [];
        const begin = iteration.current;

        while (token = iteration.next()) {
            const expression = readExpression();

            if (token.kind !== "symbol") {
                throw new ProcessorError("Expected ']' or comma or range operator", token.range);
            }

            switch (token.value) {
                case "]": {
                    items.push({ kind: "single", expression });

                    return {
                        meta: "array",
                        value: items
                    };
                };

                case ",": {
                    items.push({
                        kind: "single",
                        expression
                    });
                } break;

                case "..": case "...": {
                    const inclusive = token.value === "..";

                    token = iteration.next();

                    items.push({
                        kind: "range",
                        inclusive,
                        from: expression,
                        to: readExpression()
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

    const readBlock = (): BlockMetaData => {
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
                    properties.push({
                        key, expression: readExpression()
                    });

                    state = "seperator";
                    continue;
                };

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