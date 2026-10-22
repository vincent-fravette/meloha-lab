/* Active le mode strict pour réduire certaines erreurs silencieuses du JavaScript. */
'use strict';

/* Encapsule tout le script pour éviter de polluer l'espace global de la page. */
(() => {
    /* Cible le breakpoint auquel les listes deviennent des grilles desktop. */
    const DESKTOP_QUERY = window.matchMedia('(min-width: 1080px)');

    /* Définit un seuil de tolérance en pixels pour éviter les faux écarts liés aux décimales de rendu. */
    const SCROLL_EPSILON = 2;

    /* Regroupe les instances de composants trouvées dans le document. */
    const components = [...document.querySelectorAll('[data-scroll-component]')].map(createComponent);

    /* Arrête proprement le script lorsqu'aucun composant n'existe sur la page. */
    if (!components.length) return;

    /* Initialise toutes les instances présentes dans le HTML. */
    components.forEach(initComponent);

    /* Réévalue le comportement lorsque le navigateur passe du mobile/tablette au desktop ou inversement. */
    DESKTOP_QUERY.addEventListener('change', () => {
        /* Réinitialise l'état visuel et la navigation de chaque composant. */
        components.forEach(component => {
            /* Remet le scroll à gauche lors d'un changement de mode pour éviter une position incohérente. */
            component.viewport.scrollTo({ left: 0, behavior: 'auto' });
            /* Met à jour la configuration calculée. */
            syncComponent(component);
        });
    });

    /* Construit un objet de travail à partir d'un composant HTML. */
    function createComponent(root) {
        /* Récupère la zone défilable du composant. */
        const viewport = root.querySelector('[data-scroll-viewport]');
        /* Récupère la liste qui contient réellement les cartes. */
        const track = root.querySelector('[data-scroll-track]');
        /* Récupère les indicateurs de navigation lorsqu'ils existent. */
        const dots = root.querySelector('.dots-indicators');
        /* Récupère toutes les cartes présentes dans la liste. */
        const cards = [...track.querySelectorAll('.card')];

        /* Retourne toutes les références nécessaires sans exposer de variables globales. */
        return {
            root,
            viewport,
            track,
            dots,
            cards,
            rafId: 0,
            resizeObserver: null,
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
        };
    }

    /* Initialise un composant avec ses écouteurs et son premier état. */
    function initComponent(component) {
        /* Synchronise l'état dès le chargement pour afficher immédiatement les bons indicateurs. */
        syncComponent(component);

        /* Met à jour l'indicateur de débordement pendant le défilement sans recalculer à chaque événement brut. */
        component.viewport.addEventListener('scroll', () => scheduleSync(component), { passive: true });

        /* Recalcule les dimensions lorsqu'une image ou le viewport change de taille. */
        component.resizeObserver = new ResizeObserver(() => syncComponent(component));

        /* Observe la zone qui défile car c'est elle qui détermine l'espace disponible. */
        component.resizeObserver.observe(component.viewport);

        /* Observe également la piste afin de détecter l'arrivée ou le retrait de contenu dimensionnant la zone. */
        component.resizeObserver.observe(component.track);

        /* Écoute les changements du réglage d'accessibilité de réduction des mouvements. */
        component.reducedMotion.addEventListener('change', () => syncComponent(component));
    }

    /* Programme un seul recalcul au prochain rafraîchissement d'image. */
    function scheduleSync(component) {
        /* Ignore les demandes multiples qui arrivent avant le prochain frame. */
        if (component.rafId) return;

        /* Demande au navigateur de regrouper les mesures DOM au moment optimal. */
        component.rafId = requestAnimationFrame(() => {
            /* Réinitialise l'identifiant pour autoriser le prochain cycle. */
            component.rafId = 0;
            /* Recalcule l'état réel de la zone. */
            syncComponent(component);
        });
    }

    /* Met à jour les gradients et la navigation en fonction de l'espace réellement disponible. */
    function syncComponent(component) {
        /* Détermine si le composant doit se comporter comme une grille desktop. */
        const isDesktop = DESKTOP_QUERY.matches;
        /* Mesure si une zone horizontale débordante existe actuellement. */
        const isScrollable = !isDesktop && (component.viewport.scrollWidth - component.viewport.clientWidth > SCROLL_EPSILON);
        /* Détermine si le bord gauche possède encore du contenu précédent. */
        const hasPrevious = isScrollable && component.viewport.scrollLeft > SCROLL_EPSILON;
        /* Détermine si le bord droit possède encore du contenu suivant. */
        const hasNext = isScrollable && (component.viewport.scrollLeft + component.viewport.clientWidth < component.viewport.scrollWidth - SCROLL_EPSILON);

        /* Ajoute ou retire la classe de débordement pour aligner correctement les cartes et afficher les gradients. */
        component.root.classList.toggle('is-scrollable', isScrollable);
        /* Indique visuellement qu'il existe une position précédente accessible. */
        component.root.classList.toggle('has-prev', hasPrevious);
        /* Indique visuellement qu'il existe encore du contenu à droite. */
        component.root.classList.toggle('has-next', hasNext);

        /* Le carousel e-shop possède une navigation à points ; le slider Prestations n'en possède pas. */
        if (component.dots) {
            /* Cache la navigation lorsqu'il n'y a rien à faire défiler. */
            component.dots.hidden = !isScrollable;
            /* Met à jour le nombre de points et le point actif lorsque le carousel est scrollable. */
            if (isScrollable) syncDots(component);
        }
    }

    /* Crée les boutons de navigation e-shop uniquement avec les API DOM natives. */
    function syncDots(component) {
        /* Vérifie si le nombre de boutons existants correspond au nombre de cartes. */
        if (component.dots.children.length !== component.cards.length) {
            /* Vide les anciens boutons sans injecter de HTML interprétable. */
            component.dots.replaceChildren();

            /* Crée un bouton pour chaque carte. */
            component.cards.forEach((card, index) => {
                /* Crée un élément bouton natif. */
                const button = document.createElement('button');
                /* Empêche le bouton de soumettre un éventuel formulaire parent. */
                button.type = 'button';
                /* Fournit un nom explicite aux lecteurs d'écran. */
                button.setAttribute('aria-label', `Afficher le produit ${index + 1}`);
                /* Lie le bouton au viewport pour donner un contexte aux technologies d'assistance. */
                button.setAttribute('aria-controls', component.viewport.id || 'shop-viewport');
                /* Place l'index de la carte dans une propriété JavaScript privée au bouton. */
                button.dataset.index = String(index);
                /* Permet un clic clavier et souris identique. */
                button.addEventListener('click', () => scrollToCard(component, index));
                /* Ajoute le bouton construit dans la navigation. */
                component.dots.append(button);
            });
        }

        /* Calcule la carte qui est la plus proche du bord gauche visible. */
        const activeIndex = getClosestCardIndex(component);

        /* Met à jour l'état actif de chaque bouton. */
        [...component.dots.children].forEach((button, index) => {
            /* Vérifie si ce bouton correspond à la carte actuellement visible en tête. */
            const isActive = index === activeIndex;
            /* Ajoute la classe CSS qui transforme le point en barre. */
            button.classList.toggle('is-active', isActive);
            /* Expose également cet état au lecteur d'écran. */
            button.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
    }

    /* Défile proprement jusqu'à une carte précise. */
    function scrollToCard(component, index) {
        /* Récupère la carte ciblée en évitant tout index hors tableau. */
        const card = component.cards[index];
        /* Interrompt proprement l'action si la carte n'existe plus. */
        if (!card) return;

        /* Respecte la préférence système de réduction des mouvements. */
        card.scrollIntoView({
            /* Anime le déplacement lorsque les animations sont autorisées. */
            behavior: component.reducedMotion.matches ? 'auto' : 'smooth',
            /* Aligne la carte sur le début de la zone de scroll horizontale. */
            inline: 'start',
            /* Évite de provoquer un défilement vertical inutile de la page. */
            block: 'nearest',
        });
    }

    /* Retourne l'index de la carte dont le bord gauche est le plus proche du début du viewport. */
    function getClosestCardIndex(component) {
        /* Récupère le rectangle du viewport pour disposer d'un repère visuel fiable. */
        const viewportRect = component.viewport.getBoundingClientRect();
        /* Initialise le meilleur candidat à la première carte. */
        let closestIndex = 0;
        /* Initialise la distance minimale à une valeur très élevée. */
        let closestDistance = Number.POSITIVE_INFINITY;

        /* Compare la position de chaque carte avec le bord gauche visible. */
        component.cards.forEach((card, index) => {
            /* Mesure la position réelle de la carte dans le viewport. */
            const cardRect = card.getBoundingClientRect();
            /* Calcule la distance horizontale entre la carte et le bord gauche. */
            const distance = Math.abs(cardRect.left - viewportRect.left);

            /* Conserve la carte la plus proche de la position de scroll courante. */
            if (distance < closestDistance) {
                /* Mémorise la nouvelle distance minimale. */
                closestDistance = distance;
                /* Mémorise l'index correspondant. */
                closestIndex = index;
            }
        });

        /* Retourne l'index utilisé pour activer le bon point. */
        return closestIndex;
    }
})();
