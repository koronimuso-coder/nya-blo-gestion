# Plan de Validation et Scénarios de Test - Module Parrainage

Ce document décrit les cas de test fonctionnels et techniques pour la validation (QA) du module de parrainage de GALF Formation sur le portail NYA BLO.

---

## 1. Tests d'Intégration Automatisés (CLI)

Les tests backend sont exécutables via la commande :
```bash
npx tsx src/scripts/test-referral.ts
```

Ils valident automatiquement les scénarios d'attribution de la base de données :
* **Test 1** : Refus de rattachement si aucun code parrain n'est fourni.
* **Test 2** : Acceptation du rattachement avec le code valide `MAMADOU26`.
* **Test 3** : Refus si le code fourni est inexistant (ex: `INCONNU99`).
* **Test 4** : Refus si le code ou le parrain associé est suspendu (`ADAMA26`).
* **Test 5** : Détection et blocage de l'auto-parrainage (filleul et parrain avec le même téléphone).
* **Test 6** : Blocage et signalement d'un doublon si le téléphone du filleul a déjà fait l'objet d'un parrainage.
* **Test 7** : Validation de la progression et génération automatique du dossier de récompense (`referral_rewards`) au statut `eligible` dès le 5ème filleul validé.

---

## 2. Scénarios de Test Fonctionnels (Interface Utilisateur)

### Cas de Test UI-01 : Enregistrement d'un nouveau parrain
* **Action** : 
  1. Aller sur le tableau de bord de parrainage.
  2. Cliquer sur **"Enregistrer un Parrain"**.
  3. Remplir les champs obligatoires (ex: Nom: `Koné`, Prénom: `Adama`, Téléphone: `+2250708091011`, Code: `ADAMA26`).
  4. Valider le formulaire.
* **Résultat Attendu** : 
  * Le parrain apparaît immédiatement dans l'onglet "Membres & Codes".
  * Le code `ADAMA26` est enregistré dans la collection `referral_codes`.
  * Un message de succès vert s'affiche.

---

### Cas de Test UI-02 : Saisie d'une inscription parrainée (Commerciale)
* **Action** :
  1. Ouvrir le modal d'inscription (Point Journalier).
  2. Cocher "Oui" à la question parrainage.
  3. Saisir le code parrain `MAMADOU26`.
* **Résultat Attendu** :
  * Le système affiche en vert : `"Code valide. Cette inscription peut être rattachée à Mamadou Diallo. Progression : X/5"`.
  * Cliquer sur enregistrer. L'inscription s'ajoute à la liste des Point Journalier et porte un badge avec le code parrain.

---

### Cas de Test UI-03 : Blocage de l'auto-parrainage et doublons
* **Action** :
  1. Créer une inscription.
  2. Renseigner comme téléphone de l'apprenant le numéro de Mamadou Diallo (`+2250707070707`).
  3. Tenter d'attribuer le code `MAMADOU26`.
* **Résultat Attendu** :
  * Le live check affiche un message d'erreur rouge : `"Un apprenant ne peut pas s'auto-parrainer."`.
  * La validation du modal de saisie est bloquée.

---

### Cas de Test UI-04 : Traitement d'un dossier de récompense (Admin)
* **Action** :
  1. Aller sur l'onglet **"Contrôle des Récompenses"**.
  2. Cliquer sur **"Traiter le dossier"** sur une récompense éligible.
  3. Sélectionner le statut **"Approuvée"**.
  4. Choisir la formation offerte `Pelle hydraulique`, le centre de formation `Bouaké`, et une date limite.
  5. Cliquer sur **"Enregistrer"**.
* **Résultat Attendu** :
  * Le statut passe à `approuvee`.
  * Les informations de formation, de centre et de date limite sont sauvegardées.
  * L'historique d'audit contient la trace de la décision.

---

## 3. Scénarios de Test Technique de l'API REST

L'API de connexion externe (`/api/referral`) peut être testée en local avec un outil d'API (Postman/cURL) :

### Cas de Test API-01 : Vérification de code (GET)
* **Requête** :
  ```http
  GET http://localhost:3000/api/referral?code=MAMADOU26&studentPhone=+2250808080808
  Authorization: Bearer nya-blo-galf-secure-token-2026
  ```
* **Résultat Attendu** :
  * Code HTTP 200.
  * Réponse JSON :
    ```json
    {
      "status": "valid",
      "message": "Code valide.",
      "member": {
        "nom": "Diallo",
        "prenom": "Mamadou",
        "campagneId": "campagne_2026"
      }
    }
    ```

### Cas de Test API-02 : Enregistrement de pré-inscription (POST)
* **Requête** :
  ```http
  POST http://localhost:3000/api/referral
  Authorization: Bearer nya-blo-galf-secure-token-2026
  Content-Type: application/json

  {
    "studentName": "Adou Kouassi",
    "studentPhone": "+2250102030405",
    "referralCode": "MAMADOU26",
    "engin": "HSE",
    "totalAmount": 15000,
    "paidAmount": 0,
    "modePaiement": "Wave"
  }
  ```
* **Résultat Attendu** :
  * Code HTTP 201 Created.
  * Création d'une ligne dans `daily_entries` au statut `"prospect enregistré"`.
  * Création d'un rattachement dans `referral_attributions`.
