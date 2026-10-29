/* Dépôt des délégations : page réservée aux délégués régionaux.
   Un délégué peut déposer un document et retirer l'un des siens.
   Il n'a aucun accès à la liste des adhérents. */
import { auth, db, configure, cle, messageErreur, ecran, msg } from "./firebase-commun.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, getDocs, collection, addDoc, deleteDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = id => document.getElementById(id);

if (!configure) ecran("bientot");
else demarrer();

let moi = "";

function demarrer() {
  $("f-login").addEventListener("submit", async e => {
    e.preventDefault(); msg("m-login", "");
    try { await signInWithEmailAndPassword(auth, cle($("a-mail").value), $("a-mdp").value); }
    catch (err) { msg("m-login", messageErreur(err), "erreur"); }
  });

  document.querySelectorAll("[data-deconnexion]").forEach(b =>
    b.addEventListener("click", () => signOut(auth)));

  onAuthStateChanged(auth, async user => {
    if (!user) return ecran("login");
    if (!user.emailVerified) {
      msg("m-login", "Confirmez d'abord votre adresse depuis l'espace membres.", "erreur");
      await signOut(auth); return;
    }
    await user.getIdToken(true).catch(() => null);

    moi = cle(user.email);
    const fiche = await getDoc(doc(db, "delegues", moi)).catch(() => null);
    if (!fiche || !fiche.exists()) {
      msg("m-login", "Cette page est réservée aux délégués régionaux. Si vous pensez devoir y accéder, écrivez au siège.", "erreur");
      await signOut(auth); return;
    }

    const d = fiche.data() || {};
    $("d-nom").textContent = d.nom ? ", " + d.nom : "";
    if (d.delegation) $("p-delegation").value = d.delegation;
    ecran("depot");
    chargerDepots();
  });

  /* ---------- dépôt d'un document ---------- */
  $("f-depot").addEventListener("submit", async e => {
    e.preventDefault();
    msg("m-depot", "");
    const lien = $("p-lien").value.trim();
    if (!/^https:\/\//i.test(lien))
      return msg("m-depot", "Le lien doit commencer par https://", "erreur");

    const bouton = e.submitter;
    bouton.disabled = true;
    try {
      await addDoc(collection(db, "documents"), {
        titre: $("p-titre").value.trim(),
        categorie: $("p-cat").value,
        delegation: $("p-delegation").value.trim(),
        date: $("p-date").value,
        lien,
        auteur: moi,
        depotLe: serverTimestamp()
      });
      const delegation = $("p-delegation").value;
      e.target.reset();
      $("p-delegation").value = delegation;   /* la délégation ne change pas d'un dépôt à l'autre */
      msg("m-depot", "Votre document est déposé. Il est visible dès maintenant dans l'espace adhérents.");
      chargerDepots();
    } catch (err) {
      msg("m-depot", messageErreur(err), "erreur");
    }
    bouton.disabled = false;
  });
}

/* ---------- la liste de ses propres dépôts ---------- */
async function chargerDepots() {
  const corps = $("t-depots");
  corps.textContent = "";
  let snap;
  try {
    snap = await getDocs(query(collection(db, "documents"), orderBy("date", "desc")));
  } catch (err) {
    return ligneSimple(corps, "Liste momentanément indisponible.");
  }

  const miens = snap.docs.filter(s => ((s.data() || {}).auteur || "") === moi);
  if (!miens.length) return ligneSimple(corps, "Vous n'avez encore rien déposé.");

  miens.slice(0, 30).forEach(s => {
    const v = s.data() || {};
    const tr = document.createElement("tr");

    const t1 = document.createElement("td");
    t1.textContent = v.titre || "Document";

    const t2 = document.createElement("td");
    t2.style.whiteSpace = "nowrap";
    t2.textContent = v.date
      ? new Date(v.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "";

    const t3 = document.createElement("td");
    t3.style.textAlign = "right";
    const b = document.createElement("button");
    b.className = "linkbtn danger";
    b.type = "button";
    b.textContent = "Retirer";
    b.addEventListener("click", async () => {
      if (!confirm("Retirer « " + (v.titre || "ce document") + " » de l'espace adhérents ?")) return;
      try {
        await deleteDoc(doc(db, "documents", s.id));
        chargerDepots();
      } catch (err) {
        msg("m-depot", messageErreur(err), "erreur");
      }
    });
    t3.appendChild(b);

    tr.append(t1, t2, t3);
    corps.appendChild(tr);
  });
}

function ligneSimple(corps, texte) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 3;
  td.style.color = "var(--muted)";
  td.textContent = texte;
  tr.appendChild(td);
  corps.appendChild(tr);
}
