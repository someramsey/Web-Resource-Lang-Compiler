import { Expression, ValueLiteralExpression } from "./expression";
import { BlockMetaData } from "./meta";

export type Assignment = {
    type: "assignment";
    identifier: string;
    expression: Expression;
};

export type ThemeDefinition = {
    type: "theme";
    identifier: string;
    expression: ValueLiteralExpression<BlockMetaData>;
}

export type FontDefinition = {
    type: "font";
    identifier: string;
    expression: ValueLiteralExpression<BlockMetaData>;
    source: string | null
}

export type Instruction = Assignment | ThemeDefinition | FontDefinition;