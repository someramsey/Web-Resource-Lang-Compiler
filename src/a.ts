type Wrapper<A, B> = { a: A, b: B };
type Wrappers = Wrapper<"a", 1> | Wrapper<"b", 2>;

type A<T extends Wrappers = Wrappers> = {
    a: T["a"];
    b: T["b"];
}

const a: A = {
    a: "a",
    b: 2
}