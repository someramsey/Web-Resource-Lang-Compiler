import { Iteration } from "../iteration";
import { ProcessorError } from "../processor";
import { Range } from "../range";
import { Token } from "./tokenizer";


type Compound<T> = {
    kind: T;
    children: Node[];
    range: Range;
};

type Node = Token | Compound<"group" | "array" | "block">;


export function transformer(tokens: Token[]) {
    const iteration = new Iteration(tokens);

    const output: Node[] = [];
    const errors: ProcessorError[] = [];

    let token: Token;

    const group = (beginToken: Token): Compound<"group"> => {
        const nodes: Node[] = [];
        let last;

        while (token = iteration.next()) {
            last = token;
            nodes.push(transform(token));

            if (token.kind === "symbol" && token.value === ")") {
                return {
                    kind: "group",
                    children: nodes,
                    range: Range.from(beginToken.range.begin, token.range.end)
                };
            }
        }

        throw new ProcessorError("Unclosed group", Range.from(beginToken.range.begin, last.range.end));
    };

    const array = (beginToken: Token): Compound<"array"> => {
        const nodes: Node[] = [];
        let expectedComa = false;

        while (token = iteration.next()) {
            if (token.kind === "symbol") {
                if (token.value === "]") {
                    return {
                        kind: "array",
                        children: nodes,
                        range: Range.from(beginToken.range.begin, token.range.end),
                    };
                }

                if (expectedComa) {
                    if (token.value !== ",") {
                        throw new ProcessorError("Expected coma", token.range);
                    }

                    expectedComa = false;
                    continue;
                }

                throw new ProcessorError("Expected value", token.range);
            }

            expectedComa = true;
            nodes.push(transform(token));
        }

        throw new ProcessorError("Unclosed array", beginToken.range);
    };

    const transform = (token: Token): Node  => {
        if (token.kind === "symbol") {
            switch (token.value) {
                case "(": return group(token); //temporarily ignore nullability until error handling is completed
                case "[": return array(token);
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