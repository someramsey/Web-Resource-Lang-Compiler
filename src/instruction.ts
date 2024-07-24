import { Expression } from "./expression";
import { PrimeMetaData } from "./meta";

export type Assignment = {
    type: "assignment";
    identifier: string;
    data: Expression
};


type ThemeDefinitionBlock = { [key: string]: PrimeMetaData | ThemeDefinitionBlock }

export type ThemeDefinition = {
    type: "theme";
    identifier: string;
} & Resolvable<ThemeDefinitionBlock>;

export type FontDefinition = {
    type: "font";
    identifier: string;
    source: string | null;
} & Resolvable<{
    weights: number[] | null;
    style: "normal" | "italic" | "oblique" | null;
}>;

export type Resolvable<TData> = { data: TData | Expression; }
export type Resolved<T extends Resolvable<any>> = T extends Resolvable<infer TData> ? TData : never;

export type Directive = Assignment | ThemeDefinition | FontDefinition;
export type Definition = Resolved<(ThemeDefinition | FontDefinition)>;
