(function () {
  'use strict';

  var STORAGE_KEY = 'shop_cart';

  var PRODUCTS = {
    101: { name: 'Kubek ceramiczny „Poranek”', price: 3999, stock: 25 },
    102: { name: 'Koszulka bawełniana Basic', price: 4999, stock: 12 },
    103: { name: 'Torba Shopper Eko', price: 2450, stock: 2 },
    104: { name: 'Plakat w ramie <Premium> 50×70', price: 12900, stock: 8 },
    105: { name: 'Świeca sojowa Lawenda', price: 3490, stock: 0 },
    106: { name: 'Notes w kropki A5', price: 1999, stock: 40 }
  };

  var config = {
    minDelay: 300,
    maxDelay: 1800,
    errorRate: 0.1
  };

  (function applyUrlConfig() {
    var params = new URLSearchParams(window.location.search);
    Object.keys(config).forEach(function (key) {
      var value = params.get(key);
      if (value !== null && value.trim() !== '' && !isNaN(Number(value))) {
        config[key] = Number(value);
      }
    });
  })();

  var memoryStore = null;

  function readState() {
    var raw = memoryStore;
    if (raw === null) {
      try {
        raw = window.localStorage.getItem(STORAGE_KEY);
      } catch (e) {}
    }
    try {
      var data = raw ? JSON.parse(raw) : null;
      if (data && Array.isArray(data.items)) {
        return {
          items: data.items.filter(function (item) {
            return item && Object.prototype.hasOwnProperty.call(PRODUCTS, item.productId) &&
              Number.isInteger(item.qty) && item.qty > 0;
          })
        };
      }
    } catch (e) {}
    return { items: [] };
  }

  function writeState(state) {
    var raw = JSON.stringify(state);
    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
    } catch (e) {
      memoryStore = raw;
    }
  }

  function apiError(code, message, details) {
    var error = new Error(message);
    error.name = 'ApiError';
    error.code = code;
    if (details) {
      Object.keys(details).forEach(function (key) {
        error[key] = details[key];
      });
    }
    return error;
  }

  function normalizeProductId(productId) {
    var id = Number(productId);
    if (!Number.isInteger(id) || !Object.prototype.hasOwnProperty.call(PRODUCTS, id)) {
      throw apiError('PRODUCT_NOT_FOUND', 'Produkt nie istnieje.');
    }
    return id;
  }

  function normalizeQty(qty) {
    var value = typeof qty === 'string' && qty.trim() === '' ? NaN : Number(qty);
    if (!Number.isInteger(value) || value < 1) {
      throw apiError('INVALID_QUANTITY', 'Ilość musi być liczbą całkowitą większą od zera.');
    }
    return value;
  }

  function assertStock(id, qty) {
    var stock = PRODUCTS[id].stock;
    if (qty > stock) {
      throw apiError('OUT_OF_STOCK', 'Niewystarczający stan magazynowy.', { available: stock });
    }
  }

  function findItem(state, id) {
    for (var i = 0; i < state.items.length; i++) {
      if (state.items[i].productId === id) {
        return state.items[i];
      }
    }
    return null;
  }

  function snapshot(state) {
    var totalQty = 0;
    var total = 0;
    var items = state.items.map(function (item) {
      var product = PRODUCTS[item.productId];
      var lineTotal = product.price * item.qty;
      totalQty += item.qty;
      total += lineTotal;
      return {
        productId: item.productId,
        name: product.name,
        unitPrice: product.price,
        qty: item.qty,
        lineTotal: lineTotal
      };
    });
    return { items: items, totalQty: totalQty, total: total };
  }

  function legDelay() {
    var min = Math.max(0, Number(config.minDelay) || 0);
    var max = Math.max(min, Number(config.maxDelay) || 0);
    return (min + Math.random() * (max - min)) / 2;
  }

  function connectionLost() {
    var rate = Math.min(1, Math.max(0, Number(config.errorRate) || 0));
    var perLeg = 1 - Math.sqrt(1 - rate);
    return Math.random() < perLeg;
  }

  function networkError() {
    return apiError('NETWORK_ERROR', 'Brak połączenia z serwerem.');
  }

  function request(handler) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (connectionLost()) {
          reject(networkError());
          return;
        }

        var outcome;
        try {
          outcome = { ok: true, value: handler() };
        } catch (error) {
          outcome = { ok: false, error: error };
        }

        setTimeout(function () {
          if (connectionLost()) {
            reject(networkError());
            return;
          }
          if (outcome.ok) {
            resolve(outcome.value);
          } else {
            reject(outcome.error);
          }
        }, legDelay());
      }, legDelay());
    });
  }

  function getCart() {
    return request(function () {
      return snapshot(readState());
    });
  }

  function addToCart(productId, qty) {
    return request(function () {
      var id = normalizeProductId(productId);
      var amount = normalizeQty(qty);
      var state = readState();
      var item = findItem(state, id);
      var newQty = (item ? item.qty : 0) + amount;
      assertStock(id, newQty);
      if (item) {
        item.qty = newQty;
      } else {
        state.items.push({ productId: id, qty: newQty });
      }
      writeState(state);
      return snapshot(state);
    });
  }

  function updateQty(productId, qty) {
    return request(function () {
      var id = normalizeProductId(productId);
      var amount = normalizeQty(qty);
      var state = readState();
      var item = findItem(state, id);
      if (!item) {
        throw apiError('NOT_IN_CART', 'Produktu nie ma w koszyku.');
      }
      assertStock(id, amount);
      item.qty = amount;
      writeState(state);
      return snapshot(state);
    });
  }

  function removeFromCart(productId) {
    return request(function () {
      var id = normalizeProductId(productId);
      var state = readState();
      state.items = state.items.filter(function (item) {
        return item.productId !== id;
      });
      writeState(state);
      return snapshot(state);
    });
  }

  window.ShopApi = {
    config: config,
    getCart: getCart,
    addToCart: addToCart,
    updateQty: updateQty,
    removeFromCart: removeFromCart
  };
})();
