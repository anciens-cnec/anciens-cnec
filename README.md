# Site de l'amicale — mode d'emploi du webmestre

Ce dossier **est** le site. Il ne contient que des pages HTML, des images et des PDF :
aucune base de données, aucun logiciel à installer sur le serveur, rien à mettre à jour
pour des raisons de sécurité. C'est ce qui le rend gratuit à héberger et quasiment
indestructible.

---

## 1. Le nom de domaine

**Attention :** `aabc.cnec.fr` n'est pas achetable. C'est un *sous-domaine* de `cnec.fr`,
qui appartient à son propriétaire — pas à l'amicale. Pour l'obtenir il faudrait que le
détenteur de `cnec.fr` vous le délègue.

Ce que l'amicale peut déposer à son nom, pour une quinzaine d'euros par an :

- `aabc-cnec.fr`
- `anciens-cnec.fr`
- `amicale-choc.fr`
- `1er-choc.fr`

Vérifiez la disponibilité chez un bureau d'enregistrement (OVHcloud, Gandi, Ionos…),
et **déposez-le au nom de l'association**, pas d'une personne : le jour où le webmestre
change, le domaine reste à l'amicale.

Le fichier `CNAME` a été retiré pour que le site fonctionne d'abord à l'adresse
`https://VOTRECOMPTE.github.io`. Le jour où le nom de domaine est déposé, saisissez-le
dans **Settings → Pages → Custom domain** : GitHub recrée le fichier tout seul.

---

## 2. Mettre le site en ligne sur GitHub Pages

1. Créez un compte GitHub **au nom de l'association** (par exemple `amicale-cnec`),
   avec l'adresse `aabc.cnec.1er.rgt.de.choc@gmail.com`.
2. Créez un dépôt public nommé `site` (ou `amicale-cnec.github.io`).
3. Déposez le contenu de ce dossier à la racine du dépôt
   (bouton **Add file → Upload files**, puis glissez tout le contenu).
4. Dans **Settings → Pages**, choisissez la branche `main` et le dossier `/ (root)`.
5. Toujours dans **Settings → Pages**, champ **Custom domain**, saisissez votre nom de
   domaine, puis **Save**.
6. Chez votre bureau d'enregistrement, créez les enregistrements DNS :

   | Type | Nom | Valeur |
   |---|---|---|
   | A | @ | `185.199.108.153` |
   | A | @ | `185.199.109.153` |
   | A | @ | `185.199.110.153` |
   | A | @ | `185.199.111.153` |
   | CNAME | www | `VOTRECOMPTE.github.io` |

7. Comptez jusqu'à 24 heures de propagation. Revenez ensuite dans **Settings → Pages**
   et cochez **Enforce HTTPS** : le site passe en `https://` avec un certificat gratuit.

---

## 3. Qui peut déposer des contenus ?

C'est la question posée en assemblée. Voici les réponses honnêtes.

### Ce qui est possible techniquement

GitHub permet d'ajouter un fichier depuis un navigateur, par glisser-déposer
(**Add file → Upload files**). Mais il faut :

- que chaque délégué ait **un compte GitHub** et soit invité comme collaborateur ;
- que quelqu'un **déclare ensuite la photo ou le document dans la page** — déposer un
  fichier ne le fait pas apparaître tout seul sur le site.

Pour dix délégués, c'est une mauvaise idée : vous passerez plus de temps à dépanner des
comptes qu'à publier.

### Ce que je recommande pour démarrer

**Le webmestre centralise.** Les délégués envoient à l'adresse de l'amicale un texte
court et trois à cinq photos après chaque cérémonie — exactement ce que l'article 4 du
règlement intérieur leur demande déjà pour le bulletin. Le webmestre publie.
Comptez dix minutes par article.

Pour faciliter l'envoi des photos, qui sont souvent trop lourdes pour un courriel :
créez un **dossier partagé** (Google Drive, Framadrive, WeTransfer) dont le lien est
donné aux dix délégués. Ils y déposent ; le webmestre reprend.

### Si le site vit bien, dans un an

Ajoutez **Decap CMS** (anciennement Netlify CMS) : une interface d'administration qui
se greffe sur le dépôt GitHub et permet de saisir un article dans un formulaire, avec
dépôt de photos et aperçu — sans voir une ligne de code. Le logiciel est libre et
gratuit, mais son installation demande de créer une application d'authentification :
une bonne demi-journée pour quelqu'un à l'aise, ou l'offre payante qui évite cette étape.

N'y allez pas tout de suite. Vérifiez d'abord que les comptes rendus arrivent
réellement. Un outil d'administration sur un site que personne n'alimente ne sert à rien.

---

## 4. Ajouter une actualité (webmestre)

1. Ouvrez `actualites.html`.
2. Copiez le bloc `<article>` le plus récent, collez-le juste après `<div class="news">`.
3. Changez la date, le titre et le chapô. Les catégories possibles sont
   `ceremonie`, `assoc`, `memoire`, `centre` (attribut `data-cat`).
4. Pour un article long, dupliquez `actualite-pont-de-claix.html`, renommez-le,
   remplacez le contenu, et faites pointer le bouton « Lire le compte rendu » vers lui.

**Les photos** vont dans `assets/img/`. Redimensionnez-les à 1 600 pixels de large
maximum avant de les déposer (un appareil photo produit des fichiers de 5 Mo ; une page
qui en charge dix met une éternité à s'ouvrir sur un téléphone).

**Les PDF** vont dans `documents/`, et se déclarent dans `documents.html`.

---

## 5. Ce que ce site ne fait pas

- **Pas d'espace membres ni d'administration en ligne** : un site statique ne gère pas
  de comptes. L'annuaire reste au bureau.
- **Pas de paiement** : l'adhésion et la boutique renvoient vers un courriel. Une page
  HelloAsso — gratuite pour les associations, sans commission — prendra le relais quand
  le bureau le décidera ; il suffira alors de remplacer un lien dans `adhesion.html` et
  `boutique.html`.
- **Pas de formulaire de contact** : les formulaires ont besoin d'un serveur. Le site
  affiche une adresse de courriel, ce qui est plus fiable et plus simple à relever.

---

## 6. À faire avant la mise en ligne

- [ ] Déposer le nom de domaine **au nom de l'association** et le saisir dans Settings → Pages.
- [ ] Compléter le **numéro de déclaration en préfecture** dans `mentions-legales.html`
      et dans `association.html`.
- [ ] Faire **relire la frise historique** (`histoire.html`) par la commission mémoire :
      les dates proviennent de sources publiques et n'ont pas été validées.
- [ ] Vérifier avec le commandement du CNEC l'**usage de l'insigne** et de la photographie
      du fort Miradou, qui porte le filigrane « CNEC 1choc ».
- [x] Bureau et délégués : seuls les noms et prénoms sont publiés (adresses, courriels
      et téléphones retirés).
- [ ] Corriger deux coquilles relevées dans le bulletin : **Servance-Miellin** est en
      Haute-Saône (code postal 70440, et non 07440), et le délégué Nord/Nord-Est est
      écrit *AMSELM* alors que son adresse est `didier.anselm@`.
