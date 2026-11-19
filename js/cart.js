'use strict';

class MiniCart {
    static STORAGE_KEY = 'shop_cart';

    constructor(root, toggleBtn) {
        this.root = root;
        this.toggleBtn = toggleBtn;
        this.closeBtn = root.querySelector('.mini-cart__close');
        this.overlay = root.querySelector('.mini-cart__overlay');
        this.counter = toggleBtn.querySelector('.cart-toggle__count');

        this.countText = root.querySelector('.mini-cart__count-text');
        this.list = root.querySelector('.mini-cart__list');
        this.emptyState = root.querySelector('.mini-cart__empty');
        this.footer = root.querySelector('.mini-cart__footer');
        this.total = root.querySelector('.mini-cart__total');
        this.itemTemplate = document.querySelector('#mini-cart-item-template');

        this.cart = null;
        this.lastRequestId = 0;
    }

    init() {
        this.bindEvents();
        this.syncCart();
    }

    bindEvents() {
        this.toggleBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());
        this.list.addEventListener('click', (event) => this.handleListClick(event));
        document.addEventListener('keydown', (event) => this.handleKeydown(event));
        document.addEventListener('submit', (event) => this.handleSubmit(event));
        window.addEventListener('storage', (event) => this.handleStorageChange(event));
    }

    // ---------- open / close ----------

    isOpen() {
        return !this.root.hidden;
    }

    open() {
        this.setVisibility(true);
        this.closeBtn.focus();
        this.syncCart();
    }

    close() {
        this.setVisibility(false);
        this.toggleBtn.focus();
    }

    setVisibility(visible) {
        this.root.hidden = !visible;
        this.toggleBtn.setAttribute('aria-expanded', String(visible));
        document.body.classList.toggle('has-open-cart', visible);
    }

    handleKeydown(event) {
        if (event.key === 'Escape' && this.isOpen()) {
            this.close();
        }
    }

    // ---------- Add to cart ----------

    handleSubmit(event) {
        const form = event.target;

        if (!form.matches('.add-to-cart')) {
            return;
        }

        event.preventDefault();
        this.addToCart(form);
    }

    async addToCart(form) {
        const {productId, qty} = this.readForm(form);
        const button = form.querySelector('[type="submit"]');

        button.disabled = true;

        try {
            const cart = await this.request(() => ShopApi.addToCart(productId, qty));
            this.notifyAdded(cart, productId);
        } catch (error) {
            this.handleError(error);
        } finally {
            button.disabled = false;
        }
    }

    readForm(form) {
        const data = new FormData(form);

        return {
            productId: Number(data.get('product_id')),
            qty: Number(data.get('qty')),
        };
    }

    // ---------- Change qty / remove ----------

    handleListClick(event) {
        const button = event.target.closest('[data-action]');

        if (!button || this.isBusy()) {
            return;
        }

        const item = button.closest('.mini-cart__item');
        const productId = Number(item.dataset.productId);
        const qty = Number(item.dataset.qty);

        switch (button.dataset.action) {
            case 'increase':
                this.changeQty(productId, qty + 1);
                break;
            case 'decrease':
                this.changeQty(productId, qty - 1);
                break;
            case 'remove':
                this.removeItem(productId);
                break;
        }
    }

    changeQty(productId, qty) {
        if (qty < 1) {
            return;
        }

        this.mutate(() => ShopApi.updateQty(productId, qty));
    }

    removeItem(productId) {
        this.mutate(() => ShopApi.removeFromCart(productId));
    }

    async mutate(apiCall) {
        try {
            await this.request(apiCall);
        } catch (error) {
            this.handleError(error);
        }
    }

    // ---------- Connection with API ----------

    async request(apiCall) {
        const requestId = ++this.lastRequestId;
        this.setLoading(true);

        try {
            const cart = await apiCall();
            this.applyCart(cart, requestId);
            return cart;
        } finally {
            if (requestId === this.lastRequestId) {
                this.setLoading(false);
            }
        }
    }

    async syncCart() {
        try {
            await this.request(() => ShopApi.getCart());
        } catch {
            if (!this.cart) {
                this.renderLoadError();
            }
        }
    }

    applyCart(cart, requestId) {
        if (requestId !== this.lastRequestId) {
            return;
        }

        this.cart = cart;
        this.updateCounter(cart.totalQty);
        this.render(cart);
    }

    handleError(error) {
        this.notifyError(error);
        this.syncCart();
    }

    setLoading(loading) {
        this.toggleBtn.classList.toggle('is-loading', loading);
        this.root.classList.toggle('is-loading', loading);
        this.list.setAttribute('aria-busy', String(loading));
    }

    isBusy() {
        return this.root.classList.contains('is-loading');
    }

    updateCounter(totalQty) {
        this.counter.textContent = totalQty;
    }

    render(cart) {
        const focus = this.saveFocus();
        const isEmpty = cart.items.length === 0;

        this.countText.textContent = MiniCart.formatCount(cart.totalQty);
        this.countText.hidden = isEmpty;
        this.list.hidden = isEmpty;
        this.emptyState.hidden = !isEmpty;
        this.footer.hidden = isEmpty;
        this.total.textContent = Shop.formatPrice(cart.total);

        this.list.replaceChildren(...cart.items.map((item) => this.createItem(item)));
        this.restoreFocus(focus);
    }

    createItem(item) {
        const li = this.itemTemplate.content.firstElementChild.cloneNode(true);

        li.dataset.productId = item.productId;
        li.dataset.qty = item.qty;

        li.querySelector('.mini-cart__name').textContent = item.name;
        li.querySelector('.mini-cart__price').textContent = Shop.formatPrice(item.lineTotal);
        li.querySelector('.mini-cart__qty-value').textContent = item.qty;

        const decrease = li.querySelector('[data-action="decrease"]');
        const increase = li.querySelector('[data-action="increase"]');
        const remove = li.querySelector('[data-action="remove"]');

        decrease.disabled = item.qty <= 1;
        decrease.setAttribute('aria-label', `Zmniejsz ilość: ${item.name}`);
        increase.setAttribute('aria-label', `Zwiększ ilość: ${item.name}`);
        remove.setAttribute('aria-label', `Usuń z koszyka: ${item.name}`);

        return li;
    }

    renderLoadError() {
        this.countText.textContent = 'Nie udało się wczytać koszyka. Zamknij go i otwórz ponownie, aby spróbować jeszcze raz.';
        this.countText.hidden = false;
        this.list.hidden = true;
        this.emptyState.hidden = true;
        this.footer.hidden = true;
        this.counter.textContent = '–';
    }

    saveFocus() {
        const button = document.activeElement?.closest('.mini-cart__list [data-action]');

        if (!button) {
            return null;
        }

        return {
            productId: button.closest('.mini-cart__item').dataset.productId,
            action: button.dataset.action,
        };
    }

    restoreFocus(focus) {
        if (!focus) {
            return;
        }

        const item = this.list.querySelector(`[data-product-id="${focus.productId}"]`);
        const target =
            item?.querySelector(`[data-action="${focus.action}"]:not(:disabled)`) ??
            item?.querySelector('[data-action]:not(:disabled)') ??
            this.closeBtn;

        target.focus();
    }

    // ---------- Synchronization between cards ----------

    handleStorageChange(event) {
        const isCartChange = event.key === MiniCart.STORAGE_KEY || event.key === null;

        if (isCartChange) {
            void this.syncCart();
        }
    }

    // ---------- Notify ----------

    notifyAdded(cart, productId) {
        const item = cart.items.find((cartItem) => cartItem.productId === productId);
        const name = item ? MiniCart.escapeHtml(item.name) : 'Produkt';

        Shop.notify(`${name} – dodano do koszyka.`);
    }

    notifyError(error) {
        Shop.notify(this.getErrorMessage(error), 'error');
    }

    getErrorMessage(error) {
        switch (error.code) {
            case 'OUT_OF_STOCK':
                return error.available > 0
                    ? `Na stanie jest tylko ${error.available} szt. tego produktu.`
                    : 'Ten produkt jest chwilowo niedostępny.';
            case 'NOT_IN_CART':
                return 'Tego produktu nie ma już w koszyku.';
            case 'NETWORK_ERROR':
                return 'Brak połączenia z serwerem. Sprawdź zawartość koszyka i spróbuj ponownie.';
            default:
                return 'Nie udało się zaktualizować koszyka. Spróbuj ponownie.';
        }
    }

    // ---------- Helper ----------

    static formatCount(count) {
        const forms = {one: 'produkt', few: 'produkty', many: 'produktów', other: 'produktu'};
        const form = new Intl.PluralRules('pl-PL').select(count);

        return `${count} ${forms[form]}`;
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

{
    const root = document.querySelector('#mini-cart');
    const toggleBtn = document.querySelector('.cart-toggle');

    if (root && toggleBtn) {
        new MiniCart(root, toggleBtn).init();
    }
}