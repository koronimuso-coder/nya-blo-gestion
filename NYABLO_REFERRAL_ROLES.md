# Matrice des Rôles et Droits d'Accès - Programme Parrainage

Ce document définit les permissions d'accès et les actions autorisées pour chaque rôle utilisateur au sein du module de parrainage de NYA BLO.

---

## 1. Rôles Applicatifs

Le portail de gestion utilise quatre niveaux d'habilitation :
1. **Super Admin** : Contrôle total du système.
2. **Admin Entreprise** : Administration de l'entreprise (GALF Formation).
3. **Superviseur** : Responsable d'équipe ou commerciale senior.
4. **Commerciale** : Agent commercial chargé de la saisie quotidienne.

---

## 2. Matrice des Droits d'Accès

| Fonctionnalité / Action | Commerciale | Superviseur | Admin Entreprise | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Saisie et Rattachement** | | | | |
| Saisir une inscription avec code | **Autorisé** | **Autorisé** | **Autorisé** | **Autorisé** |
| Vérifier un code parrain (Live check) | **Autorisé** | **Autorisé** | **Autorisé** | **Autorisé** |
| Rattacher manuellement (Recherche parrain) | **Autorisé** | **Autorisé** | **Autorisé** | **Autorisé** |
| Modifier un rattachement *déjà validé* | *Interdit* | **Autorisé** (Log requis) | **Autorisé** | **Autorisé** |
| **Gestion des Parrains (Membres)** | | | | |
| Créer / Enregistrer un nouveau parrain | **Autorisé** | **Autorisé** | **Autorisé** | **Autorisé** |
| Consulter la liste des parrains & codes | **Autorisé** | **Autorisé** | **Autorisé** | **Autorisé** |
| Suspendre / Réactiver un parrain | *Interdit* | **Autorisé** | **Autorisé** | **Autorisé** |
| **Gestion des Récompenses (Rewards)** | | | | |
| Consulter les dossiers de récompenses | **Autorisé** (Lecture seule) | **Autorisé** | **Autorisé** | **Autorisé** |
| Mettre en vérification (`verification_en_cours`) | *Interdit* | **Autorisé** | **Autorisé** | **Autorisé** |
| Approuver une récompense (`approuvee`) | *Interdit* | *Interdit* | **Autorisé** | **Autorisé** |
| Rejeter une récompense (`refusee`) | *Interdit* | *Interdit* | **Autorisé** | **Autorisé** |
| Programmer la formation offerte (Session, Centre) | *Interdit* | *Interdit* | **Autorisé** | **Autorisé** |
| Clôturer / Utiliser une récompense (`utilisee`) | *Interdit* | *Interdit* | **Autorisé** | **Autorisé** |
| **Configuration et Outils** | | | | |
| Créer / Modifier une campagne | *Interdit* | *Interdit* | **Autorisé** | **Autorisé** |
| Consulter l'onglet Anti-Fraude | *Interdit* | **Autorisé** | **Autorisé** | **Autorisé** |
| Consulter les performances d'équipe | *Interdit* | *Interdit* | **Autorisé** | **Autorisé** |
| Exporter les données au format CSV | *Interdit* | *Interdit* | **Autorisé** | **Autorisé** |

---

## 3. Sécurité des Règles Firestore

Pour appuyer cette matrice, les règles de sécurité Firestore garantissent les contrôles suivants en base de données :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Règle générale : Authentification requise pour tout accès
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Règles spécifiques de sécurité (contrôlées côté serveur par Next.js et Admin SDK)
    // - referral_campaigns : Ecriture réservée aux admins.
    // - referral_rewards : Transition vers approuvée/refusée bloquée côté client pour les commerciales.
    // - referral_audit_logs : Ecriture seule, aucune modification/suppression autorisée.
  }
}
```

---

## 4. Mesures Anti-Fraude et Journalisation (Logs)

Toutes les actions critiques de gestion des rôles ou de statut de parrainage font l'objet d'un audit de sécurité consigné dans `referral_audit_logs` :
* **Modification de statut d'un filleul** par un admin : Saisie obligatoire du motif de modification.
* **Validation d'un dossier de récompense** : Le système enregistre l'adresse email de l'administrateur ayant pris la décision et le motif.
* **Auto-parrainage et doublons** : Bloqués au niveau de l'interface et de l'API avec notification d'alerte dans l'onglet anti-fraude accessible uniquement aux Superviseurs et Administrateurs.
