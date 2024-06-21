import { Iteration } from "../iteration";

export function lexer(input: string) {
    const iteration = new Iteration(input);
    let value: string;

    while (value = iteration.next()) {
        console.log(value);
    }
}