const container = document.getElementById('scrollContainer');
const dots = document.querySelectorAll('.dot');
const cards = document.querySelectorAll('.card');

// 1. DÉFILEMENT DIRECT AU CLIC SUR UN POINT
dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
        const targetIndex = parseInt(e.target.getAttribute('data-target'));
        const targetCard = cards[targetIndex];

        if (targetCard) {
            // Calcule le décalage pour aligner parfaitement la carte au centre
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

// 2. MISE À JOUR ACTIVE DES POINTS AU SCROLL (MOBILE)
container.addEventListener('scroll', () => {
    let closestIndex = 0;
    let minDistance = Infinity;
    const containerCenter = container.scrollLeft + (container.offsetWidth / 2);

    // Trouve quelle carte est la plus proche du centre de l'écran
    cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
        const distance = Math.abs(containerCenter - cardCenter);

        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
        }
    });

    // Met à jour la classe CSS active
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === closestIndex);
    });
});

/*
container.addEventListener('scroll', () => {
    // Calcule l'index de la carte actuellement au centre de l'écran
    const containerWidth = container.offsetWidth;
    const scrollLeft = container.scrollLeft;
    // Trouve l'index le plus proche en fonction du défilement
    const index = Math.round(scrollLeft / (container.scrollWidth / dots.length));
    // Met à jour la classe active sur les points
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
});
*/