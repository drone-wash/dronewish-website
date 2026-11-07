// Lead form: sends to /api/lead (Netlify Function). Success is shown only after the server confirms.
(function () {
  // Hide the floating contact bar while the contact section is on screen or a field is focused,
  // so it never covers the form or its submit button (especially with the mobile keyboard open).
  var bar = document.querySelector('.quick-contact');
  var contact = document.getElementById('contact');
  if (bar && contact) {
    var inView = false, focused = false;
    var update = function () { bar.classList.toggle('is-hidden', inView || focused); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        update();
      }).observe(contact);
    }
    contact.addEventListener('focusin', function () { focused = true; update(); });
    contact.addEventListener('focusout', function () { focused = false; update(); });
  }

  var form = document.getElementById('lead-form');
  if (!form) return;
  var box = document.getElementById('result');
  var button = form.querySelector('button[type="submit"]');
  var sending = false;
  var PHONE = '054-770-8361';
  var TEL = 'tel:+972547708361';
  var WA = 'https://wa.me/972547708361';

  function show(kind, html) {
    box.hidden = false;
    box.className = 'result wide' + (kind === 'error' ? ' error' : '');
    box.innerHTML = html;
  }

  function utm() {
    var p = new URLSearchParams(location.search);
    var out = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) {
      if (p.get(k)) out[k] = p.get(k).slice(0, 120);
    });
    return out;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    sending = true;
    button.disabled = true;
    var label = button.textContent;
    button.textContent = 'שולחים…';
    box.hidden = true;

    var data = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      address: form.elements.address.value.trim(),
      website: form.elements.website.value,
      source: form.dataset.source || 'unknown',
      page: location.pathname,
      referrer: document.referrer.slice(0, 300),
      utm: utm()
    };

    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok || !body.ok) throw body;
        });
      })
      .then(function () {
        form.reset();
        show('ok', 'תודה! הפרטים התקבלו ונחזור אליכם בהקדם.');
      })
      .catch(function (err) {
        var msg = (err && err.error) || 'הפרטים לא נשלחו.';
        show('error', msg + ' הפרטים שהקלדתם נשמרו בטופס — אפשר לנסות שוב, או להתקשר ל־<a href="' + TEL + '" dir="ltr">' + PHONE + '</a> או לכתוב ב־<a href="' + WA + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>.');
      })
      .finally(function () {
        sending = false;
        button.disabled = false;
        button.textContent = label;
      });
  });
})();
