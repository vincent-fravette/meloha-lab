/**
 * Initialise les sliders / carousels de la page.
 * Le script reste volontairement minimal : le navigateur gère le scroll,
 * CSS gère le snap et les animations, et JavaScript ne synchronise que les états utiles.
 */
(() => {
    'use strict'; // Active le mode strict pour éviter plusieurs erreurs silencieuses de JavaScript.

    const COMPONENT_SELECTOR = '.js-carousel-component'; // Sélectionne chaque composant qui utilise le moteur ci-dessous.
    const TRACK_SELECTOR = '.js-scroll-container'; // Sélectionne la zone réellement défilable sur mobile et tablette.
    const DOTS_SELECTOR = '.dots-indicators'; // Sélectionne la zone réservée aux points de navigation de l'e-shop.
    const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'; // Doit rester identique au breakpoint desktop défini dans le CSS.
    const EDGE_TOLERANCE = 2; // Évite les changements d'état dus aux petits écarts d'arrondi en pixels.
    const ACTIVE_DEBOUNCE = 120; // Attend un court instant après le dernier scroll avant de changer la carte active.

    const components = document.querySelectorAll(COMPONENT_SELECTOR); // Récupère tous les sliders présents sur la page.
    const desktopQuery = window.matchMedia(DESKTOP_MEDIA_QUERY); // Permet de distinguer le mode slider du mode grille desktop.
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)'); // Respecte le réglage d'accessibilité du système.

    /**
     * Retourne uniquement les cartes directement présentes dans le track.
     * Les pseudo-éléments de centrage ne sont donc jamais comptés comme des cartes.
     */
    const getCards = (track) => Array.from(track.children).filter((child) => child.classList.contains('card')); // Construit un tableau de cartes réel et stable.

    /**
     * Calcule et applique uniquement les indicateurs de bord.
     * Cette fonction ne touche jamais à transform, ce qui évite de perturber le scroll pendant le geste.
     */
    const updateEdges = (component, track) => {
        if (desktopQuery.matches) { // En desktop, le composant devient une grille et il n'y a plus de débordement horizontal utile.
            component.classList.remove('has-prev', 'has-next'); // Cache les deux dégradés sur desktop.
            return; // Évite tous les calculs inutiles lorsque la grille est active.
        }

        const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth); // Calcule la position maximale réellement atteignable.
        const hasPrevious = track.scrollLeft > EDGE_TOLERANCE; // Indique qu'une partie des cartes précédentes est déjà derrière le bord gauche.
        const hasNext = track.scrollLeft < maxScrollLeft - EDGE_TOLERANCE; // Indique qu'il reste des cartes accessibles vers la droite.

        component.classList.toggle('has-prev', hasPrevious); // Affiche ou cache le fondu gauche sans recalculer les cartes.
        component.classList.toggle('has-next', hasNext); // Affiche ou cache le fondu droit sans modifier la géométrie du track.
    };

    /**
     * Trouve la carte la plus proche du centre à partir de ses coordonnées de layout.
     * Ce calcul est exécuté uniquement quand le scroll est terminé, pas à chaque mouvement.
     */
    const getCenteredCardIndex = (track, cards) => {
        if (!cards.length) { // Vérifie qu'il existe au moins une carte exploitable.
            return -1; // Retourne un index invalide si le composant ne contient aucune carte.
        }

        const viewportCenter = track.scrollLeft + (track.clientWidth / 2); // Convertit le centre du viewport en coordonnée dans le contenu scrollable.
        let closestIndex = 0; // Utilise la première carte comme valeur initiale de comparaison.
        let closestDistance = Number.POSITIVE_INFINITY; // Initialise la distance minimale à l'infini.

        cards.forEach((card, index) => { // Parcourt chaque carte une seule fois après l'arrêt du défilement.
            const cardCenter = card.offsetLeft + (card.offsetWidth / 2); // Calcule le centre de la carte dans le même repère que viewportCenter.
            const distance = Math.abs(viewportCenter - cardCenter); // Mesure la distance entre le centre de la carte et le centre du viewport.

            if (distance < closestDistance) { // Garde la carte la plus proche du centre réel.
                closestDistance = distance; // Mémorise la meilleure distance trouvée.
                closestIndex = index; // Mémorise l'index de la carte correspondante.
            }
        });

        return closestIndex; // Retourne l'unique carte considérée comme active.
    };

    /**
     * Met à jour la carte active et les points de navigation.
     * Cette fonction n'est jamais appelée pendant le déplacement continu de l'utilisateur.
     */
    const updateActiveState = (component, track, cards, dots) => {
        if (desktopQuery.matches) { // Le mode desktop utilise une grille fixe sans carte centrale active.
            cards.forEach((card) => card.classList.remove('is-active')); // Supprime tout éventuel état actif restant après un changement de breakpoint.
            dots?.setAttribute('aria-hidden', 'true'); // Masque les points sur desktop car ils n'ont plus d'utilité.
            return; // Quitte immédiatement la fonction en mode grille.
        }

        const activeIndex = getCenteredCardIndex(track, cards); // Détermine la carte réellement centrée après le scroll.

        cards.forEach((card, index) => { // Parcourt toutes les cartes pour synchroniser une seule classe active.
            card.classList.toggle('is-active', index === activeIndex); // Le zoom ne change donc qu'une fois le scroll stabilisé.
        });

        if (!dots) { // Les prestations ne possèdent volontairement pas de points de navigation.
            return; // Évite tout traitement supplémentaire lorsque la zone dots n'existe pas.
        }

        dots.setAttribute('aria-hidden', 'false'); // Rend la navigation visible et utilisable en mode slider.

        Array.from(dots.children).forEach((dot, index) => { // Synchronise chaque bouton avec la carte active.
            const isActive = index === activeIndex; // Détermine si le bouton correspond à la carte centrée.
            dot.classList.toggle('is-active', isActive); // Déclenche uniquement l'animation de l'indicateur concerné.

            if (isActive) { // Marque le point actif pour les technologies d'assistance.
                dot.setAttribute('aria-current', 'true'); // Indique clairement quel élément représente la position courante.
            } else { // Retire l'état courant des autres points.
                dot.removeAttribute('aria-current'); // Garantit qu'un seul bouton est actif à la fois.
            }
        });
    };

    /**
     * Centre une carte donnée dans le viewport du slider.
     * La position cible est calculée à partir du layout et non du rendu transformé.
     */
    const scrollCardToCenter = (track, card) => {
        const targetLeft = card.offsetLeft - ((track.clientWidth - card.offsetWidth) / 2); // Calcule la position qui place le centre de la carte au centre du viewport.
        const left = Math.max(0, Math.min(targetLeft, track.scrollWidth - track.clientWidth)); // Limite la valeur pour rester dans les bornes réelles du scroll.
        const behavior = reduceMotionQuery.matches ? 'auto' : 'smooth'; // Respecte la préférence système concernant les animations.

        track.scrollTo({ // Utilise l'API native de défilement sans aucune dépendance.
            left, // Envoie la position horizontale calculée au navigateur.
            behavior // Demande un déplacement fluide uniquement lorsque cela est autorisé.
        });
    };

    /**
     * Crée les points de navigation du e-shop à partir des cartes réellement présentes dans le HTML.
     */
    const buildDots = (track, cards, dots, scheduleActiveUpdate) => {
        if (!dots) { // Ignore les composants qui n'utilisent pas d'indicateurs.
            return; // Les prestations restent volontairement sans points.
        }

        dots.replaceChildren(); // Supprime proprement les anciens points avant d'en créer de nouveaux.

        cards.forEach((card, index) => { // Crée exactement un bouton par carte produit.
            const button = document.createElement('button'); // Utilise un vrai bouton natif pour le clavier et l'accessibilité.
            button.type = 'button'; // Empêche tout comportement de soumission si le composant se trouve dans un formulaire.
            button.className = 'dot'; // Applique le style commun des indicateurs défini en CSS.
            button.setAttribute('aria-label', `Afficher le produit ${index + 1}`); // Fournit un nom explicite à chaque point.

            button.addEventListener('click', () => { // Réagit au clic du point sans gestionnaire inline dans le HTML.
                scrollCardToCenter(track, card); // Centre la carte correspondant au point sélectionné.
                scheduleActiveUpdate(); // Prépare la synchronisation finale après l'animation de scroll.
            });

            dots.append(button); // Insère le bouton créé dans le conteneur des indicateurs.
        });
    };

    /**
     * Initialise la synchronisation d'un composant.
     */
    const initComponent = (component) => {
        const track = component.querySelector(TRACK_SELECTOR); // Récupère la zone de scroll du composant courant.
        const dots = component.querySelector(DOTS_SELECTOR); // Récupère les indicateurs du composant courant lorsqu'ils existent.

        if (!track) { // Vérifie que le HTML contient bien le conteneur attendu.
            return; // Ignore proprement un composant incomplet.
        }

        const cards = getCards(track); // Récupère la liste stable des cartes du composant.

        if (!cards.length) { // Vérifie que le track contient réellement des cartes.
            return; // Évite d'attacher des événements à un composant vide.
        }

        let activeTimer = 0; // Conserve le minuteur utilisé comme solution de secours pour les navigateurs sans scrollend.
        let edgeFrame = 0; // Conserve l'identifiant de frame utilisé pour limiter les mises à jour des fondus.

        /**
         * Met à jour les fondus au maximum une fois par frame pendant le scroll.
         */
        const scheduleEdgeUpdate = () => {
            if (edgeFrame) { // Vérifie si une mise à jour est déjà programmée.
                return; // Ne planifie pas plusieurs traitements pour la même frame.
            }

            edgeFrame = window.requestAnimationFrame(() => { // Place le calcul juste avant le rendu visuel du navigateur.
                edgeFrame = 0; // Libère la frame pour le prochain événement de scroll.
                updateEdges(component, track); // Met uniquement à jour les classes de dégradé.
            });
        };

        /**
         * Programme la mise à jour de la carte active après l'arrêt du scroll.
         */
        const scheduleActiveUpdate = () => {
            window.clearTimeout(activeTimer); // Annule le précédent minuteur afin de ne pas enchaîner plusieurs changements d'état.
            activeTimer = window.setTimeout(() => { // Attend quelques millisecondes après le dernier mouvement.
                activeTimer = 0; // Réinitialise l'état du minuteur avant le prochain défilement.
                updateActiveState(component, track, cards, dots); // Applique le zoom et synchronise les points une fois le mouvement terminé.
            }, ACTIVE_DEBOUNCE); // Utilise un délai court pour garder une sensation de réactivité sans saccade.
        };

        if (dots) { // Vérifie si ce composant dispose d'un système de points.
            buildDots(track, cards, dots, scheduleActiveUpdate); // Génère automatiquement les boutons de navigation.
        }

        track.addEventListener('scroll', () => { // Écoute le défilement natif du track.
            scheduleEdgeUpdate(); // Met uniquement à jour les dégradés pendant le mouvement.
            scheduleActiveUpdate(); // Attend la fin du mouvement avant de modifier la carte zoomée.
        }, { passive: true }); // Signale au navigateur que le listener ne bloquera jamais le geste tactile.

        track.addEventListener('scrollend', () => { // Utilise l'événement natif de fin de scroll lorsqu'il est supporté.
            window.clearTimeout(activeTimer); // Annule le fallback pour éviter une double mise à jour.
            activeTimer = 0; // Réinitialise le minuteur avant le calcul final.
            updateActiveState(component, track, cards, dots); // Applique immédiatement l'état actif lorsque le scroll est réellement terminé.
        }, { passive: true }); // Conserve un listener non bloquant.

        window.addEventListener('resize', () => { // Réagit aux changements de taille de fenêtre.
            scheduleEdgeUpdate(); // Met à jour les dégradés si la zone de scroll change de largeur.
            scheduleActiveUpdate(); // Recalcule la carte centrale après le changement de géométrie.
        });

        desktopQuery.addEventListener?.('change', () => { // Réagit au passage slider <-> grille lors d'un changement de breakpoint.
            scheduleEdgeUpdate(); // Met immédiatement les dégradés dans le bon état.
            scheduleActiveUpdate(); // Supprime ou restaure l'état actif selon le nouveau mode.
        });

        if ('ResizeObserver' in window) { // Utilise ResizeObserver lorsqu'il est disponible.
            const resizeObserver = new ResizeObserver(() => { // Observe les changements de dimensions du composant.
                scheduleEdgeUpdate(); // Recalcule les limites de scroll visuelles.
                scheduleActiveUpdate(); // Recalcule la carte centrale sans intervenir pendant le mouvement.
            });
            resizeObserver.observe(track); // Observe directement le track du composant.
        }

        updateEdges(component, track); // Applique immédiatement l'état initial des fondus.
        updateActiveState(component, track, cards, dots); // Initialise la première carte active sans animation forcée.
    };

    components.forEach(initComponent); // Initialise tous les composants trouvés dans le document.
})();
