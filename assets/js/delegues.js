/* Page réservée aux délégués régionaux.
   Elle ne fait qu'une chose : vérifier que la personne connectée figure
   dans la collection « delegues », puis lui donner accès au formulaire
   de dépôt. Aucune écriture dans la base, aucun accès à la liste des adhérents. */
import { auth, db, configure, cle, messageErreur, ecran, msg } from "./firebase-commun.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = id => document.getElementById(id);

if (!configure) ecran("bientot");
else demarrer();

function demarrer() {
  $("f-login").addEventListener("submit", async e => {
    e.preventDefault();
    msg("m-login", "");
    const bouton = e.submitter;
    bouton.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, cle($("a-mail").value), $("a-mdp").value);
    } catch (err) {
      msg("m-login", messageErreur(err), "erreur");
    }
    bouton.disabled = false;
  });

  document.querySelectorAll("[data-deconnexion]").forEach(b =>
    b.addEventListener("click", () => signOut(auth)));

  onAuthStateChanged(auth, async user => {
    if (!user) return ecran("login");

    if (!user.emailVerified) {
      msg("m-login", "Confirmez d'abord votre adresse depuis l'espace membres.", "erreur");
      await signOut(auth);
      return;
    }

    /* Jeton rafraîchi : sans cela, l'ancien jeton peut encore indiquer
       « adresse non confirmée » et les règles refuseraient la lecture. */
    await user.getIdToken(true).catch(() => null);

    let fiche = null;
    try {
      const f = await getDoc(doc(db, "delegues", cle(user.email)));
      if (f.exists()) fiche = f.data() || {};
    } catch (_) {
      fiche = null;
    }

    if (!fiche) {
      msg("m-login", "Cette page est réservée aux délégués régionaux. Si vous pensez devoir y accéder, écrivez au siège.", "erreur");
      await signOut(auth);
      return;
    }

    $("d-nom").textContent = fiche.nom ? ", " + fiche.nom : "";
    ecran("depot");
  });
}
