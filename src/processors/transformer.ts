import { Iteration } from "../iteration";
import { ProcessorError } from "../processor"; 
import { Range } from "../range";
import { PrimeMetaValue, Token, ValueToken } from "./tokenizer";

export type Property = { key: string; value: Node[]; }

export type BlockMetaValue = MetaValue<"block", Property[]>;
export type ArrayMetaValue = MetaValue<"array", Node[]>;
export type GroupMetaValue = MetaValue<"group", Node[]>;

export type CompoundMetaValue = BlockMetaValue | ArrayMetaValue | GroupMetaValue;
export type NodeMetaValue = CompoundMetaValue | PrimeMetaValue;

export type Node = Token | ValueToken<CompoundMetaValue>;

export function isCompound(node: Node): node is ValueToken<CompoundMetaValue> {
    return node.kind === "value" && (
        node.metaValue.meta === "block" ||
        node.metaValue.meta === "array" ||
        node.metaValue.meta === "group"
    );
}

export function transformer(tokens: Token[]) {
    const iteration = new Iteration(tokens);

    const output: Node[] = [];
    const errors: ProcessorError[] = [];

    let token: Token;

    const group = (beginToken: Token): ValueToken<CompoundMetaValue> => {
        const nodes: Node[] = [];
        let last;

        while (token = iteration.next()) {
            last = token;
            nodes.push(transform(token));

            if (token.kind === "symbol" && token.value === ")") {
                return {
                    kind: "value",
                    metaValue: {
                        meta: "group",
                        value: nodes,
                    },
                    range: Range.between(beginToken, token)
                };
            }
        }

        throw new ProcessorError("Unclosed group", Range.from(beginToken.range.begin, last.range.end));
    };

    const array = (beginToken: Token): ValueToken<ArrayMetaValue> => {
        const items: Node[] = [];

        //TODO: Keep safely throwing until end of array to parse more info

        let last;
        let state = "value";

        while (token = iteration.next()) {
            last = token;

            if (token.kind === "symbol") {
                if (token.value === "]") {
                    return {
                        kind: "value",
                        metaValue: {
                            meta: "array",
                            value: items
                        },
                        range: Range.between(beginToken, token),
                    };
                } else if (token.value === ",") {
                    if (state !== "seperator" && state !== "comma") {
                        throw new ProcessorError("Expected value or reference", token.range);
                    }

                    state = "value";
                    continue;
                } else if (token.value === ".." || token.value === "...") {
                    if (state !== "seperator") {
                        throw new ProcessorError("Expected value or reference", token.range);
                    }

                    state = "range-value";
                    continue;
                }

                throw new ProcessorError("Expected value or reference", token.range);
            }

            if (state === "value") {
                state = "seperator";
            } else if (state === "range-value") {
                state = "comma";
            }

            items.push(transform(token));
        }

        throw new ProcessorError("Unclosed array", Range.from(beginToken.range.begin, last.range.end));
    };

    const block = (beginToken: Token): ValueToken<BlockMetaValue> => {
        const properties: Property[] = [];

        let last;
        let expected = "key";

        let key: string;
        let value: Node[];

        const completeProperty = () => {
            properties.push({ key, value });
        }

        while (token = iteration.next()) {
            last = token;

            if (token.kind === "symbol" && token.value === "}") {
                if (expected !== "key") {
                    completeProperty();
                }

                return {
                    kind: "value",
                    metaValue: {
                        meta: "block",
                        value: properties,
                    },
                    range: Range.from(beginToken.range.begin, token.range.end)
                };
            }

            switch (expected) {
                case "key": {
                    if (token.kind !== "none") {
                        throw new ProcessorError("Expected key", token.range);
                    }

                    key = token.value;
                    expected = "colon";
                } break;

                case "colon": {
                    if (token.kind !== "symbol" || token.value !== ":") {
                        throw new ProcessorError("Expected colon", token.range);
                    }

                    expected = "value";
                } break;

                case "value": {
                    value = [transform(token)];
                    expected = "property-end";
                } break;

                case "property-end": {
                    if (token.kind === "symbol" && (token.value === "," || token.value === ";")) {
                        expected = "key";
                        completeProperty();
                        continue;
                    }

                    value!.push(token);
                }
            }
        }

        throw new ProcessorError("Unclosed block", Range.from(beginToken.range.begin, last.range.end));
    };

    const transform = (token: Token): Node => {
        if (token.kind === "symbol") {
            try {
                switch (token.value) {
                    case "(": return group(token);
                    case "[": return array(token);
                    case "{": return block(token);
                }
            } catch (error) {
                errors.push(error as ProcessorError);
            }
        }

        return token;
    }

    while (token = iteration.next()) {
        output.push(transform(token));
    }

    return {
        output,
        errors
    };
}