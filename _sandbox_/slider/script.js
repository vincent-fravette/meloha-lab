document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('scrollContainer');
    const dotsContainer = document.getElementById('dotsIndicators');
    const cards = container.querySelectorAll('.card');

    if (cards.length === 0) return;

    // 1. GÉNÉRATION AUTOMATIQUE DES POINTS (INDICATEURS)
    cards.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active'); // Premier point actif par défaut
        dot.setAttribute('data-target', index);
        dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.dot');

    // Applique le focus initial à la première carte
    if (window.innerWidth < 1024) cards[0].classList.add('focused');

    // 2. DÉFILEMENT ACTIONNÉ AU CLIC SUR UN POINT
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            const targetIndex = parseInt(e.target.getAttribute('data-target'));
            const targetCard = cards[targetIndex];

            if (targetCard) {
                // Aligne la carte au centre exact du conteneur visible
                /*const containerCenter = container.offsetWidth / 2;
                const cardCenter = targetCard.offsetLeft + (targetCard.offsetWidth / 2);
                const scrollPosition = cardCenter - containerCenter;*/
                const containerRect = container.getBoundingClientRect();
                const cardRect = targetCard.getBoundingClientRect()

                // Calcule la position exacte pour amener la carte au centre du conteneur
                const scrollPosition = container.scrollLeft + (cardRect.left - containerRect.left) - (containerRect.width / 2) + (cardRect.width / 2);

                container.scrollTo({
                    left: scrollPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. MISE À JOUR DYNAMIQUE DU POINT ACTIF AU SCROLL + EFFET FOCUS SUR LA CARTE
    container.addEventListener('scroll', () => {
        // Sécurité : pas d'effet si on est sur Desktop
        if (window.innerWidth >= 1024) return;

        let closestIndex = 0;
        let minDistance = Infinity;
        /*const containerCenter = container.scrollLeft + (container.offsetWidth / 2);*/
        const containerRect = container.getBoundingClientRect();
        const containerCenter= containerRect.left + (containerRect.width / 2)

        // Repère la carte la plus proche du centre horizontal de l'écran
        cards.forEach((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.offsetLeft + (cardRect.width / 2);
            const distance = Math.abs(containerCenter - cardCenter);

            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        // Applique le style actif sur le point correspondant
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === closestIndex);
        });

        // Synchronisation de l'effet visuel sur la carte au centre
        cards.forEach((card, i) => {
            card.classList.toggle('focused', i === closestIndex);
        });
    });
});

/*
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('scrollContainer');
    const dotsContainer = document.getElementById('dotsIndicators');
    const cards = container.querySelectorAll('.card');

    if (cards.length === 0) return;

    // 1. Génération des indicateurs
    cards.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.setAttribute('data-target', index);
        dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.dot');

    // Applique le focus initial à la première carte
    if (window.innerWidth < 1024) cards[0].classList.add('focused');

    // 2. Clic sur une barre pour naviguer
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            const targetIndex = parseInt(e.target.getAttribute('data-target'));
            const targetCard = cards[targetIndex];

            if (targetCard) {
                const containerCenter = container.offsetWidth / 2;
                const cardCenter = targetCard.offsetLeft + (targetCard.offsetWidth / 2);
                const scrollPosition = cardCenter - containerCenter;

                container.scrollTo({
                    left: scrollPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Gestion du Scroll : Point actif + Effet Focus sur la carte
    container.addEventListener('scroll', () => {
        // Sécurité : pas d'effet si on est sur Desktop
        if (window.innerWidth >= 1024) return;

        let closestIndex = 0;
        let minDistance = Infinity;
        const containerCenter = container.scrollLeft + (container.offsetWidth / 2);

        cards.forEach((card, index) => {
            const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
            const distance = Math.abs(containerCenter - cardCenter);

            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        // Synchronisation de la barre active
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === closestIndex);
        });

        // Synchronisation de l'effet visuel sur la carte au centre
        cards.forEach((card, i) => {
            card.classList.toggle('focused', i === closestIndex);
        });
    });
});
*/