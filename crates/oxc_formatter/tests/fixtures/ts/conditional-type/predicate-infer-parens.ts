// A type predicate only needs parens when its `infer` has a constraint
type A<t> = t extends (x: any) => x is infer n ? n : never;
type B<t> = t extends ((x: any) => x is infer n extends string) ? n : never;
type C<t> = t extends ((x: any) => infer n extends string) ? n : never;
type D<t> = t extends (x: any) => asserts x is string ? 1 : 0;
