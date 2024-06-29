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

        let state = "object";

        while (token = iteration.next()) {
            switch (state) {
                case "object": {
                    if (token.kind == "none") {
                        const nodes: Node[] = [];

                        while (token = iteration.next()) {
                            if (token.kind === "symbol") {
                                if (token.value === "...") {

                                    break;
                                }

                            }

                            nodes.push(transform(token));
                        }

                        items.push({ kind: "single", value: nodes });
                    }

                } break;
            }
        }
        throw new ProcessorError("Unclosed array", Range.from(begin.range.begin, iteration.last.range.end));
    };

    const block = (): ValueToken<BlockMetaData<Node[]>> => {
        const properties: Property<Node[]>[] = [];
        const begin = iteration.current;

        while (token = iteration.next()) {

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