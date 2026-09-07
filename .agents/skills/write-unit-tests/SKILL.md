---
name: write-unit-tests
description: >
  Créer ou mettre à jour les tests unitaires Vitest d'une fonction TypeScript
  du projet. Utiliser ce skill lorsque la demande concerne explicitement les
  tests unitaires, la couverture, le comportement runtime ou l'inférence de
  types d'une fonction. Ne pas modifier les tests uniquement pour masquer une
  anomalie dans l'implémentation.
---

# Rédaction des tests unitaires

## Objectif

Créer ou mettre à jour le fichier de test d'une fonction en vérifiant :

- son comportement runtime;
- son contrat TypeScript et son inférence;
- ses cas d'utilisation et ses erreurs;
- toutes les branches nécessaires pour atteindre 100 % de couverture.

Appliquer les règles générales du projet et respecter le mode de collaboration courant.

## Analyse préalable

Avant d'écrire les tests :

1. lire la fonction source;
2. identifier ses signatures et overloads;
3. comprendre son comportement runtime;
4. repérer les cas limites et les erreurs;
5. déterminer les informations de type qui doivent être préservées;
6. vérifier les tests existants lorsqu'ils existent.

Ne pas considérer automatiquement le code comme correct lorsqu'un test échoue. Si le comportement semble incohérent avec le contrat attendu, s'arrêter et demander avant d'adapter le test.

## Emplacement

Le fichier de test reproduit l'arborescence du fichier source après `scripts/`.

```text
scripts/<namespace>/.../<function>.ts
tests/<namespace>/.../<function>.test.ts
```

Ne pas tester directement un fichier situé dans un dossier `types/`. Ces dossiers ne contiennent que des types et doivent être couverts via les APIs qui les exposent.

Certains fichiers peuvent exceptionnellement tester plusieurs fonctions. Ne pas reproduire ce cas sans demande explicite.

## Imports

- Ne jamais importer depuis `vitest`. Les globals Vitest sont chargés par le `tsconfig` et disponibles à l'exécution.
- Importer les éléments depuis `@scripts`.
- Appeler la fonction testée via son namespace.
- Importer uniquement ce qui est utilisé.
- Importer `ExpectType` lorsque des assertions de type sont pertinentes.
- Importer `pipe` uniquement lorsqu'un test de pipe est pertinent.
- Importer `when` ou une autre API de composition uniquement lorsqu'elle sert réellement à vérifier un narrowing dans un pipe.

## Structure

```ts
describe("functionName", () => {
	it("describes the tested behavior", () => {
		// ...
	});
});
```

- Les descriptions de `describe` et `it` sont en anglais.
- Chaque test doit exprimer un comportement précis.
- Chaque `it` reste autonome.
- Ne pas créer de helper ou de fixture partagée uniquement pour réduire la duplication.
- Privilégier la lisibilité et l'intention du test plutôt que DRY.

## Templates

Les templates sont des points de départ, pas des structures obligatoires.

Choisir uniquement celui qui correspond réellement à la fonction :

- `assets/basic-function.md` pour une fonction simple;
- `assets/curried-function.md` pour une fonction qui possède une signature curryfiée;
- `assets/predicate-function.md` pour une fonction qui est elle-même un predicate ou un type predicate;
- `assets/examples.md` pour des exemples de placement de `ExpectType`.

Ne pas fusionner tous les templates dans un même fichier de test.

Supprimer les sections qui ne sont pas pertinentes et ajouter les cas manquants selon le contrat réel de la fonction.

## Tests de comportement

Commencer par les tests correspondant au contrat logique de la fonction :

- usage normal;
- variantes de signatures pertinentes;
- cas limites;
- erreurs ou exceptions;
- immutabilité lorsqu'elle fait partie du contrat;
- interactions ou enchaînements importants.

Ces tests doivent représenter les usages réels de la fonction.

## Tests de types

Ajouter des assertions `ExpectType` aux endroits où le typage apporte une information utile.

Toujours utiliser le mode `"strict"`.

```ts
type _CheckResult = ExpectType<
	typeof result,
	ExpectedResult,
	"strict"
>;
```

Tester notamment lorsque c'est pertinent :

- le type d'entrée accepté;
- le type de sortie;
- l'inférence d'un générique;
- la conservation d'un tuple ou d'une valeur littérale;
- le narrowing d'un predicate;
- une valeur intermédiaire d'un processus;
- la propagation des génériques entre plusieurs opérations;
- le résultat d'une méthode fluide;
- la conservation exacte d'un type interne exposé par le contrat.

Ne pas ajouter un `ExpectType` uniquement pour respecter un quota. Une fonction dont le typage est trivial n'a pas besoin d'assertions répétitives.

Les checks de types doivent être placés près de la valeur ou de l'étape qu'ils valident.

## Tests d'API TypeScript

Le contrat TypeScript fait partie de l'API publique. Tester le runtime seul ne suffit pas.

Vérifier les formes publiques pertinentes :

- appel direct;
- usage dans un `pipe` pour les signatures curryfiées;
- predicates et type predicates;
- overloads exposés;
- relations entre arguments;
- entrées acceptées et refusées;
- inférence des sorties et des valeurs intermédiaires.

Utiliser `ExpectType` pour vérifier l'inférence et `@ts-expect-error` pour les appels qui doivent être refusés.

Tester notamment les limites visibles par l'utilisateur : littéraux, unions, tuples, `readonly`, types intersection/branded et contraintes entre paramètres.

Si une inférence semble trop large, inversée, instable ou incohérente avec l'intention de l'API, s'arrêter et demander au mainteneur au lieu d'adapter le test pour masquer le problème.

## Tests avec `pipe`

Un test de pipe n'est pas systématique.

Ajouter un test avec `pipe` lorsque :

- la fonction possède une signature curryfiée;
- la propagation de ses génériques dans un pipe doit être vérifiée;
- le pipe produit une inférence différente ou plus complexe qu'un appel direct;
- la fonction est explicitement conçue pour être utilisée dans un pipeline.

Ne pas ajouter de test de pipe lorsque la fonction ne possède aucune forme curryfiée ou lorsque le test n'apporte aucune vérification supplémentaire.

Dans ce projet, une signature curryfiée existe uniquement pour l'usage dans `pipe`.

Ne pas tester une signature curryfiée seule, hors `pipe`, sauf demande explicite ou cas exceptionnel documenté par le code existant.

Dans un test de pipe pertinent, vérifier le comportement runtime et, si nécessaire, l'inférence obtenue à une étape intermédiaire ou en sortie.

## Predicates

Lorsqu'une fonction est un predicate ou un type predicate :

- tester le comportement runtime;
- tester le narrowing lorsque celui-ci fait partie du contrat;
- tester la forme directe avec la valeur à discriminer;
- vérifier l'inférence dans un pipe uniquement si la forme curryfiée existe et si le test apporte une information utile.

Lorsqu'une fonction accepte une callback predicate en paramètre, tester cette callback comme un argument de l'API concernée. Ne pas appliquer automatiquement le template `predicate-function.md`.

Pour vérifier le narrowing d'un predicate dans un `pipe`, ne pas placer seulement le predicate comme étape du pipe.

Utiliser `when` ou une autre fonction de composition qui consomme le predicate et donne accès à la valeur narrowée dans un callback.

## Couverture

L'objectif est 100 % de couverture.

### Tests de cas

Ils valident le contrat et les usages attendus :

- cas nominaux;
- erreurs;
- limites;
- variantes importantes;
- comportement observable.

Les écrire en premier.

### Tests de couverture

Après les tests de cas, vérifier la couverture ciblée du fichier.

Ajouter les tests manquants uniquement pour exercer les branches qui ne sont pas encore couvertes, y compris les situations rares ou peu naturelles.

Un test de couverture doit rester compréhensible et cibler explicitement la branche concernée.

Ne pas modifier l'implémentation ou affaiblir les assertions uniquement pour atteindre la couverture.

## Validation

1. Lancer `npm run test:types:target -- <fichier>` si le test contient des vérifications d'inférence complexes.
2. Lancer le lint avec fix sur le fichier de test.
3. Lancer le test Vitest ciblé :

```bash
npm run test:ut -- tests/<namespace>/<function>.test.ts
```

4. Lire la couverture du fichier concerné dans le report console.
5. Ajouter les tests de couverture manquants si nécessaire.
6. Relancer uniquement le fichier ciblé jusqu'à validation.

Utiliser le lint sans fix en fin de travail seulement lorsqu'un contrôle final sans modification est utile.

Ne pas lancer régulièrement toute la suite de tests.

## Vérification finale

Avant de terminer, vérifier :

- le bon emplacement du fichier;
- l'appel de la fonction via son namespace;
- des imports minimaux;
- des tests autonomes;
- des descriptions en anglais;
- des checks `ExpectType` pertinents et stricts;
- l'absence de test `pipe` artificiel;
- la couverture complète de la fonction;
- l'absence de modification destinée à masquer une anomalie du code.
