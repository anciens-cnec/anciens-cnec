/* Espace membres : création du mot de passe, connexion, mot de passe oublié, documents réservés. */
import { auth, db, configure, cle, messageErreur, ecran, msg } from "./firebase-commun.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification,
  sendPasswordResetEmail, onAuthStateChanged, signOut, reload
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, collection, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = id => document.getElementById(id);

if (!configure) {
  ecran("bientot");
} else {
  demarrer();
}

function demarrer() {
  /* onglets Connexion / Première connexion */
  document.querySelectorAll("[data-onglet]").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll("[data-onglet]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    $("f-connexion").hidden = b.dataset.onglet !== "connexion";
    $("f-creation").hidden = b.dataset.onglet !== "creation";
    msg("m-accueil", "");
  }));

  /* connexion */
  $("f-connexion").addEventListener("submit", async e => {
    e.preventDefault();
    msg("m-accueil", "");
    const btn = e.submitter; btn.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, cle($("c-mail").value), $("c-mdp").value);
    } catch (err) { msg("m-accueil", messageErreur(err), "erreur"); }
    btn.disabled = false;
  });

  /* première connexion : création du mot de passe */
  $("f-creation").addEventListener("submit", async e => {
    e.preventDefault();
    msg("m-accueil", "");
    const email = cle($("n-mail").value), mdp = $("n-mdp").value;
    if (mdp.length < 8) return msg("m-accueil", "Le mot de passe doit comporter au moins 8 caractères.", "erreur");
    if (mdp !== $("n-mdp2").value) return msg("m-accueil", "Les deux mots de passe ne sont pas identiques.", "erreur");
    const btn = e.submitter; btn.disabled = true;
    try {
      creationEnCours = true;
      const { user } = await createUserWithEmailAndPassword(auth, email, mdp);
      const fiche = await getDoc(doc(db, "adherents", email));
      if (!fiche.exists()) {
        await user.delete();
        creationEnCours = false;
        ecran("accueil");
        msg("m-accueil", "Cette adresse ne figure pas dans la liste des adhérents à jour. Utilisez l'adresse communiquée au secrétariat, ou écrivez-nous.", "erreur");
      } else {
        await sendEmailVerification(user, { url: location.href.split("#")[0] });
        creationEnCours = false;
        afficherVerification(user);
      }
    } catch (err) {
      creationEnCours = false;
      msg("m-accueil", messageErreur(err), "erreur");
    }
    btn.disabled = false;
  });

  /* mot de passe oublié */
  $("b-oubli").addEventListener("click", () => { ecran("oubli"); $("o-mail").value = $("c-mail").value; msg("m-oubli", ""); });
  $("b-oubli-retour").addEventListener("click", () => ecran("accueil"));
  $("f-oubli").addEventListener("submit", async e => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, cle($("o-mail").value), { url: location.href.split("#")[0] });
    } catch (err) {
      if (err.code === "auth/invalid-email" || err.code === "auth/too-many-requests" || err.code === "auth/network-request-failed")
        return msg("m-oubli", messageErreur(err), "erreur");
    }
    msg("m-oubli", "Si un compte existe pour cette adresse, un courriel vient de vous être envoyé. Ouvrez-le et choisissez un nouveau mot de passe. Pensez à regarder dans les indésirables.");
  });

  /* vérification du courriel */
  $("b-verifie").addEventListener("click", async () => {
    await reload(auth.currentUser);
    if (auth.currentUser.emailVerified) entrer(auth.currentUser);
    else msg("m-verif", "Votre adresse n'est pas encore confirmée. Cliquez sur le lien reçu par courriel, puis revenez ici.", "erreur");
  });
  $("b-renvoi").addEventListener("click", async () => {
    try {
      await sendEmailVerification(auth.currentUser, { url: location.href.split("#")[0] });
      msg("m-verif", "Un nouveau courriel vient d'être envoyé.");
    } catch (err) { msg("m-verif", messageErreur(err), "erreur"); }
  });

  document.querySelectorAll("[data-deconnexion]").forEach(b => b.addEventListener("click", () => signOut(auth)));

  onAuthStateChanged(auth, user => {
    if (creationEnCours) return;
    if (!user) return ecran("accueil");
    if (!user.emailVerified) return afficherVerification(user);
    entrer(user);
  });
}

let creationEnCours = false;

function afficherVerification(user) {
  $("v-mail").textContent = user.email;
  msg("m-verif", "");
  ecran("verification");
}

async function entrer(user) {
  ecran("chargement");
  try {
    const fiche = await getDoc(doc(db, "adherents", cle(user.email)));
    if (!fiche.exists()) { ecran("refuse"); return; }
    const d = fiche.data() || {};
    $("e-nom").textContent = d.nom ? d.nom : user.email;
    await chargerDocuments();
    ecran("espace");
  } catch (err) {
    ecran("refuse");
  }
}

async function chargerDocuments() {
  const liste = $("e-docs");
  liste.textContent = "";
  const snap = await getDocs(query(collection(db, "documents"), orderBy("date", "desc")));
  if (snap.empty) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "Aucun document n'a encore été déposé.";
    liste.appendChild(p);
    return;
  }
  snap.forEach(s => {
    const d = s.data();
    if (!/^https:\/\//.test(d.lien || "")) return;
    const ligne = document.createElement("div"); ligne.className = "doc";
    const ic = document.createElement("div"); ic.className = "ic"; ic.textContent = "PDF";
    const txt = document.createElement("div");
    const t = document.createElement("div"); t.className = "t"; t.textContent = d.titre || "Document";
    const m = document.createElement("div"); m.className = "m";
    m.textContent = [d.categorie, d.date ? new Date(d.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : ""].filter(Boolean).join(" · ");
    txt.append(t, m);
    const tag = document.createElement("span"); tag.className = "tag warn"; tag.textContent = "Adhérents";
    const a = document.createElement("a"); a.className = "btn ghost sm"; a.href = d.lien; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Ouvrir";
    ligne.append(ic, txt, tag, a);
    liste.appendChild(ligne);
  });
}
