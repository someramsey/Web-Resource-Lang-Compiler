import { Expression, ValueLiteralExpression } from "./expression";
import { BlockMetaData } from "./meta";

export type Assignment<T extends Expression> = {
    type: "assignment";
    identifier: string;
    expression: T;
};

export type ThemeDefinition<T extends Expression> = {
    type: "theme";
    identifier: string;
    expression: ValueLiteralExpression<BlockMetaData<T>>;
}

export type FontDefinition<T extends Expression> = {
    type: "font";
    identifier: string;
    expression: ValueLiteralExpression<BlockMetaData<T>>;
    source: string | null
}

export type Instruction<T extends Expression = Expression> = Assignment<T> | ThemeDefinition<T> | FontDefinition<T>;

