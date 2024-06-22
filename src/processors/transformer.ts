import { Iteration } from "../iteration";
import { ProcessorResult } from "../processor"; 
import { Token } from "./tokenizer";

let predicate: ((token: Token) => void) | null;

function group(token: Token) {
    console.log(token);
    if (token.kind === "symbol" && token.value === ")") {
        predicate = null;
    }
}

export function transformer(tokens: Token[]) {
    const iteration = new Iteration(tokens);
    let token: Token;

    while (token = iteration.next()) {
        if (predicate) {
            predicate(token);
            continue;
        }

        if (token.kind === "symbol") {
            switch (token.value) {
                case "(":
                    predicate = group;
                    break;
            }
        }
    }
}