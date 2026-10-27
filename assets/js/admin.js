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
    await user.getIdToken(true).catch(() => null);
    const adm = await getDoc(doc(db, "admins", cle(user.email))).catch(() => null);
    if (!adm || !adm.exists()) { msg("m-login", "Ce compte n'a pas les droits d'administration.", "erreur"); await signOut(auth); return; }
    ecran("admin");
    chargerAdherents(); chargerDocuments();
  });

  /* ajout d'adhérents par copier-coller : adresse seule, ou nom et adresse */
  $("f-ajout").addEventListener("submit", async e => {
    e.preventDefault();
    const { fiches, rejets } = analyser($("ajout-liste").value);
    if (!fiches.length) return msg("m-ajout", "Aucune adresse valide trouvée.", "erreur");
    try {
      for (let i = 0; i < fiches.length; i += 400) {
        const lot = writeBatch(db);
        fiches.slice(i, i + 400).forEach(f => {
          /* un collage sans nom n'efface jamais un nom déjà enregistré */
          const donnees = f.nom ? { nom: f.nom, ajoute: serverTimestamp() } : { ajoute: serverTimestamp() };
          lot.set(doc(db, "adherents", f.mail), donnees, { merge: true });
        });
        await lot.commit();
      }
      $("ajout-liste").value = "";
      const avecNom = fiches.filter(f => f.nom).length;
      msg("m-ajout",
        fiches.length + " adresse(s) enregistrée(s)" +
        (avecNom ? ", dont " + avecNom + " avec le nom" : "") + "." +
        (rejets.length ? " Lignes ignorées : " + rejets.slice(0, 5).join(" / ") + (rejets.length > 5 ? " …" : "") : ""));
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

/* Découpe le collage. Chaque ligne peut contenir, dans n'importe quel ordre
   et séparés par une tabulation, un point-virgule, une virgule ou des espaces :
   une adresse de courriel, et éventuellement le nom de l'adhérent.
   Deux colonnes copiées depuis un tableur arrivent séparées par une tabulation. */
function analyser(texte) {
  const fiches = [], rejets = [], vus = new Set();
  for (const brute of String(texte || "").split(/\r?\n/)) {
    const ligne = brute.trim();
    if (!ligne) continue;
    const mots = ligne.split(/[\t;,\s]+/).map(s => s.trim()).filter(Boolean);
    const adresses = mots.filter(m => RE_MAIL.test(m));
    if (!adresses.length) { rejets.push(ligne); continue; }
    /* plusieurs adresses sur la même ligne : on ne sait pas à qui attribuer le nom */
    const nom = adresses.length === 1 ? mots.filter(m => !RE_MAIL.test(m)).join(" ").trim() : "";
    adresses.forEach(a => {
      const mail = cle(a);
      if (vus.has(mail)) return;
      vus.add(mail);
      fiches.push({ mail, nom });
    });
  }
  return { fiches, rejets };
}

const sansAccent = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

async function chargerAdherents() {
  const snap = await getDocs(collection(db, "adherents"));
  adherents = snap.docs
    .map(d => ({ mail: d.id, nom: ((d.data() || {}).nom || "").trim() }))
    .sort((a, b) => (a.nom || a.mail).localeCompare(b.nom || b.mail, "fr", { sensitivity: "base" }));
  $("nb-adh").textContent = adherents.length;
  filtrer();
}

function filtrer() {
  const f = sansAccent($("filtre").value);
  const corps = $("t-adh"); corps.textContent = "";
  const trouves = adherents.filter(a => !f || sansAccent(a.nom + " " + a.mail).includes(f));
  if (!trouves.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 2; td.style.color = "var(--muted)";
    td.textContent = adherents.length ? "Aucun adhérent ne correspond." : "Aucun adhérent enregistré.";
    tr.appendChild(td); corps.appendChild(tr);
    return;
  }
  trouves.slice(0, 400).forEach(a => {
    const tr = document.createElement("tr");

    const td = document.createElement("td");
    if (a.nom) {
      const n = document.createElement("div");
      n.style.fontWeight = "600";
      n.textContent = a.nom;
      const m = document.createElement("div");
      m.style.fontSize = "13px"; m.style.color = "var(--muted)";
      m.textContent = a.mail;
      td.append(n, m);
    } else {
      td.textContent = a.mail;
    }

    const td2 = document.createElement("td");
    td2.style.textAlign = "right";
    const b = document.createElement("button");
    b.className = "linkbtn danger"; b.type = "button"; b.textContent = "Retirer";
    b.addEventListener("click", async () => {
      if (!confirm("Retirer " + (a.nom ? a.nom + " (" + a.mail + ")" : a.mail) + " de la liste des adhérents ?")) return;
      await deleteDoc(doc(db, "adherents", a.mail));
      chargerAdherents();
    });
    td2.appendChild(b);

    tr.append(td, td2);
    corps.appendChild(tr);
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
