# Guide d'Administration - Programme de Parrainage GALF

Ce guide est destiné aux superviseurs et administrateurs pour la gestion, la validation des récompenses et la lutte contre la fraude dans le cadre du programme de parrainage de GALF Formation.

---

## 1. Tableau de Bord d'Administration

Le module d'administration est accessible via l'onglet **"Programme de Parrainage"** dans le menu de navigation principal (section *Forces de Vente*). Les fonctionnalités avancées sont restreintes selon les rôles.

---

## 2. Contrôle et Validation des Récompenses

Dès qu'un parrain atteint **5 filleuls validés** (statuts d'inscription `"Confirmé"` ou `"inscription validée"`), le système crée automatiquement un dossier de récompense avec le statut `eligible` (Éligible - vérification requise).

### Procédure de validation d'un dossier de récompense :
1. Rendez-vous sur l'onglet **"Contrôle des Récompenses"**.
2. Identifiez la récompense (ex: `GALF-REWARD-2026-000001`). Le tableau indique le parrain bénéficiaire et la liste des filleuls qualifiants.
3. Cliquez sur le bouton **"Traiter le dossier"** en bout de ligne.
4. Dans le panneau latéral qui s'ouvre, effectuez les vérifications de conformité (voir section 3).
5. Mettez à jour le statut du dossier :
   * **Approuvée** : Le dossier est valide. Vous devez alors obligatoirement sélectionner :
     * La **formation offerte** (choix parmi le catalogue de formations GALF).
     * Le **centre de formation** d'affectation.
     * La **date limite** d'utilisation de la formation offerte.
   * **Vérification en cours / Informations requises** : Si vous demandez un contrôle supplémentaire à la commerciale ou au client.
   * **Refusée** : Si le dossier présente une fraude ou ne respecte pas les critères. Saisissez obligatoirement le motif de rejet.
6. Enregistrez. L'historique et les logs d'audit enregistrent automatiquement votre décision avec votre adresse email.

---

## 3. Gestion Anti-Fraude et Alertes

Le module anti-fraude intégré effectue des contrôles en temps réel et remonte les dossiers suspects dans l'onglet **"Anti-Fraude & Doublons"**.

### Trois types d'anomalies sont détectées automatiquement :
1. **Rattachements Multiples (Doublons)** : Détecte si le même numéro de téléphone de filleul a été rattaché à plusieurs parrains différents ou saisi plusieurs fois.
   * *Action requise* : Contacter les commerciales ayant enregistré ces dossiers pour identifier le bon parrainage ou supprimer la saisie en doublon.
2. **Auto-parrainage suspecté** : Détecte si un parrain et un filleul ont le même numéro de téléphone normalisé.
   * *Action requise* : Le système bloque la validation. Si c'est une erreur de saisie, la commerciale doit modifier le numéro de l'apprenant.
3. **Saisies anormalement rapides** : Détecte si un parrain enregistre plus de 3 filleuls en moins d'une heure.
   * *Action requise* : Contacter le parrain ou la commerciale pour s'assurer que ce ne sont pas des inscriptions fictives visant à obtenir frauduleusement une formation gratuite.

---

## 4. Configuration des Campagnes de Parrainage

Les campagnes permettent de limiter le parrainage à des périodes de vente définies.
* Pour créer une campagne : Allez sur le bouton **"Nouvelle Campagne"** en haut à droite du tableau de bord. Renseignez le nom, la description, les dates de début et de fin, et définissez le statut initial (`active`, `draft` ou `expired`).
* Lorsqu'une campagne se termine, les codes associés ne peuvent plus être rattachés en direct par les commerciales (ils affichent `"campaign_ended"`). Toute dérogation nécessite une saisie administrative.

---

## 5. Suivi des Performances d'Équipe et Exports

* **Suivi Équipe** : L'onglet affiche le classement des commerciales selon le nombre de filleuls générés et le taux de conversion (inscriptions validées / inscriptions saisies). Cela permet d'identifier les commerciales les plus performantes ou celles nécessitant une assistance.
* **Graphiques & Exports** : Vous pouvez visualiser sous forme de diagrammes la répartition des filleuls par campagne et l'évolution mensuelle des inscriptions.
* **Export CSV** : En bas de la page Statistiques, vous disposez de 3 boutons pour exporter la totalité des données au format CSV :
   * Exporter les Parrains.
   * Exporter les Récompenses.
   * Exporter les Filleuls (Attributions).
