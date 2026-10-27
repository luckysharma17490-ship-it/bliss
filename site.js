const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
	menuToggle.addEventListener('click', () => {
		const isOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
		menuToggle.setAttribute('aria-expanded', String(isOpen));
		menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
		navLinks.classList.toggle('open', isOpen);
	});
	navLinks.addEventListener('click', (event) => {
		if (event.target instanceof HTMLAnchorElement) {
			menuToggle.setAttribute('aria-expanded', 'false');
			menuToggle.setAttribute('aria-label', 'Open navigation');
			navLinks.classList.remove('open');
		}
	});
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
	const revealObserver = new IntersectionObserver((entries, observer) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			entry.target.classList.add('is-visible');
			observer.unobserve(entry.target);
		});
	}, { threshold: 0.1 });
	revealItems.forEach((item) => revealObserver.observe(item));
} else {
	revealItems.forEach((item) => item.classList.add('is-visible'));
}

const contactForm = document.querySelector('#contact-form');
if (contactForm) {
	contactForm.addEventListener('submit', (event) => {
		event.preventDefault();
		const details = new FormData(contactForm);
		const subject = `Hello Bliss — ${details.get('name')}`;
		const body = `${details.get('message')}\n\nFrom: ${details.get('name')}\nReply to: ${details.get('email')}`;
		window.location.href = `mailto:blisschocolate01@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	});
}
