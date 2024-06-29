import { Iteration } from "../iteration";
import { ArrayItem, ArrayMetaData, BlockMetaData, CompoundMetaData, GroupMetaData, PrimeMetaData, Property } from "../meta";
import { ProcessorError } from "../processor";
import { Range } from "../range";
import { Token, ValueToken } from "./tokenizer";

type CompoundNodeMetaData = CompoundMetaData<Node[]>;

export type NodeMetaData = PrimeMetaData | CompoundNodeMetaData;
export type Node = Token | ValueToken<CompoundNodeMetaData>;

export function isCompound(node: Node): node is ValueToken<CompoundMetaData> {
    return node.kind === "value" && (
        node.data.meta === "block" ||
        node.data.meta === "array" ||
        node.data.meta === "group"
    );
}

//TODO: Keep safely throwing until end of array to parse more info
//TODO: Move the part of the evaluation to the transformer
export function transformer(tokens: Token[]) {
    const iteration = new Iteration(tokens);

    const output: Node[] = [];
    const errors: ProcessorError[] = [];

    let token: Token;


    const readObject = () => {
        if (token.kind == "value") {
            const val = { ...token };
            token = iteration.next();

            return [val];
        } else if (token.kind == "none") {
            const nodes: Node[] = [token];

            while (token = iteration.next()) {
                if (token.kind === "symbol" && token.value !== ".") {
                    return nodes;
                }

                nodes.push(transform(token));
            }

            throw new ProcessorError("Unclosed array", iteration.last.range);
        }

        throw new ProcessorError("Expected object", token.range);
    };

    const group = (): ValueToken<GroupMetaData<Node[]>> => {
        const nodes: Node[] = [];
        const begin = iteration.current;

        while (token = iteration.next()) {
            nodes.push(transform(token));

            if (token.kind === "symbol" && token.value === ")") {
                return {
                    kind: "value",
                    data: {
                        meta: "group",
                        value: nodes,
                    },
                    range: Range.between(begin, token)
                };
            }
        }

        throw new ProcessorError("Unclosed group", Range.from(begin.range.begin, iteration.last.range.end));
    };

    const array = (): ValueToken<ArrayMetaData<Node[]>> => {
        const items: ArrayItem<Node[]>[] = [];
        const begin = iteration.current;

        while (token = iteration.next()) {
            const object = readObject();

            if (token.kind === "symbol") {
                if (token.value === "]") {
                    return {
                        kind: "value",
                        data: {
                            meta: "array",
                            value: items
                        },
                        range: Range.between(begin, token)
                    };
                }

                if (token.value === ",") {
                    items.push({ kind: "single", value: object });
                } else if (token.value === ".." || token.value === "...") {
                    const inclusive = token.value === "..";

                    token = iteration.next();

                    items.push({ kind: "range", inclusive, from: object, to: readObject() });
                }
            } else {
                throw new ProcessorError("Expected comma or range operator", token.range);
            }
        }

        throw new ProcessorError("Unclosed array", Range.from(begin.range.begin, iteration.last.range.end));
    };

    const block = (): ValueToken<BlockMetaData<Node[]>> => {
        const properties: Property<Node[]>[] = [];
        const begin = iteration.current;

        let key = "";
        let state = "key";

        while (token = iteration.next()) {
            if (token.kind === "symbol") {
                if (token.value === "}") {
                    return {
                        kind: "value",
                        data: {
                            meta: "block",
                            value: properties
                        },
                        range: Range.between(begin, token)
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
                    properties.push({ key, value: readObject() });
                    state = "seperator";
                } break;

                case "seperator": {
                    if (token.kind !== "symbol" || (token.value !== "," && token.value !== ";")) {
                        throw new ProcessorError("Expected comma or semicolon", token.range);
                    }

                    state = "key";
                } break;
            }

        }

        throw new ProcessorError("Unclosed block", Range.from(begin.range.begin, iteration.last.range.end));
    };

    const transform = (token: Token): Node => {
        if (token.kind === "symbol") {
            try {
                switch (token.value) {
                    case "(": return group();
                    case "[": return array();
                    case "{": return block();
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

    return { output, errors };
}