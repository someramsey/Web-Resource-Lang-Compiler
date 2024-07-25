import { ResolvedBlockData } from "./core/processors/resolver";
import { Expression } from "./expression";

export type Assignment = {
    type: "assignment";
    identifier: string;
    body: Expression
};

type Resolvable<T> = T | Expression;

export type ThemeDefinition<TData extends Resolvable<ResolvedBlockData>> = {
    type: "theme";
    identifier: string;
    body: TData;
};
export type FontDefinition<TData extends Resolvable<FontDefinitionData>> = {
    type: "font";
    identifier: string;
    source: string | null;
    body: TData;
};

export type FontDefinitionData = {
    weights: number[] | null;
    style: "normal" | "italic" | "oblique" | null;
};


export type Definition = ThemeDefinition<ResolvedBlockData> | FontDefinition<FontDefinitionData>;
export type UnresolvedDefinition = ThemeDefinition<Expression> | FontDefinition<Expression> | Assignment;