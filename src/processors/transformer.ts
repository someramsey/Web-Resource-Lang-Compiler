import { Iteration } from "../iteration";
import { Token } from "./tokenizer";

type Node = Token | {
    kind: "group" | "array" | "block"
};


export function transformer(tokens: Token[]) {
    const iteration = new Iteration(tokens);

    const output: Node[] = [];
    const errors: Error[] = [];

    let token: Token;

    const group = () => {
        while (token = iteration.next()) {
            console.log(token);
            if (token.kind === "symbol" && token.value === ")") {
                return;
            }
        }
    };

    while (token = iteration.next()) {
        if (token.kind === "symbol") {
            switch (token.value) {
                case "(": group(); break;
            }
        }
    }

    return {
        output,
        errors
    };
}