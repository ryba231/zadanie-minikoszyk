var Shop = window.Shop || {};

Shop.formatPrice = function (amount) {
  var parts = (amount / 100).toFixed(2).split('.');
  var whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return whole + ',' + parts[1] + ' PLN';
};

Shop.notify = function (html, type) {
  var container = document.getElementById('notices');
  var notice = document.createElement('div');
  notice.className = 'notice notice--' + (type || 'info');
  notice.innerHTML = html;
  container.appendChild(notice);

  setTimeout(function () {
    notice.className += ' notice--hide';
    setTimeout(function () {
      if (notice.parentNode) {
        notice.parentNode.removeChild(notice);
      }
    }, 400);
  }, 4000);
};

Shop.initMenu = function () {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');
  if (!toggle || !nav) {
    return;
  }
  toggle.onclick = function () {
    var open = nav.className.indexOf('is-open') === -1;
    nav.className = open ? nav.className + ' is-open' : nav.className.replace(' is-open', '');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
};

window.Shop = Shop;

document.addEventListener('DOMContentLoaded', function () {
  Shop.initMenu();
});
