# Resource Lang Compiler

This is a compiler for the Resource Language, specifically designed to manage fonts, themes, and other web application resources within a single file.

## Syntax and Examples

All values are defined in a JSON-like format, with 3 primary types: `string`, `number`, and `hex color` which can be wrapped by Blocks and Arrays.

```js
let a: 10;
let b: "Some string";
let c: #ff0000;

let array: [ a, b, c ];

let block: {
    child: a
};
```

There are two kinds of Definitions, Fonts and Themes which are both defined straight-forward with their own keywords `font` and `theme`. Themes only require a block with any kind of properties.

```js
theme light: {
    background: #ffffff;
    text: #000000;
};
```

Fonts however can only specify known properties: `weights`, and `style`, but because they are optional they can be used in any combination. The source of the font can be specifed with the `from` keyword as path or a url.


```js
font name: {
    weights: [ 400, 700 ];
    style: [ "normal", "italic", "oblique" ];
} from "path";
```

```js
font single: {
    weights: 400
} from "url";
```

```js
font allStyles: {
    style: "all"
} from "filename";
```

## Compilation Steps

The compiler only accepts a string input, and returns the result as a `CompilationResult` object. The result contains the resolved definitions, and any errors that may have occured during the compilation. The input is passed through 3 processors: [`Tokenizer`](src/core/processors/tokenizer.ts), [`Parser`](src/core/processors/parser.ts), and [`Resolver`](src/core/processors/resolver.ts).

The Tokenizer breaks the input into three different kinds of tokens, `Symbol`, `Value` and `None`. The Value tokens are special because they contain a `MetaData` object. At this stage the Value Tokens can only have basic data types called `PrimeMetaData` these include `string`, `number`, and `hex color`. 

The Parser then groups the tokens into `UnresolvedDefinition` objects. These objects contain an `Expression` for the actual body of the definition and are created by the sub-processor of the parser called the [`Transformer`](src/core/processors/transformer.ts). The Transformer is responsible for creating the `Expression` objects and expands the Value Tokens to include structural data types such as Arrays, Blocks and Groups. These are called `CompoundMetaData`. \ 
In the end the Parser output two collections one for 'bindings' and one for 'definitions'. The bindings collection contains all the assignments (The objects made with `let` keyword) and the definitions collection contains all the definitions (`font` and `theme` definitions).

The Resolver finally uses the bindings to resolve the references used in the definition bodies and fabricates values that need extra processing such as ranged array items. In the end all the definitions are resolved and returned in an array.

The `CompilationResult` contains the resolved definitions and errors that may have occured during any of these steps.

## Building and Running

You need typescript installed to build the project.

- Clone the repository
- Run `npm install`
- Run `npm run build`

There is already an existing script that runs the compiler with one of the example files. You can run it with `npm run test-basic <file>`

![image](https://github.com/user-attachments/assets/52c5ba2b-bea7-4dad-bb5a-d7bcf743e68a)
