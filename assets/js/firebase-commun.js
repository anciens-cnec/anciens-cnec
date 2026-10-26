/* Initialisation Firebase commune à l'espace membres et à l'administration. */
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const configure = !String(firebaseConfig.apiKey).startsWith("A_REMPLIR");

export let auth = null, db = null;
if (configure) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.languageCode = "fr";
  db = getFirestore(app);
}

/* Les identifiants des fiches adhérents sont les courriels, en minuscules. */
export function cle(email) { return String(email || "").trim().toLowerCase(); }

export function messageErreur(err) {
  const code = (err && err.code) || "";
  const m = {
    "auth/invalid-email": "Cette adresse de courriel n'est pas valide.",
    "auth/invalid-credential": "Courriel ou mot de passe incorrect.",
    "auth/wrong-password": "Courriel ou mot de passe incorrect.",
    "auth/user-not-found": "Courriel ou mot de passe incorrect.",
    "auth/email-already-in-use": "Un compte existe déjà avec cette adresse. Connectez-vous, ou utilisez « Mot de passe oublié ».",
    "auth/weak-password": "Le mot de passe doit comporter au moins 8 caractères.",
    "auth/too-many-requests": "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
    "auth/network-request-failed": "Connexion internet indisponible. Vérifiez votre réseau.",
    "auth/user-disabled": "Ce compte a été désactivé. Écrivez au secrétariat.",
    "permission-denied": "Accès refusé."
  };
  return m[code] || "Une erreur est survenue. Réessayez, ou écrivez au secrétariat.";
}

/* Affiche un seul bloc [data-ecran] à la fois. */
export function ecran(nom) {
  document.querySelectorAll("[data-ecran]").forEach(el => { el.hidden = el.dataset.ecran !== nom; });
}

export function msg(id, texte, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = texte || "";
  el.hidden = !texte;
  el.className = "note" + (type === "erreur" ? " red" : "");
}
