# Règles d’écriture du code

Ce document définit les conventions de code propres aux projets DuploJS.

## 1. Concevoir les fonctions autour de leur contrat public

Une fonction publique est définie par ses formes d’appel, son comportement observable et l’expérience proposée à l’utilisateur.

Chaque usage distinct doit disposer d’une déclaration dédiée, notamment pour distinguer :

- l’appel direct et l’appel curried ;
- un predicate simple et un type predicate ;
- un tableau large et un tuple lorsque l’information peut être préservée.

Les déclarations publiques doivent fournir le résultat le plus précis possible. Ne pas les élargir uniquement pour simplifier l’implémentation.

```ts
export function findLast<
	GenericArray extends readonly unknown[],
	GenericOutput extends GenericArray[number],
>(
	predicate: (
		element: GenericArray[number],
		params: ArrayFindLastParams,
	) => element is GenericOutput,
): (input: GenericArray) => GenericOutput | undefined;

export function findLast<
	GenericElement extends unknown,
	GenericOutput extends GenericElement,
>(
	input: readonly GenericElement[],
	predicate: (
		element: GenericElement,
		params: ArrayFindLastParams,
	) => element is GenericOutput,
): GenericOutput | undefined;
```

## 2. Toujours séparer les déclarations publiques de l’implémentation

Même lorsqu’une fonction ne possède qu’une seule forme d’appel, écrire séparément :

1. la déclaration publique ;
2. la signature d’implémentation.

La déclaration publique décrit l’API. La signature d’implémentation peut être plus large afin de simplifier le corps de la fonction.

Lorsqu’il existe plusieurs formes d’appel, représenter les arguments avec une union de tuples nommés.

### Préférer

```ts
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
	// implementation
}
```

### Éviter

```ts
export function startsWith(
	inputOrSearchString: string,
	searchString?: string,
): boolean {
	// implementation
}
```

La signature d’implémentation peut utiliser des types plus larges, des assertions locales ou un retour `any` lorsque les déclarations publiques garantissent déjà le contrat.

Le dispatch doit rester simple. Utiliser `args.length`, une propriété discriminante ou une condition directe plutôt qu’une abstraction générique.

## 3. Mutualiser l’algorithme entre les formes d’appel

La forme curried doit réutiliser la forme directe lorsque les deux partagent le même comportement.

### Préférer

```ts
if (args.length === 1) {
	const [predicate] = args;
	return (input: readonly unknown[]) => findLast(input, predicate as never);
}
```

Ne pas dupliquer l’algorithme dans chaque branche.

## 4. Préserver l’orientation fonctionnelle de l’API

Les API publiques doivent favoriser la composition, le piping, les entrées et sorties explicites et l’absence d’état caché.

Cette contrainte concerne l’API, pas la forme interne du code. Une boucle ou une variable locale est préférable à une chaîne d’abstractions plus lente ou moins lisible.

```ts
for (let index = input.length - 1; index >= 0; index--) {
	const item = input[index]!;

	if (predicate(item, { index })) {
		return item;
	}
}
```

## 5. Préserver les informations utiles des entrées

Accepter les collections en lecture seule lorsqu’aucune mutation n’est nécessaire.

```ts
readonly GenericElement[]
```

Utiliser un générique sur la collection complète lorsque le tuple, les littéraux ou la structure exacte améliorent la sortie.

```ts
GenericArray extends readonly unknown[]
```

Utiliser un générique sur l’élément lorsque seule la nature homogène des valeurs est utile.

```ts
GenericElement extends unknown
```

Ne pas élargir prématurément une information utile au contrat public.

## 6. Structurer les paramètres secondaires

Lorsqu’une fonction ou un callback reçoit trop d’informations secondaires, les regrouper dans un objet `params` plutôt que multiplier les arguments positionnels.

```ts
predicate(element, { index });
```

Le type associé doit porter le nom du domaine, de la fonction et de son rôle.

```ts
interface ArrayFindLastParams {
	index: number;
}
```

Le linter impose déjà la limite du nombre de paramètres. Cette règle précise la structure attendue lorsqu’un regroupement est nécessaire.

## 7. Garder les assertions locales et justifiées

Une assertion est acceptable lorsqu’elle traduit un invariant connu que TypeScript ne peut pas démontrer à partir des déclarations publiques.

Elle doit rester locale, correspondre à une branche runtime explicite et ne pas fuir dans l’API.

```ts
return (input: readonly unknown[]) => findLast(input, predicate as never);
```

Une non-null assertion est également acceptable lorsqu’un invariant local évident garantit la présence de la valeur.

```ts
const item = input[index]!;
```

Ne pas utiliser une assertion uniquement pour faire disparaître une erreur.

## 8. Éviter les abstractions prématurées

Extraire un helper lorsqu’il porte une responsabilité propre, représente un concept partagé ou supprime une duplication réelle.

Ne pas créer une abstraction uniquement pour réduire quelques lignes, masquer une condition simple ou anticiper un usage inexistant.

## 9. Organiser les imports selon les frontières du projet

Chaque dossier importable doit exposer un fichier `index`. Importer depuis ce point d’entrée, jamais depuis un fichier interne.

```text
scripts/
├── array/
│   ├── findLast/
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
└── number/
    ├── types/
    │   └── index.ts
    └── index.ts
```

Pour un élément local au domaine courant, utiliser le barrel correspondant.

```ts
import type { ArrayLike } from "../types";
```

Pour un autre domaine DuploJS, importer le namespace complet afin de conserver sa provenance.

```ts
import * as DNumber from "@scripts/number";

function example(input: DNumber.Positive): void {
	// implementation
}
```

Les namespaces DuploJS utilisent le préfixe `D` : `DArray`, `DEither`, `DIResolver`.

Les imports doivent toujours être écrits sur une seule ligne. Ne pas indenter ni découper les imports sur plusieurs lignes, même lorsqu'ils contiennent plusieurs symboles.

Éviter les deep imports et les imports nommés qui effacent le domaine d’origine.

```ts
// éviter
import { Positive } from "@scripts/number";
import type { SomeType } from "./types/someType";
```

Lorsque tout l’import contient uniquement des types, placer `type` sur la déclaration complète.

```ts
import type { FirstType, SecondType } from "./types";
```

Pour un import mixte, marquer uniquement les symboles typés.

```ts
import { createValue, type ValueOptions } from "./value";
```

## 10. Maintenir une structure de fichiers prévisible

Une fonction publique principale correspond généralement à un fichier source dédié.

Les types, interfaces et helpers utilisés uniquement par cette fonction restent dans le même fichier. Les concepts partagés ou publics peuvent être déplacés dans leur propre domaine.

Toute fonction publique doit être réexportée par les fichiers `index` concernés.

## 11. Utiliser TypeScript pendant la conception

Pour une fonction ou un type complexe, créer des cas d’usage localisés et utiliser le test de type ciblé afin de vérifier rapidement :

- les appels valides ;
- les appels invalides ;
- l’inférence produite ;
- les tuples et littéraux ;
- les formes directes et curried.

Ne pas attendre la fin pour découvrir qu’un contrat de type est incorrect.

Une fois la fonction terminée, lancer le linter sur les fichiers concernés afin de vérifier les conventions mécaniques du projet.

## 12. Ordonner les overloads selon leur priorité d’usage

Placer en premier les signatures les plus précises et celles que la librairie souhaite mettre en avant.

Ordre habituel :

1. predicate + curried ;
2. curried ;
3. predicate + direct ;
4. direct.

Les predicates doivent précéder les signatures booléennes afin de conserver leur narrowing. Les formes curried sont placées avant les formes directes pour favoriser leur utilisation dans les pipes et améliorer l’autocomplétion.

```ts
export function findLast<
	GenericArray extends readonly unknown[],
	GenericOutput extends GenericArray[number],
>(
	predicate: (
		element: GenericArray[number],
		params: ArrayFindLastParams,
	) => element is GenericOutput,
): (input: GenericArray) => GenericOutput | undefined;

export function findLast<
	GenericArray extends readonly unknown[],
>(
	predicate: (
		element: GenericArray[number],
		params: ArrayFindLastParams,
	) => boolean,
): (input: GenericArray) => GenericArray[number] | undefined;

export function findLast<
	GenericElement extends unknown,
	GenericOutput extends GenericElement,
>(
	input: readonly GenericElement[],
	predicate: (
		element: GenericElement,
		params: ArrayFindLastParams,
	) => element is GenericOutput,
): GenericOutput | undefined;

export function findLast<
	GenericElement extends unknown,
>(
	input: readonly GenericElement[],
	predicate: (
		element: GenericElement,
		params: ArrayFindLastParams,
	) => boolean,
): GenericElement | undefined;
```

Lorsque d’autres variantes existent, conserver le même principe : la signature la plus précise ou la plus recommandée passe avant sa forme plus générale.

## 13. Préférer une implémentation bas niveau et autonome

Pour les petites fonctions utilitaires, utiliser directement les primitives de JavaScript. L’API publique reste fonctionnelle, mais l’implémentation peut être impérative.

### Préférer

```ts
for (let index = input.length - 1; index >= 0; index--) {
	const element = input[index]!;

	if (predicate(element, { index })) {
		return element;
	}
}
```

Éviter de composer automatiquement une petite fonction à partir d’autres fonctions publiques de la librairie. Cela ajoute du couplage et des appels intermédiaires sans bénéfice réel.

La réutilisation reste pertinente pour une fonction complexe lorsqu’elle simplifie clairement l’implémentation et que le coût supplémentaire est acceptable.
