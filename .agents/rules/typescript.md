# Règles TypeScript

Ces règles définissent la manière de concevoir les types dans les projets DuploJS.

## 1. Nommer explicitement les génériques et les valeurs inférées

Préfixer les génériques avec `Generic` et les valeurs produites par `infer` avec `Inferred`.

```ts
export type GetPropsWithValueExtends<
	GenericObject extends object,
	GenericValue extends unknown,
> = {
	[Prop in keyof GenericObject]-?:
	GenericObject[Prop] extends infer InferredValue
		? InferredValue extends GenericValue
			? Prop
			: never
		: never;
}[keyof GenericObject];
```

Le nom doit décrire le rôle de la valeur : `GenericObject`, `GenericOutput`, `InferredResult`, etc.

## 2. Toujours contraindre les génériques

Chaque générique doit déclarer explicitement ce qu’il accepte, même lorsque sa contrainte est `unknown`.

### Éviter

```ts
type PrependAll<GenericHead, GenericArray> =
	GenericArray extends readonly unknown[]
		? [GenericHead, ...GenericArray]
		: never;
```

### Préférer

```ts
type PrependAll<
	GenericHead extends unknown,
	GenericArray extends readonly unknown[],
> = [GenericHead, ...GenericArray];
```

Placer les relations entre génériques dans leurs contraintes lorsque cela correspond au contrat attendu.

```ts
type PrependAllStrict<
	GenericArray extends readonly unknown[],
	GenericHead extends GenericArray[number],
> = [GenericHead, ...GenericArray];
```

Le choix entre une version permissive et une version stricte dépend de l’API voulue. Il doit être volontaire.

## 3. Soigner le type affiché au développeur

Un type peut être correct tout en restant difficile à lire si TypeScript affiche son calcul au lieu de son résultat.

```ts
type ComputeResult<
	GenericGroup extends Record<string, unknown>,
> = {
	[Prop in keyof GenericGroup]: Unwrap<GenericGroup[Prop]>;
};
```

TypeScript peut afficher :

```ts
const result: ComputeResult<{
	readonly name: E.Success<"value">;
}>;
```

alors que le résultat utile est :

```ts
const result: {
	readonly name: "value";
};
```

Lorsque l'intention est de montrer le produit d'un calcul, forcer TypeScript à résoudre le type à l'endroit où ce résultat doit devenir visible ou servir à une nouvelle étape de calcul.

```ts
type ComputeResult<
	GenericGroup extends Record<string, unknown>,
> = SimplifyTopLevel<{
	[Prop in keyof GenericGroup]: Unwrap<GenericGroup[Prop]>;
}>;
```

Selon le cas, un `infer`, un `Extract` ou un type de simplification peut suffire.

Il ne faut cependant pas chercher à afficher systématiquement la structure réelle d'un type. Certains types sont volontairement représentés par un wrapper public qui masque leur implémentation et ne conserve que les informations utiles.

```ts
const Name = DClean.createNewType(
	"name",
	DClean.String,
	[DClean.StringMin(3)],
);
```

La valeur retournée est un handler dont la structure réelle contient plusieurs propriétés et méthodes. Pourtant, TypeScript l'affiche volontairement sous une forme encapsulée :

```ts
const Name: DClean.NewTypeHandler<
	"name",
	string,
	NoInfer<readonly [
		DClean.ConstraintHandler<
			"string-min-3",
			string,
			readonly [DataParserCheckerStringMin],
			never
		>
	]>,
	never
>;
```

Ce rendu n'expose pas la structure complète du handler. Il montre uniquement les informations utiles à son identification et à son usage :

- le nom du new type ;
- son type primitif ;
- ses contraintes.

Le type construit par ce handler suit la même logique. Il peut être récupéré avec un utilitaire dédié :

```ts
type NameValue = DClean.GetNewType<typeof Name>;
```

et être affiché sous une forme volontairement wrappée :

```ts
type NameValue = DClean.NewType<
	"name",
	string,
	"string-min-3"
>;
```

Ici, il ne faut pas forcer l'affichage de la structure interne réelle du handler ou de la valeur construite. Le wrapper est le rendu attendu : il masque les détails inutiles tout en conservant les informations importantes pour le développeur.

La décision dépend donc de l'intention :

- si un type représente le calcul d'un résultat, afficher autant que possible le résultat calculé ;
- si un type représente un concept public encapsulé, conserver son wrapper ;
- ne simplifier un type que lorsque cela améliore réellement sa lecture ou permet la suite du calcul.

Le rendu final doit montrer les informations utiles au développeur, pas nécessairement la structure complète du type.

## 4. Le typage public n’a pas à reproduire l’implémentation

Les déclarations publiques décrivent le contrat proposé au développeur. L’implémentation peut utiliser un typage plus large lorsque TypeScript ne peut pas prouver simplement ce que le runtime garantit.

```ts
type ComputeResult<
	GenericString extends string,
	GenericSearchString extends string,
> = Extract<
	GenericString,
	`${GenericSearchString}${string}`
> extends infer InferredResult extends GenericString
	? IsEqual<InferredResult, never> extends true
		? GenericString & `${GenericSearchString}${string}`
		: InferredResult
	: never;

export function startsWith<
	GenericString extends string,
	GenericSearchString extends string,
>(
	input: GenericString,
	searchString: GenericSearchString,
): input is ComputeResult<GenericString, GenericSearchString>;

export function startsWith(
	...args:
		| [input: string, searchString: string]
		| [searchString: string]
): any {
	if (args.length === 1) {
		const [searchString] = args;
		return (input: string) => startsWith(input, searchString);
	}

	const [input, searchString] = args;
	return input.startsWith(searchString);
}
```

Ne pas dégrader l’API ou complexifier le runtime uniquement pour faire correspondre parfaitement le typage interne. Le contrat public et le comportement runtime doivent en revanche être validés ensemble par les tests.

## 5. Optimiser les calculs de types

Éviter de recalculer plusieurs fois le même type complexe. Capturer un résultat intermédiaire avec `infer` lorsqu’il doit être réutilisé.

### Éviter

```ts
type SubsetsBad<
	GenericArray extends readonly unknown[],
> = GenericArray extends readonly [
	infer InferredHead,
	...infer InferredRest extends readonly unknown[],
]
	? (
		| SubsetsBad<InferredRest>
		| PrependAll<InferredHead, SubsetsBad<InferredRest>>
	)
	: [];
```

### Préférer

```ts
type SubsetsGood<
	GenericArray extends readonly unknown[],
> = GenericArray extends readonly [
	infer InferredHead,
	...infer InferredRest extends readonly unknown[],
]
	? SubsetsGood<InferredRest> extends infer InferredSubsets
		? (
			| InferredSubsets
			| PrependAll<InferredHead, InferredSubsets>
		)
		: never
	: [];
```

Penser au sens du calcul, aux distributions sur les unions, aux récursions et aux références circulaires. Un type correct ne doit pas dégrader inutilement les performances du serveur TypeScript.

## 6. Composer avec les types utilitaires existants

Avant d’écrire un calcul complexe, rechercher les types déjà présents dans le projet et dans les dépendances DuploJS installées.

Préférer leur composition lorsqu’ils expriment clairement l’intention et évitent de réécrire un calcul déjà testé et optimisé.

```ts
type ForbiddenDate<
	GenericDate extends string,
> = And<[
	IsExtends<GenericDate, SafeDate>,
	Not<IsEqual<GenericDate, SafeDate>>,
]> extends true
	? GenericDate & ComputedRules<GenericDate>
	: GenericDate;
```

```ts
Or<[
	IsExtends<GenericOutput, Promise<unknown>>,
	IsExtends<InferredEffect, Finalizer<Promise<unknown>>>,
	IsExtends<InferredEffect, Defer<Promise<unknown>>>,
]> extends true
	? AsyncResult
	: SyncResult;
```

Chercher d’abord localement, puis dans les packages DuploJS disponibles, notamment les packages de langage ou d’utilitaires. Ne pas recréer localement un équivalent de `IsEqual`, `IsExtends`, `IsNever`, `And`, `Or`, `Not` ou d’un autre helper déjà disponible.

Ne pas détourner un type existant si son intention ne correspond pas au calcul recherché.

## 7. Vérifier les cas valides et invalides

Un type n’est pas validé uniquement parce que son cas nominal fonctionne. Tester également les limites du contrat.

```ts
type Valid = PrependAllStrict<[1, 2], 1>;

// doit produire une erreur
// @ts-expect-error 3 n'appartient pas au tuple
type Invalid = PrependAllStrict<[1, 2], 3>;
```

Pendant la conception, utiliser des tests TypeScript localisés pour vérifier :

- le résultat inféré ;
- les littéraux et tuples conservés ;
- les usages refusés ;
- le message d’erreur obtenu ;
- les cas limites du type.

## 8. Rendre explicites les erreurs complexes quand cela apporte une vraie valeur

Lorsqu’une contrainte publique produit une erreur TypeScript difficile à comprendre, `ComputedTypeError` peut exposer un message plus direct.

```ts
type ForbiddenMoreKey<
	GenericInput extends Primitive<number>,
	GenericMatcher extends ComputeMatcher<GenericInput>,
> = Exclude<
	keyof GenericMatcher,
	Unwrap<GenericInput>
> extends infer InferredKey
	? IsEqual<InferredKey, never> extends true
		? unknown
		: ComputedTypeError<
			`Key "${Extract<InferredKey, number>}" is forbidden.`
		>
	: never;
```

Cette technique est surtout utile pour les entrées, les relations entre arguments et les APIs déclaratives. Inclure les valeurs inférées utiles dans le message lorsque cela aide à corriger l’appel.

Ne pas l’utiliser pour une erreur déjà claire ou pour chaque `never` interne. Le message doit réellement améliorer la compréhension.
