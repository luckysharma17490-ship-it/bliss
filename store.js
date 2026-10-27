const allProducts = collections.flatMap((collection) => collection.items);
const productControls = new Map();
const cart = [];
const productImage = (filename) => `optimized/${filename.replace(/\.(png|jpe?g)$/i, '.jpg')}`;
const cartPanel = document.querySelector('#cart-panel');
const cartButton = document.querySelector('#cart-button');
const cartCount = document.querySelector('#cart-count');
const panelCartCount = document.querySelector('#panel-cart-count');
const cartList = document.querySelector('#cart-list');
const cartStatus = document.querySelector('#cart-status');
const cartSubtotal = document.querySelector('#cart-subtotal');
const checkoutForm = document.querySelector('#checkout-form');
const catalog = document.querySelector('#catalog-content');
const modal = document.querySelector('#product-modal');
const whatsappNumber = '918209408477';
let selectedProduct = null;
let previousFocus = null;

function readSavedCart() {
	try {
		const saved = JSON.parse(localStorage.getItem('bliss-cart') || '[]');
		if (!Array.isArray(saved)) throw new TypeError('The saved bag is not a list.');
		saved.forEach((entry) => {
			const item = allProducts.find((product) => product[0] === entry.name);
			if (item && Number.isInteger(entry.quantity) && entry.quantity > 0) cart.push({ item, quantity: entry.quantity });
		});
	} catch (error) {
		console.error('Could not restore the saved Bliss shopping bag.', error);
		cartStatus.textContent = 'Your previous bag could not be restored. Add your favourites again.';
	}
}

function saveCart() {
	try {
		localStorage.setItem('bliss-cart', JSON.stringify(cart.map(({ item, quantity }) => ({ name: item[0], quantity }))));
		cartStatus.textContent = 'Your bag is saved on this device.';
	} catch (error) {
		console.error('Could not save the Bliss shopping bag.', error);
		cartStatus.textContent = 'Your bag could not be saved on this device.';
	}
}

function buildCatalog() {
	const total = document.querySelector('#product-total');
	if (total) total.textContent = `${String(allProducts.length).padStart(2, '0')} GOOD THINGS`;
	collections.forEach((collection, collectionIndex) => {
		const section = document.createElement('section');
		section.className = 'category';
		section.id = collection.id;
		section.innerHTML = `<div class="category-heading"><span>${String(collectionIndex + 1).padStart(2, '0')} / ${collection.label}</span><h3>${collection.title}</h3><p>${collection.note}</p></div><div class="product-grid"></div>`;
		const grid = section.querySelector('.product-grid');
		collection.items.forEach((item, index) => {
			const card = document.createElement('article');
			card.className = 'product-card reveal';
			card.style.setProperty('--card-delay', `${(index % 4) * 50}ms`);
			card.innerHTML = `<button class="product-visual" type="button" aria-label="View details for ${item[0]}"><img src="${productImage(item[3])}" alt="${item[0]}" loading="lazy" decoding="async"><span class="visual-zoom" aria-hidden="true">↗</span></button><div class="product-info"><span class="product-tag">${collection.title}</span><h4>${item[0]}</h4><p>${item[1]}</p><div class="product-bottom"><strong class="price">${item[2]}</strong><div class="product-actions"><button class="details-button" type="button">Details</button><div class="product-quantity"></div></div></div></div>`;
			const quantityControl = card.querySelector('.product-quantity');
			productControls.set(item, quantityControl);
			card.querySelector('.product-visual').addEventListener('click', () => openProduct(item));
			card.querySelector('.details-button').addEventListener('click', () => openProduct(item));
			quantityControl.addEventListener('click', (event) => {
				if (event.target instanceof Element && event.target.closest('.add-button')) openCart();
			});
			grid.appendChild(card);
		});
		catalog.appendChild(section);
	});

	if ('IntersectionObserver' in window) {
		const observer = new IntersectionObserver((entries, currentObserver) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				entry.target.classList.add('is-visible');
				currentObserver.unobserve(entry.target);
			});
		}, { threshold: 0.08 });
		document.querySelectorAll('#catalog-content .reveal').forEach((card) => observer.observe(card));
	} else {
		document.querySelectorAll('#catalog-content .reveal').forEach((card) => card.classList.add('is-visible'));
	}
}

function openProduct(item) {
	selectedProduct = item;
	previousFocus = document.activeElement;
	const image = document.querySelector('#modal-image');
	image.src = productImage(item[3]);
	image.alt = item[0];
	document.querySelector('#modal-title').textContent = item[0];
	document.querySelector('#modal-description').textContent = item[1];
	document.querySelector('#modal-price').textContent = item[2];
	modal.classList.add('is-open');
	modal.setAttribute('aria-hidden', 'false');
	document.querySelector('#close-modal').focus();
}

function closeModal() {
	modal.classList.remove('is-open');
	modal.setAttribute('aria-hidden', 'true');
	if (previousFocus instanceof HTMLElement) previousFocus.focus();
	selectedProduct = null;
}

function changeQuantity(item, change) {
	const existing = cart.find((entry) => entry.item[0] === item[0]);
	if (existing) {
		existing.quantity += change;
		if (existing.quantity <= 0) cart.splice(cart.indexOf(existing), 1);
	} else if (change > 0) {
		cart.push({ item, quantity: change });
	}
	saveCart();
	renderCart();
}

function renderControls() {
	productControls.forEach((control, item) => {
		const entry = cart.find((cartItem) => cartItem.item[0] === item[0]);
		if (!entry) {
			control.innerHTML = '<button class="add-button" type="button"><span>＋</span> Add</button>';
			control.querySelector('.add-button').addEventListener('click', () => changeQuantity(item, 1));
			return;
		}
		control.innerHTML = `<div class="quantity-control"><button type="button" data-change="-1" aria-label="Remove one ${item[0]}">−</button><span aria-live="polite">${entry.quantity}</span><button type="button" data-change="1" aria-label="Add one ${item[0]}">＋</button></div>`;
		control.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => changeQuantity(item, Number(button.dataset.change))));
	});
}

function renderCart() {
	const totalCount = cart.reduce((sum, entry) => sum + entry.quantity, 0);
	const subtotal = cart.reduce((sum, entry) => sum + Number(entry.item[2].replace(/[^0-9]/g, '')) * entry.quantity, 0);
	cartCount.textContent = String(totalCount);
	panelCartCount.textContent = String(totalCount);
	cartSubtotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
	checkoutForm.hidden = !cart.length;
	renderControls();
	if (!cart.length) {
		cartList.innerHTML = '<p class="empty-cart">No chocolate yet. That can be fixed.</p>';
		return;
	}
	cartList.innerHTML = cart.map((entry, index) => `<div class="cart-item"><div><strong>${entry.item[0]}</strong><span>${entry.item[2]} · Qty ${entry.quantity}</span></div><div class="quantity-control"><button type="button" data-index="${index}" data-change="-1" aria-label="Remove one ${entry.item[0]}">−</button><span>${entry.quantity}</span><button type="button" data-index="${index}" data-change="1" aria-label="Add one ${entry.item[0]}">＋</button></div></div>`).join('');
	cartList.querySelectorAll('[data-index]').forEach((button) => button.addEventListener('click', () => {
		const item = cart[Number(button.dataset.index)].item;
		changeQuantity(item, Number(button.dataset.change));
	}));
}

function openCart() {
	previousFocus = document.activeElement;
	cartPanel.classList.add('is-open');
	cartPanel.setAttribute('aria-hidden', 'false');
	cartButton.setAttribute('aria-expanded', 'true');
	document.querySelector('#close-cart').focus();
}

function closeCart() {
	cartPanel.classList.remove('is-open');
	cartPanel.setAttribute('aria-hidden', 'true');
	cartButton.setAttribute('aria-expanded', 'false');
	if (previousFocus instanceof HTMLElement) previousFocus.focus();
}

document.querySelector('#close-modal').addEventListener('click', closeModal);
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
document.querySelector('#modal-add').addEventListener('click', () => {
	if (!selectedProduct) return;
	changeQuantity(selectedProduct, 1);
	closeModal();
	openCart();
});
cartButton.addEventListener('click', openCart);
document.querySelector('#close-cart').addEventListener('click', closeCart);
document.addEventListener('keydown', (event) => {
	if (event.key !== 'Escape') return;
	if (modal.classList.contains('is-open')) closeModal();
	if (cartPanel.classList.contains('is-open')) closeCart();
});

checkoutForm.addEventListener('submit', (event) => {
	event.preventDefault();
	if (!cart.length) return;
	const details = new FormData(checkoutForm);
	const lines = cart.map(({ item, quantity }) => `- ${item[0]} | ${item[2]} | Qty: ${quantity}`);
	const message = `Hello Bliss!\nI'd like to place an order:\n\n${lines.join('\n')}\n\nSubtotal: ${cartSubtotal.textContent}\n\nName: ${details.get('name')}\nMobile: ${details.get('phone')}\nDelivery address: ${details.get('address')}`;
	window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});

cartButton.addEventListener('click', renderCart);
buildCatalog();
readSavedCart();
renderCart();
