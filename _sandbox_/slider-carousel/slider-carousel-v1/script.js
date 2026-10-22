/**
 * Gère les deux composants "Prestations" et "E-shop" sans dépendance externe.
 * Le CSS réalise toute la mise en page, tandis que ce script ne s'occupe que de :
 * 1. détecter le débordement horizontal ;
 * 2. trouver la carte la plus proche du centre ;
 * 3. afficher/mettre à jour les indicateurs ;
 * 4. générer les points du e-shop ;
 * 5. permettre le déplacement fluide vers une carte précise.
 */

(() => {
    'use strict'; // Active le mode strict pour réduire les erreurs silencieuses et les comportements ambigus.

    const COMPONENT_SELECTOR = '.js-carousel-component'; // Sélectionne uniquement les composants ayant besoin de ce moteur.
    const TRACK_SELECTOR = '.js-scroll-container'; // Identifie le conteneur qui peut défiler sur mobile et tablette.
    const DOTS_SELECTOR = '.dots-indicators'; // Identifie la zone dans laquelle les points du e-shop seront créés.
    const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'; // Doit correspondre exactement au breakpoint desktop défini en CSS.
    const EDGE_TOLERANCE = 2; // Autorise une petite tolérance de pixels pour éviter les changements d'état causés par les arrondis.

    const components = document.querySelectorAll(COMPONENT_SELECTOR); // Récupère tous les composants présents dans la page.
    const desktopQuery = window.matchMedia(DESKTOP_MEDIA_QUERY); // Permet de savoir si le composant est actuellement en mode grille.

    /**
     * Retourne toutes les cartes réelles du track.
     * Les pseudo-éléments CSS ::before et ::after ne sont donc jamais pris en compte ici.
     */
    const getCards = (track) => Array.from(track.querySelectorAll(':scope > .card')); // Transforme la NodeList en tableau JavaScript exploitable.

    /**
     * Déplace une carte précise au centre du viewport horizontal.
     */
    const scrollCardToCenter = (track, card) => {
        const targetLeft = card.offsetLeft - ((track.clientWidth - card.offsetWidth) / 2); // Calcule la position de scroll qui place le centre de la carte au centre du track.
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; // Vérifie si l'utilisateur demande moins d'animations.
        const behavior = reduceMotion ? 'auto' : 'smooth'; // Choisit un déplacement instantané ou animé selon la préférence système.

        track.scrollTo({ // Utilise l'API native de scroll sans dépendance externe.
            left: Math.max(0, targetLeft), // Empêche une position négative au cas où la carte serait proche du début.
            behavior // Anime le déplacement uniquement lorsque cela est autorisé par les préférences utilisateur.
        });
    };

    /**
     * Détecte la carte qui se trouve le plus près du centre du flux visible.
     */
    const getCenteredCardIndex = (track, cards) => {
        const trackRect = track.getBoundingClientRect(); // Récupère la position réelle du viewport du slider.
        const trackCenter = trackRect.left + (trackRect.width / 2); // Calcule le point central absolu du slider dans la fenêtre.
        let closestIndex = -1; // Initialise l'index de la meilleure carte avec une valeur invalide.
        let closestDistance = Number.POSITIVE_INFINITY; // Initialise la distance minimale avec une valeur suffisamment grande.

        cards.forEach((card, index) => { // Parcourt chaque carte pour comparer sa position au centre du slider.
            const cardRect = card.getBoundingClientRect(); // Récupère la position réelle de la carte dans la fenêtre.
            const cardCenter = cardRect.left + (cardRect.width / 2); // Calcule le centre horizontal de la carte.
            const distance = Math.abs(trackCenter - cardCenter); // Mesure l'écart entre le centre de la carte et le centre du slider.

            if (distance < closestDistance) { // Vérifie si la carte actuelle est plus proche que la meilleure trouvée auparavant.
                closestDistance = distance; // Enregistre sa distance afin de pouvoir faire la prochaine comparaison.
                closestIndex = index; // Enregistre son index comme nouvelle carte active potentielle.
            }
        });

        return closestIndex; // Retourne l'index de la carte la plus précisément centrée.
    };

    /**
     * Met à jour les classes de débordement et la carte active sans forcer plusieurs recalculs par frame.
     */
    const updateComponent = (component, track, cards, dots) => {
        if (desktopQuery.matches) { // Vérifie si le composant est affiché en grille desktop.
            component.classList.remove('has-prev', 'has-next'); // Supprime les indicateurs de scroll puisqu'il n'y a plus de débordement horizontal à gérer.
            cards.forEach((card) => card.classList.remove('is-active')); // Retire le zoom central propre au mode slider.
            dots?.setAttribute('aria-hidden', 'true'); // Masque sémantiquement les points sur desktop si la grille est active.
            return; // Stoppe le traitement inutile de scroll lorsque la grille est affichée.
        }

        const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth); // Calcule la distance horizontale maximale réellement disponible.
        const hasPrevious = track.scrollLeft > EDGE_TOLERANCE; // Détecte si l'utilisateur a déjà quitté la position de départ.
        const hasNext = track.scrollLeft < (maxScrollLeft - EDGE_TOLERANCE); // Détecte s'il reste du contenu accessible vers la droite.
        const activeIndex = getCenteredCardIndex(track, cards); // Recherche la carte la plus proche du centre visible.

        component.classList.toggle('has-prev', hasPrevious); // Affiche le dégradé gauche uniquement après un déplacement vers la droite.
        component.classList.toggle('has-next', hasNext); // Affiche le dégradé droit uniquement lorsqu'il reste du contenu à parcourir.
        dots?.setAttribute('aria-hidden', dots.children.length ? 'false' : 'true'); // Rend les points accessibles uniquement lorsqu'ils existent réellement.

        cards.forEach((card, index) => { // Parcourt toutes les cartes pour synchroniser leur état visuel.
            card.classList.toggle('is-active', index === activeIndex); // Ajoute le zoom uniquement à la carte qui passe précisément au centre du flux.
        });

        if (dots && activeIndex >= 0) { // Met à jour les points uniquement lorsque le composant e-shop dispose d'une carte active valide.
            Array.from(dots.children).forEach((dot, index) => { // Parcourt les boutons de navigation générés précédemment.
                const isActive = index === activeIndex; // Détermine si le point correspond à la carte centrée.
                dot.classList.toggle('is-active', isActive); // Transforme le point actif en petite barre grâce au CSS.
                if (isActive) { // Ajoute aria-current uniquement au point actuellement sélectionné.
                    dot.setAttribute('aria-current', 'true'); // Signale à une technologie d'assistance quel élément représente l'état actif.
                } else { // Retire l'attribut sur tous les autres points pour éviter plusieurs états simultanés.
                    dot.removeAttribute('aria-current'); // Maintient un seul point comme état courant.
                }
            });
        }
    };

    /**
     * Programme une seule mise à jour par frame d'animation, même si de nombreux événements scroll arrivent rapidement.
     */
    const createScheduler = (component, track, cards, dots) => {
        let frameId = 0; // Conserve l'identifiant de la frame actuellement programmée.

        const schedule = () => { // Déclare la fonction appelée par le scroll et les changements de taille.
            if (frameId) { // Vérifie si une mise à jour est déjà prévue pour la frame courante.
                return; // Évite de programmer plusieurs recalculs inutiles.
            }

            frameId = window.requestAnimationFrame(() => { // Reporte le calcul juste avant le prochain rendu visuel du navigateur.
                frameId = 0; // Réinitialise l'indicateur pour permettre la prochaine mise à jour.
                updateComponent(component, track, cards, dots); // Recalcule l'état visuel du composant une seule fois.
            });
        };

        return schedule; // Retourne la fonction afin que les écouteurs d'événements puissent la réutiliser.
    };

    /**
     * Construit les points de navigation de l'e-shop à partir du nombre réel de cartes.
     * Aucun HTML injecté n'est utilisé afin de garder le rendu plus sûr et plus prévisible.
     */
    const buildDots = (component, track, cards, dots, schedule) => {
        if (!dots) { // Ignore proprement les composants ne disposant pas d'une zone de points.
            return; // Les Prestations n'ont pas besoin de points de navigation.
        }

        dots.replaceChildren(); // Supprime les anciens points avant de reconstruire une version cohérente après modification du HTML.

        cards.forEach((card, index) => { // Crée un bouton pour chaque carte produit.
            const button = document.createElement('button'); // Crée un vrai bouton natif accessible au clavier et aux lecteurs d'écran.
            button.type = 'button'; // Empêche le bouton de devenir un bouton submit si le composant est placé dans un formulaire.
            button.className = 'dot'; // Applique le style visuel défini dans style.css.
            button.setAttribute('aria-label', `Afficher le produit ${index + 1}`); // Donne une description unique et lisible à chaque bouton.
            button.addEventListener('click', () => { // Réagit au clic sans ajouter de gestionnaire inline au HTML.
                scrollCardToCenter(track, card); // Recentre exactement la carte associée au point cliqué.
                schedule(); // Met à jour les états après le lancement du scroll.
            });
            dots.append(button); // Ajoute le bouton au DOM sans passer par innerHTML.
        });
    };

    /**
     * Initialise un composant individuel.
     */
    const initComponent = (component) => {
        const track = component.querySelector(TRACK_SELECTOR); // Cherche le track du composant courant.
        const dots = component.querySelector(DOTS_SELECTOR); // Cherche la zone des indicateurs du composant courant.

        if (!track) { // Vérifie que le HTML contient bien un track exploitable.
            return; // Stoppe proprement l'initialisation si le composant est incomplet.
        }

        const cards = getCards(track); // Récupère les cartes réelles du composant.

        if (!cards.length) { // Vérifie qu'au moins une carte est présente.
            return; // Évite les calculs et événements inutiles sur un composant vide.
        }

        const schedule = createScheduler(component, track, cards, dots); // Crée le système de synchronisation optimisé du composant.

        if (dots) { // Vérifie si le composant possède des points, ce qui correspond ici à l'e-shop.
            buildDots(component, track, cards, dots, schedule); // Génère autant de points qu'il y a de cartes.
        }

        track.addEventListener('scroll', schedule, { passive: true }); // Écoute le scroll sans bloquer le thread principal.
        window.addEventListener('resize', schedule, { passive: true }); // Recalcule les états lorsque la largeur ou le breakpoint change.

        if ('ResizeObserver' in window) { // Utilise ResizeObserver lorsqu'il est disponible dans le navigateur.
            const resizeObserver = new ResizeObserver(schedule); // Observe la taille réelle du track et garde le composant synchronisé.
            resizeObserver.observe(track); // Active l'observation du composant courant.
        }

        desktopQuery.addEventListener?.('change', schedule); // Met à jour immédiatement l'état lorsque le breakpoint desktop est franchi.
        schedule(); // Effectue une première synchronisation dès l'initialisation.
    };

    components.forEach(initComponent); // Initialise tous les composants présents dans le document.
})();
