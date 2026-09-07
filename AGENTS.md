# AGENTS

## Présentation

`@duplojs/server` est une brique de l’écosystème DuploJS.

Le projet fournit des fonctions et des types TypeScript conçus pour offrir une API fonctionnelle, fortement typée et orientée DX.

## Instructions obligatoires

Avant toute analyse ou modification, lire et appliquer :

- `.agents/mindset/collaboration.md`
- `.agents/rules/code.md`
- `.agents/rules/typescript.md`

Le mindset de collaboration s’applique à toutes les demandes.

Les règles de code et TypeScript s’appliquent à toute analyse, proposition ou modification liée au développement.

## Philosophie

Le projet privilégie :

- la programmation fonctionnelle;
- les fonctions pures;
- l’immutabilité par défaut;
- la composition et le piping;
- une API publique type-first;
- une DX claire;
- une forte qualité d’inférence;
- des erreurs TypeScript compréhensibles;
- un contrat public robuste;
- des implémentations runtime simples et efficaces.

L’API publique, ses types, sa JSDoc, ses exemples et son comportement runtime constituent le produit livré.

L’implémentation interne sert ce contrat et ne doit pas dégrader la DX publique.

## Architecture

Le code est organisé par domaines fonctionnels appelés namespaces.

Chaque namespace regroupe les fonctions, types et outils liés à un même concept.

Respecter l’architecture actuelle du dépôt. Ne pas créer, déplacer, fusionner ou supprimer un namespace sans demande explicite.

## Organisation du dépôt

```text
scripts/
tests/
jsDoc/
docs/
```

- `scripts/` contient le code source;
- `tests/` contient les tests unitaires;
- `jsDoc/` contient les contenus et exemples utilisés par la JSDoc; (setup futur)
- `docs/` contient la documentation publique.

Respecter les conventions d’organisation et d’import définies dans les règles de code.

## Dépendances

Le projet ne possède aucune dépendance runtime externe (execpter d'autre brique DuploJS comme `@duplojs/lang`).

Ne pas ajouter de dépendance runtime sans demande explicite.

## Types utilitaires

Avant d’écrire un calcul de type complexe, rechercher les types utilitaires déjà disponibles dans le projet ou au seins des dépendances (chercher dans `@duplojs/lang` en premier car brique fondamental de l'écosystème).

Préférer leur composition lorsqu’ils expriment clairement l’intention et évitent de réécrire un calcul existant.

## Skills

Pour toute création ou modification de tests unitaires, utiliser le skill dédié.

Ne pas charger ou enchaîner un skill hors du périmètre demandé.

## Commandes

Pour les validations et le build, utiliser les commandes existantes plutôt qu'une commande équivalente :

```bash
npm run test:types
npm run test:types:target [-- <fichier...>]
npm run test:lint [-- <chemin...>]
npm run test:lint:fix [-- <chemin...>]
npm run test:ut [-- <fichier-ou-filtre...>]
npm run build
```

`test:types` exécute une validation globale. `test:types:target` exécute une validation ciblée avec `tsconfig.test.json`.

Les autres commandes acceptent un ou plusieurs chemins lorsqu'un ciblage est utile.

Cette restriction ne concerne pas les commandes de lecture ou d'inspection comme `rg`, `sed`, `ls` ou `git diff`.

Ordre d’utilisation :

Utiliser librement `test:types:target` pendant le développement, de préférence avec un ou plusieurs fichiers ciblés.
Utiliser `test:types` seulement lorsqu'une validation globale est nécessaire.
Utiliser `test:lint:fix` sur les fichiers modifiés pour corriger et vérifier les conventions mécaniques.
Utiliser `test:lint` sans fix seulement lorsqu'un contrôle final ou un diagnostic sans modification est utile.
Lancer `test:ut` uniquement sur les tests concernés.
Utiliser `build` seulement lorsque la tâche affecte le build, les fichiers générés ou les tests d’intégration.

En `@brain` et `@step`, ne pas lancer une validation globale uniquement pour rechercher des impacts hors périmètre.
