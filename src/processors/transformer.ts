import { Iteration } from "../iteration";
import { ProcessorError } from "../processor";
import { Range } from "../range";
import { PrimeMetaValue, Token, ValueToken } from "./tokenizer";



export type Property = { key: string; value: Node[]; }

export type BlockMetaValue = MetaValue<"block", Property[]>;
export type ArrayMetaValue = MetaValue<"array", Node[]>;
export type GroupMetaValue = MetaValue<"group", Node[]>;

export type CompoundMetaValue = BlockMetaValue | ArrayMetaValue | GroupMetaValue;
export type NodeMetaValue = CompoundMetaValue | PrimeMetaValue

export type Node = Token | ValueToken<CompoundMetaValue>

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
                    meta: "group",
                    value: nodes,
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
        let ranged = false;
        let seperator = false;

        while (token = iteration.next()) {
            last = token;

            if (token.kind === "symbol") {
                if (token.value === "]") {
                    return {
                        kind: "value",
                        meta: "array",
                        range: Range.between(beginToken, token),
                        value: items
                    };
                }

                if (seperator) {
                    if (token.value === ",") {
                        seperator = false;
                        continue;
                    } else if(token.value === ".." || token.value === "...") {
                        ranged = true;
                        continue;
                    }
                }

                
                
                throw new ProcessorError("Expected value or reference", token.range);






                // if (seperator === "seperator") {
                //     if (token.value === "," || token.value === ".." || token.value === "...") {
                //         seperator = "value";
                //         continue;
                //     }

                //     throw new ProcessorError("Expected comma or range operator", token.range);
                // }

                // throw new ProcessorError("Expected value or reference", token.range);
            }

            if (ranged) {
                if (token.kind != "value") {
                    throw new ProcessorError("Expected literal value: Range operator cannot be used with a reference", token.range);
                } else if (token.meta != "number") {
                    throw new ProcessorError("Expected number", token.range);
                }

                // if (ranged == "..") {

                //     for (let i = 0; i < token.value; i++) {
                //         items.push({ kind: "value", meta: "number", value: i, range: token.range });
                //     }


                // }
            }


            seperator = true;

            const node = transform(token);
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
                    meta: "block",
                    value: properties,
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