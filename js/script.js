/** HEADER **/
/*const header = document.getElementById('header');

window.addEventListener('scroll', () => {

    header.classList.toggle('scrolled', window.scrollY > 10);
    
});*/

/** COLLAPSE **/
/*const heading = document.querySelectorAll('section .heading');

heading.forEach(heading => {
    heading.addEventListener('click', () => {
        const section = heading.closest('section');
        section.classList.toggle('active');
    });
});*/

/** MENU BURGER **/
document.addEventListener('DOMContentLoaded', function() {
    
    const header = document.getElementById('header');
    const logo = document.querySelector('.header-logo');
    const burgerWrapper = document.querySelector('.wrapper-burger');
    const hamburgerMenu = document.querySelector('.hamburger');
    const overlay = document.querySelector('.overlay-menu');
    const menuLinks = document.querySelectorAll('.overlay-menu a');
    const heading = document.querySelectorAll('section .heading');

    /** HEADER **/
    window.addEventListener('scroll', () => {

        header.classList.toggle('scrolled', window.scrollY > 10);
        
    });

    /** MENU BURGER **/
    function toggleMenu() {
        const isOpen = burgerWrapper.classList.contains('animate');
        logo.classList.toggle('menu-open');
        burgerWrapper.classList.toggle('animate');
        hamburgerMenu.classList.toggle('animate');
        overlay.classList.toggle('menu-open');
        burgerWrapper.setAttribute('aria-expanded', String(!isOpen));
        burgerWrapper.setAttribute('aria-label', isOpen ? "Ouvrir Menu Hamburger" : "Fermer Menu Hamburger");
        overlay.setAttribute('aria-hidden', String(isOpen));
    }
    function closeMenu() {
        logo.classList.remove('menu-open');
        burgerWrapper.classList.remove('animate');
        hamburgerMenu.classList.remove('animate');
        overlay.classList.remove('menu-open');
        burgerWrapper.setAttribute('aria-expanded', 'false');
    }
    function escapeKey(event) {
        if (event.key === 'Escape' && burgerWrapper.classList.contains('animate')) {
            closeMenu();
        }
    }
    burgerWrapper.addEventListener('click', toggleMenu);
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', escapeKey);

    /** COLLAPSE **/
    heading.forEach(heading => {
        heading.addEventListener('click', () => {
            const section = heading.closest('section');
            section.classList.toggle('active');
        });
    });

    // Fonction d'initialisation pour chaque accordéon
    function initAccordion(accordion) {
        const panels = accordion.querySelectorAll('.panel');

        panels.forEach(function (panel) {
            const heading = panel.querySelector('.panel-heading');
            const link = heading ? heading.querySelector('a') : null;
            const collapse = panel.querySelector('.panel-collapse');

            if (!heading || !link || !collapse) return;

            // État initial : ouvert si la classe "in" est présente
            const isOpen = collapse.classList.contains('in');
            collapse.style.display = isOpen ? 'block' : 'none';
            heading.classList.toggle('active', isOpen);
            link.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

            // Gestion du clic
            link.addEventListener('click', function (e) {
                e.preventDefault();

                const currentlyOpen = collapse.style.display === 'block';

                if (currentlyOpen) {
                    // Fermeture
                    collapse.style.display = 'none';
                    collapse.classList.remove('in');
                    heading.classList.remove('active');
                    link.setAttribute('aria-expanded', 'false');
                } else {
                    // Ouverture
                    collapse.style.display = 'block';
                    collapse.classList.add('in');
                    heading.classList.add('active');
                    link.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    // Appliquer à tous les accordéons présents
    document.querySelectorAll('#accordion, #bs-collapse').forEach(initAccordion);

});
