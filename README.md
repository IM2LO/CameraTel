# CameraTel

Application web installable pour afficher la caméra frontale ou arrière et projeter le téléphone via Smart View. Aucun enregistrement, microphone ou envoi des images.

## Utilisation

Ouvrir https://im2lo.github.io/CameraTel/ dans Chrome sur Android. Installer depuis le menu ⋮, lancer depuis son icône, autoriser la caméra et activer Smart View.

Double tap sur l’image pour ouvrir trois réglages : caméra avant/arrière, cadrage (image entière ou remplir), plein écran. Le menu disparaît après huit secondes. La caméra frontale conserve les textes lisibles sans effet miroir. Le verrouillage de veille est demandé quand le navigateur le permet.

Le plein écran demande le masquage des barres Android. Android conserve le contrôle des boutons système, des notifications et des indicateurs de confidentialité ; un geste depuis le bord peut les faire réapparaître. Vérifier sur le Samsung et le récepteur Smart View utilisés.

## Hébergement

Fichiers statiques à la racine, sans dépendances ni compilation. GitHub Pages publie la branche main, dossier /. Tous les chemins sont relatifs et compatibles avec /CameraTel/. HTTPS est nécessaire à la caméra. Le service worker met uniquement les fichiers de l’application en cache, jamais des images caméra.

## Vérification

Syntaxe JavaScript vérifiée. Démarrage, double tap, changement de caméra et arrêt des anciennes pistes, cadrage, fermeture automatique et refus de permission testés dans Edge avec des flux simulés. La projection Smart View doit être vérifiée sur un téléphone réel.
