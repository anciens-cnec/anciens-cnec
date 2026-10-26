/* Administration de l'espace membres : liste des adhérents et documents réservés.
   Accessible aux seules adresses enregistrées dans la collection « admins ». */
import { auth, db, configure, cle, messageErreur, ecran, msg } from "./firebase-commun.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, getDocs, collection, writeBatch, deleteDoc, addDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = id => document.getElementById(id);
const RE_MAIL = /^[^\s@;,<>]+@[^\s@;,<>]+\.[a-z]{2,}$/i;

if (!configure) ecran("bientot");
else demarrer();

function demarrer() {
  $("f-login").addEventListener("submit", async e => {
    e.preventDefault(); msg("m-login", "");
    try { await signInWithEmailAndPassword(auth, cle($("a-mail").value), $("a-mdp").value); }
    catch (err) { msg("m-login", messageErreur(err), "erreur"); }
  });
  document.querySelectorAll("[data-deconnexion]").forEach(b => b.addEventListener("click", () => signOut(auth)));

  onAuthStateChanged(auth, async user => {
    if (!user) return ecran("login");
    if (!user.emailVerified) { msg("m-login", "Confirmez d'abord votre adresse depuis l'espace membres.", "erreur"); await signOut(auth); return; }
    const adm = await getDoc(doc(db, "admins", cle(user.email))).catch(() => null);
    if (!adm || !adm.exists()) { msg("m-login", "Ce compte n'a pas les droits d'administration.", "erreur"); await signOut(auth); return; }
    ecran("admin");
    chargerAdherents(); chargerDocuments();
  });

  /* ajout d'adhérents par copier-coller */
  $("f-ajout").addEventListener("submit", async e => {
    e.preventDefault();
    const brut = $("ajout-liste").value.split(/[\s;,]+/).map(cle).filter(Boolean);
    const valides = [...new Set(brut.filter(x => RE_MAIL.test(x)))];
    const rejetes = brut.filter(x => !RE_MAIL.test(x));
    if (!valides.length) return msg("m-ajout", "Aucune adresse valide trouvée.", "erreur");
    try {
      for (let i = 0; i < valides.length; i += 400) {
        const lot = writeBatch(db);
        valides.slice(i, i + 400).forEach(m => lot.set(doc(db, "adherents", m), { ajoute: serverTimestamp() }, { merge: true }));
        await lot.commit();
      }
      $("ajout-liste").value = "";
      msg("m-ajout", valides.length + " adresse(s) enregistrée(s)." + (rejetes.length ? " Ignorées car invalides : " + rejetes.join(", ") : ""));
      chargerAdherents();
    } catch (err) { msg("m-ajout", messageErreur(err), "erreur"); }
  });

  $("filtre").addEventListener("input", filtrer);

  /* ajout d'un document */
  $("f-doc").addEventListener("submit", async e => {
    e.preventDefault();
    const lien = $("d-lien").value.trim();
    if (!/^https:\/\//.test(lien)) return msg("m-doc", "Le lien doit commencer par https://", "erreur");
    try {
      await addDoc(collection(db, "documents"), {
        titre: $("d-titre").value.trim(), categorie: $("d-cat").value, date: $("d-date").value, lien
      });
      e.target.reset();
      msg("m-doc", "Document ajouté.");
      chargerDocuments();
    } catch (err) { msg("m-doc", messageErreur(err), "erreur"); }
  });
}

let adherents = [];

async function chargerAdherents() {
  const snap = await getDocs(collection(db, "adherents"));
  adherents = snap.docs.map(d => d.id).sort();
  $("nb-adh").textContent = adherents.length;
  filtrer();
}

function filtrer() {
  const f = cle($("filtre").value);
  const corps = $("t-adh"); corps.textContent = "";
  adherents.filter(m => !f || m.includes(f)).slice(0, 300).forEach(m => {
    const tr = document.createElement("tr");
    const td = document.createElement("td"); td.textContent = m;
    const td2 = document.createElement("td"); td2.style.textAlign = "right";
    const b = document.createElement("button"); b.className = "linkbtn danger"; b.type = "button"; b.textContent = "Retirer";
    b.addEventListener("click", async () => {
      if (!confirm("Retirer " + m + " de la liste des adhérents ?")) return;
      await deleteDoc(doc(db, "adherents", m)); chargerAdherents();
    });
    td2.appendChild(b); tr.append(td, td2); corps.appendChild(tr);
  });
}

async function chargerDocuments() {
  const snap = await getDocs(query(collection(db, "documents"), orderBy("date", "desc")));
  const corps = $("t-docs"); corps.textContent = "";
  snap.forEach(s => {
    const d = s.data();
    const tr = document.createElement("tr");
    [d.titre, d.categorie, d.date].forEach(v => { const td = document.createElement("td"); td.textContent = v || ""; tr.appendChild(td); });
    const td = document.createElement("td"); td.style.textAlign = "right";
    const b = document.createElement("button"); b.className = "linkbtn danger"; b.type = "button"; b.textContent = "Supprimer";
    b.addEventListener("click", async () => {
      if (!confirm("Supprimer « " + d.titre + " » de l'espace membres ?")) return;
      await deleteDoc(doc(db, "documents", s.id)); chargerDocuments();
    });
    td.appendChild(b); tr.appendChild(td); corps.appendChild(tr);
  });
}
