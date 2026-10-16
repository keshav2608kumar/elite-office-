'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const successMsg = document.getElementById('contact-success');
  const errorMsg = document.getElementById('contact-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous messages
    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';

    // Basic client-side validation
    const name = form.querySelector('#contact-name');
    const email = form.querySelector('#contact-email');
    const phone = form.querySelector('#contact-phone');
    const subject = form.querySelector('#contact-subject');
    const message = form.querySelector('#contact-message');

    const fields = [
      { el: name, label: 'Name', min: 2, max: 100 },
      { el: email, label: 'Email', min: 5, max: 200 },
      { el: subject, label: 'Subject', min: 5, max: 200 },
      { el: message, label: 'Message', min: 10, max: 2000 }
    ];

    // Remove previous error styles
    form.querySelectorAll('.form-input--error').forEach(el => el.classList.remove('form-input--error'));
    form.querySelectorAll('.form-error').forEach(el => el.remove());

    let hasError = false;
    for (const field of fields) {
      if (!field.el) continue;
      const val = field.el.value.trim();
      if (!val || val.length < field.min) {
        field.el.classList.add('form-input--error');
        const errEl = document.createElement('span');
        errEl.className = 'form-error';
        errEl.textContent = `${field.label} must be at least ${field.min} characters.`;
        field.el.parentNode.appendChild(errEl);
        hasError = true;
      } else if (val.length > field.max) {
        field.el.classList.add('form-input--error');
        const errEl = document.createElement('span');
        errEl.className = 'form-error';
        errEl.textContent = `${field.label} must be at most ${field.max} characters.`;
        field.el.parentNode.appendChild(errEl);
        hasError = true;
      }
    }

    // Email format check
    if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      email.classList.add('form-input--error');
      const errEl = document.createElement('span');
      errEl.className = 'form-error';
      errEl.textContent = 'Please enter a valid email address.';
      email.parentNode.appendChild(errEl);
      hasError = true;
    }

    if (hasError) return;

    // Disable button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    try {
      const API_BASE = window.CONFIG?.API_BASE || '/api';
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          phone: phone ? phone.value.trim() : '',
          subject: subject.value.trim(),
          message: message.value.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        form.reset();
        if (successMsg) {
          successMsg.style.display = 'block';
          successMsg.textContent = 'Thank you for your enquiry! We will get back to you shortly.';
        }
        if (window.showToast) {
          window.showToast('Enquiry submitted successfully!', 'success');
        }
      } else {
        const msg = data.error || data.message || 'Failed to submit enquiry. Please try again.';
        if (errorMsg) {
          errorMsg.style.display = 'block';
          errorMsg.textContent = msg;
        }
        if (window.showToast) {
          window.showToast(msg, 'error');
        }
      }
    } catch (err) {
      const msg = 'Network error. Please check your connection and try again.';
      if (errorMsg) {
        errorMsg.style.display = 'block';
        errorMsg.textContent = msg;
      }
      if (window.showToast) {
        window.showToast(msg, 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    }
  });
});
