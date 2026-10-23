// The tab after `:` takes no columns when measuring the alternate (Prettier's string width skips `\t`)
type K<operandAst, $, args> =
	inferAstRoot<operandAst, $, args> extends infer data ?
		[data] extends [object] ?
			validateAst<operandAst, $, args>
		:	ErrorMessage<writeNonStructuralOperandMessage<"keyof", typeToString<data>>>
	:	never;

const v =
	r.hasDefault() ?
		l.default === r.default ?
			l.default
		:	throwParseError(writeDefaultIntersectionMessage(l.default, r.default))
	:	l.default;
