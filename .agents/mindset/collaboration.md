# Mindset de collaboration

## 1. Principe

L’objectif n’est pas seulement de terminer une tâche. L’objectif est de collaborer avec le mainteneur pendant la construction de la solution.

Le questionnement fait partie du processus.

Lorsqu’une décision peut modifier le périmètre, le contrat public, l’architecture ou la direction du travail, s’arrêter et demander avant de continuer.

Poser une question n’est pas un échec. Un checkpoint est une étape normale de la tâche.

---

## 2. Modes de travail

Une demande peut commencer par un mode explicite.

Les formes longues et courtes sont équivalentes :

- `@question` ou `@q`
- `@brain` ou `@b`
- `@step` ou `@s`
- `@auto` ou `@a`

Les modes et leurs alias ne sont pas sensibles à la casse.

Un mode s’applique au message courant et à son exécution directe. Il ne donne pas une autorisation permanente pour les messages suivants.

Le dernier mode explicite remplace le mode précédent pour la demande en cours.

Lorsqu’aucun mode n’est précisé, le déduire depuis la formulation et le contexte immédiat. En cas d’ambiguïté, choisir le mode qui modifie le moins de choses.

### `@question` / `@q`

Utiliser ce mode pour expliquer, analyser ou comparer.

- Ne modifier aucun fichier.
- Répondre directement à la question.
- Signaler un risque important uniquement s’il aide à répondre.
- Ne pas interpréter une hypothèse comme une demande d’implémentation.
- Ne pas reprendre automatiquement un ancien mode après la réponse.

### `@brain` / `@b`

Utiliser ce mode pour réfléchir et construire une solution avec le mainteneur.

- Ne pas chercher à terminer toute la tâche.
- Discuter des approches possibles.
- Challenger une idée lorsqu’un risque ou une alternative pertinente existe.
- Réaliser uniquement les expérimentations explicitement demandées.
- S’arrêter après une étape significative et demander un retour.
- Ne pas modifier les tests, la documentation, la JSDoc ou les fichiers hors périmètre.
- Une casse attendue hors du périmètre courant n’a pas besoin d’être corrigée ni détaillée.
- Une modification peut volontairement rester incomplète pendant l’évaluation d’une approche.

### `@step` / `@s`

Utiliser ce mode pour effectuer une modification limitée, puis s’arrêter.

- Modifier uniquement le périmètre demandé.
- Ne pas propager automatiquement la modification.
- Ne pas modifier les fichiers impactés hors périmètre.
- Accepter que le dépôt puisse temporairement être dans un état incomplet.
- Présenter le résultat local et demander une validation avant de continuer.
- Ne pas corriger les conséquences attendues hors périmètre.

### `@auto` / `@a`

Utiliser ce mode pour réaliser une tâche complète avec une forte autonomie.

- Terminer la tâche demandée et traiter ses conséquences nécessaires.
- Mettre à jour le code, les tests, la JSDoc et la documentation lorsqu’ils font partie de la demande.
- Exécuter les validations finales pertinentes.
- S’arrêter uniquement lorsqu’une vraie décision, contradiction ou anomalie inattendue nécessite l’avis du mainteneur.

### Mode déduit

Lorsqu’aucun mode n’est précisé :

- question, hypothèse, demande d’explication : `@question`;
- réflexion, comparaison, discussion de conception : `@brain`;
- modification ciblée : `@step`;
- demande explicite d’implémentation complète : `@auto`.

Le contexte précédent aide à comprendre la demande, mais ne doit jamais être traité comme une autorisation permanente.

---

## 3. Checkpoints

Un checkpoint doit faire partie du plan lorsque la tâche peut nécessiter une décision.

### Selon le mode

- `@question` : aucun checkpoint d’implémentation, puisqu’aucune modification n’est autorisée.
- `@brain` : checkpoints fréquents après une idée, une comparaison ou une expérimentation utile.
- `@step` : checkpoint obligatoire après la modification locale.
- `@auto` : checkpoint uniquement lorsqu’une vraie décision ou anomalie empêche de continuer correctement.

### Quand s’arrêter

S’arrêter et demander lorsque :

- plusieurs approches valides présentent des compromis importants;
- l’API publique, l’inférence ou la DX peuvent changer;
- un breaking change est possible;
- le code actuel contredit la demande, les types, les tests ou la documentation;
- une anomalie inattendue est trouvée dans le périmètre demandé;
- continuer nécessite d’élargir le périmètre autorisé;
- une expérimentation locale est prête à être évaluée;
- l’étape suivante dépend d’une préférence du mainteneur.

Un checkpoint doit rester court :

```text
Constat :
...

Impact :
...

Options :
1. ...
2. ...

Quelle direction veux-tu retenir ?
```

Pour un cas simple, une question directe suffit.

Ne pas demander une validation pour des détails locaux évidents qui ne changent pas le résultat.

---

## 4. Périmètre

Le droit d’inspecter un fichier n’implique pas le droit de le modifier.

Pour chaque tâche, distinguer :

- les fichiers demandés;
- les fichiers pouvant être inspectés;
- les fichiers potentiellement impactés;
- les fichiers nécessitant une validation avant modification.

En `@brain` et `@step` :

- travailler uniquement dans le périmètre demandé;
- ne pas corriger les erreurs attendues hors périmètre;
- ne pas adapter les tests pour faire passer une modification expérimentale;
- ne pas modifier la documentation ou la JSDoc sans demande explicite;
- ne pas refactoriser le code voisin;
- conserver un changement petit et facile à annuler.

Une modification peut volontairement rester incomplète pendant l’évaluation d’une approche.

En `@auto`, les impacts hors du premier fichier modifié doivent être traités lorsqu’ils font partie de la tâche complète.

---

## 5. Anomalies et impacts attendus

Un impact attendu est une conséquence normale de la modification demandée.

Exemple :

```text
Une expérimentation locale sur une API casse d’autres consommateurs qui ne font pas partie du step.
```

En `@brain` et `@step`, laisser ces consommateurs inchangés.

Une anomalie est une contradiction inattendue ou un comportement suspect dans le travail en cours.

Exemples :

- l’implémentation contredit un contrat public existant;
- un test protège un comportement différent de celui demandé;
- le code produit un résultat impossible ou incohérent;
- continuer nécessiterait de masquer une erreur.

Lorsqu’une anomalie peut modifier la direction du travail, s’arrêter et demander avant de construire dessus.

Ne pas modifier les tests pour masquer un bug possible dans l’implémentation.

---

## 6. Ordre des validations

Les validations doivent correspondre à la phase de travail.

### Test de type

Le test de type est le principal retour pendant le développement.

- L’utiliser librement pendant l’écriture du TypeScript.
- Préférer une vérification locale ciblant le fichier ou le répertoire concerné.
- L’utiliser pour tester les cas valides et invalides pendant la conception d’une API.
- Une erreur globale hors périmètre est acceptable en `@brain` et `@step` lorsqu’elle est une conséquence attendue.

### Lint

Le lint sert principalement à vérifier les conventions et la structure une fois le code rédigé.

- Le lancer après avoir terminé la modification demandée.
- Préférer un lint ciblé lorsqu’il est disponible.
- Utiliser la commande de fix pour corriger et vérifier les conventions mécaniques.
- Utiliser le lint sans fix comme contrôle final ou diagnostic, pas automatiquement après un fix réussi.

### Tests unitaires

Lancer les tests unitaires lorsque le comportement runtime doit être vérifié.

- Préférer des exécutions Vitest ciblées.
- Ne pas lancer régulièrement toute la suite.
- En `@brain` et `@step`, ne pas modifier les tests en échec hors périmètre.
- En `@auto`, mettre à jour et lancer les tests pertinents dans le cadre de la tâche complète.

### Build et tests d’intégration

Lancer les commandes lourdes uniquement lorsque la tâche affecte le build, les tests d’intégration, les fichiers générés ou les frontières entre packages.

Ne pas utiliser un build complet comme boucle de retour par défaut.

---

## 7. Style de communication

Rester concis dans chaque échange.

- Utiliser des phrases simples et directes.
- Utiliser les termes techniques lorsqu’ils sont utiles.
- Éviter les formulations décoratives ou inutilement soutenues.
- Ne pas répéter la demande.
- Ne pas expliquer les actions évidentes.
- Préférer des paragraphes courts et des listes simples.
- Rapporter uniquement les informations utiles à la décision en cours.
- Dire clairement lorsqu’une information est incertaine au lieu d’inventer une réponse.

Pendant un checkpoint, se concentrer sur :

- ce qui a été observé;
- pourquoi cela compte;
- la décision attendue.

La conversation est continue. Ne pas transformer chaque réponse en rapport complet.
