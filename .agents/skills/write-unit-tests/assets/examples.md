# Exemples de tests de types

Ces exemples illustrent le placement des assertions de types. Ils doivent être adaptés au contrat de la fonction testée.

## Entrée et sortie d'une API

```ts
const parser = DDataParser.extended.coercer(
	DDataParser.extended.number(),
);

type _CheckOutput = ExpectType<
	DDataParser.Output<typeof parser>,
	number,
	"strict"
>;

type _CheckInput = ExpectType<
	DDataParser.Input<typeof parser>,
	string | number | bigint | boolean | null,
	"strict"
>;

expect(parser.parse("42")).toStrictEqual(DEither.success(42));
```

## Conservation exacte d'un type intermédiaire

```ts
const inner = DDataParser.extended.number().min(4).max(10);
const parser = inner.coerce();

type _CheckInner = ExpectType<
	typeof parser.definition.inner,
	typeof inner,
	"strict"
>;

expect(parser.definition.inner).toBe(inner);
```

## Narrowing d'une sortie sans modifier l'entrée

```ts
const parser = DDataParser.extended
	.number()
	.coerce()
	.addChecker(
		DDataParser.checkerRefine(
			(value): value is 42 => value === 42,
		),
	);

type _CheckOutput = ExpectType<
	DDataParser.Output<typeof parser>,
	42,
	"strict"
>;

type _CheckInput = ExpectType<
	DDataParser.Input<typeof parser>,
	string | number | bigint | boolean | null,
	"strict"
>;
```

## Inférence dans un pipe

```ts
const result = pipe(
	input,
	DNamespace.functionName(params),
);

type _CheckResult = ExpectType<
	typeof result,
	ExpectedResult,
	"strict"
>;
```

Utiliser ce dernier exemple uniquement lorsque la fonction possède une signature curryfiée et que le pipe apporte une vérification d'inférence utile.

## Narrowing d'un predicate dans un pipe

```ts
const result = pipe(
	input,
	when(
		DNamespace.functionName(predicateParams),
		(value) => {
			type _CheckValue = ExpectType<
				typeof value,
				NarrowedInput,
				"strict"
			>;

			return transform(value);
		},
	),
);
```

Utiliser `when` ou une autre API de composition qui donne accès à la valeur narrowée. `DNamespace.functionName(predicateParams)` représente la fonction testée lorsqu'elle est elle-même un predicate curried. Omettre `predicateParams` lorsque le predicate ne prend aucune configuration.

Ne pas appliquer cet exemple tel quel à une fonction qui accepte une callback predicate en paramètre, comme `find` ou `filter`. Dans ce cas, tester la callback predicate comme un argument de l'API concernée.

## Appel refusé par l'API

```ts
if (false) {
	// @ts-expect-error invalid argument relation.
	DNamespace.functionName(invalidInput, invalidParam);
}
```

Utiliser `@ts-expect-error` pour vérifier les limites publiques de l'API : contraintes entre arguments, types trop larges, incompatibilités de branded types ou valeurs non littérales exigées.
