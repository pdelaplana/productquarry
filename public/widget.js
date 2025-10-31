/**
 * ProductQuarry Feedback Widget
 * Version: 2.0.0
 *
 * Basic Usage:
 * <script src="https://your-domain.com/widget.js" data-board-slug="your-board-slug"></script>
 *
 * Customization Options:
 * - data-board-slug="your-slug"         (required) Your board's unique slug
 * - data-position="bottom-right"         (optional) Widget position: bottom-right, bottom-left, top-right, top-left
 * - data-theme="light"                   (optional) Theme: light or dark
 * - data-button-text="Feedback"          (optional) Custom button text
 * - data-primary-color="#2563eb"         (optional) Custom primary color (hex)
 * - data-auto-open="false"               (optional) Auto-open modal on page load
 * - data-auto-open-delay="0"             (optional) Delay in milliseconds before auto-opening
 *
 * Example with all options:
 * <script
 *   src="https://your-domain.com/widget.js"
 *   data-board-slug="my-product"
 *   data-position="bottom-left"
 *   data-theme="dark"
 *   data-button-text="Send Feedback"
 *   data-primary-color="#7c3aed"
 *   data-auto-open="true"
 *   data-auto-open-delay="3000">
 * </script>
 */

(() => {
  // Get configuration from script tag
  const script = document.currentScript || document.querySelector('script[data-board-slug]');
  const config = {
    boardSlug: script?.getAttribute('data-board-slug') || '',
    apiUrl: script?.getAttribute('data-api-url') || window.location.origin,
    position: script?.getAttribute('data-position') || 'bottom-right',
    theme: script?.getAttribute('data-theme') || 'light',
    buttonText: script?.getAttribute('data-button-text') || 'Feedback',
    primaryColor: script?.getAttribute('data-primary-color') || '#2563eb',
    autoOpen: script?.getAttribute('data-auto-open') === 'true',
    autoOpenDelay: parseInt(script?.getAttribute('data-auto-open-delay') || '0', 10),
  };

  if (!config.boardSlug) {
    console.error('ProductQuarry Widget: data-board-slug attribute is required');
    return;
  }

  // Apply custom primary color if specified
  if (config.primaryColor && config.primaryColor !== '#2563eb') {
    const style = document.createElement('style');
    style.textContent = `
      #pq-widget-trigger { background: ${config.primaryColor} !important; }
      #pq-widget-trigger:hover { filter: brightness(0.9); }
      .pq-submit-btn { background: ${config.primaryColor} !important; }
      .pq-submit-btn:hover:not(:disabled) { filter: brightness(0.9); }
      .pq-input:focus,
      .pq-textarea:focus,
      .pq-select:focus { border-color: ${config.primaryColor} !important; }
    `;
    document.head.appendChild(style);
  }

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'pq-widget-container';
  widgetContainer.className = `pq-widget-${config.position}`;

  // Create trigger button
  const triggerButton = document.createElement('button');
  triggerButton.id = 'pq-widget-trigger';
  triggerButton.className = `pq-trigger pq-theme-${config.theme}`;
  triggerButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2C5.58172 2 2 5.58172 2 10C2 11.8919 2.64706 13.6291 3.72697 15.0127L2.50549 17.4564C2.34823 17.7708 2.46203 18.1575 2.77639 18.3147C2.86977 18.3595 2.97041 18.3811 3.07056 18.3781L6.27303 18.2873C7.47303 18.7555 8.70303 19 10 19C14.4183 19 18 15.4183 18 11C18 6.58172 14.4183 3 10 3Z" fill="currentColor"/>
    </svg>
    <span>${config.buttonText}</span>
  `;

  // Create modal backdrop
  const modalBackdrop = document.createElement('div');
  modalBackdrop.id = 'pq-modal-backdrop';
  modalBackdrop.className = 'pq-modal-backdrop pq-hidden';

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'pq-modal';
  modal.className = `pq-modal pq-theme-${config.theme} pq-hidden`;
  modal.innerHTML = `
    <div class="pq-modal-header">
      <h2 class="pq-modal-title">Share Your Feedback</h2>
      <button id="pq-modal-close" class="pq-close-btn">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6L14 14M6 14L14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <form id="pq-feedback-form" class="pq-form">
      <div class="pq-form-group">
        <label for="pq-feedback-type" class="pq-label">Type</label>
        <select id="pq-feedback-type" name="type" class="pq-select" required>
          <option value="feedback">General Feedback</option>
          <option value="bug">Bug Report</option>
          <option value="improvement">Improvement</option>
        </select>
      </div>
      <div class="pq-form-group">
        <label for="pq-feedback-title" class="pq-label">Title</label>
        <input
          type="text"
          id="pq-feedback-title"
          name="title"
          class="pq-input"
          placeholder="Brief summary of your feedback"
          required
          minlength="5"
        />
      </div>
      <div class="pq-form-group">
        <label for="pq-feedback-description" class="pq-label">Description</label>
        <textarea
          id="pq-feedback-description"
          name="description"
          class="pq-textarea"
          placeholder="Provide details about your feedback"
          rows="4"
          required
          minlength="10"
        ></textarea>
      </div>
      <div class="pq-form-group">
        <label for="pq-feedback-email" class="pq-label">Email (optional)</label>
        <input
          type="email"
          id="pq-feedback-email"
          name="user_email"
          class="pq-input"
          placeholder="your.email@example.com"
        />
        <p class="pq-helper-text">We'll only use this to follow up on your feedback</p>
      </div>
      <div id="pq-form-error" class="pq-error-message pq-hidden"></div>
      <div id="pq-form-success" class="pq-success-message pq-hidden"></div>
      <button type="submit" id="pq-submit-btn" class="pq-submit-btn">
        <span id="pq-submit-text">Submit Feedback</span>
        <span id="pq-submit-loader" class="pq-loader pq-hidden"></span>
      </button>
    </form>
  `;

  // Append elements to DOM
  widgetContainer.appendChild(triggerButton);
  document.body.appendChild(widgetContainer);
  document.body.appendChild(modalBackdrop);
  document.body.appendChild(modal);

  // Load widget styles
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = `${config.apiUrl}/widget.css`;
  document.head.appendChild(styleLink);

  // Event handlers
  let isSubmitting = false;

  function openModal() {
    modal.classList.remove('pq-hidden');
    modalBackdrop.classList.remove('pq-hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('pq-hidden');
    modalBackdrop.classList.add('pq-hidden');
    document.body.style.overflow = '';

    // Reset form
    const form = document.getElementById('pq-feedback-form');
    if (form) form.reset();

    // Hide messages
    document.getElementById('pq-form-error').classList.add('pq-hidden');
    document.getElementById('pq-form-success').classList.add('pq-hidden');
  }

  function showError(message) {
    const errorEl = document.getElementById('pq-form-error');
    errorEl.textContent = message;
    errorEl.classList.remove('pq-hidden');
    document.getElementById('pq-form-success').classList.add('pq-hidden');
  }

  function showSuccess(message) {
    const successEl = document.getElementById('pq-form-success');
    successEl.textContent = message;
    successEl.classList.remove('pq-hidden');
    document.getElementById('pq-form-error').classList.add('pq-hidden');
  }

  function setSubmitting(submitting) {
    isSubmitting = submitting;
    const submitBtn = document.getElementById('pq-submit-btn');
    const submitText = document.getElementById('pq-submit-text');
    const submitLoader = document.getElementById('pq-submit-loader');

    if (submitting) {
      submitBtn.disabled = true;
      submitText.classList.add('pq-hidden');
      submitLoader.classList.remove('pq-hidden');
    } else {
      submitBtn.disabled = false;
      submitText.classList.remove('pq-hidden');
      submitLoader.classList.add('pq-hidden');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) return;

    const form = e.target;
    const formData = new FormData(form);

    const data = {
      board_slug: config.boardSlug,
      type: formData.get('type'),
      title: formData.get('title'),
      description: formData.get('description'),
      user_email: formData.get('user_email') || undefined,
    };

    // Validation
    if (data.title.length < 5) {
      showError('Title must be at least 5 characters');
      return;
    }
    if (data.description.length < 10) {
      showError('Description must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    showError('');

    try {
      const response = await fetch(`${config.apiUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit feedback');
      }

      showSuccess(result.message || 'Thank you for your feedback!');
      form.reset();

      // Close modal after 2 seconds
      setTimeout(() => {
        closeModal();
      }, 2000);
    } catch (error) {
      console.error('ProductQuarry Widget Error:', error);
      showError(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Attach event listeners
  triggerButton.addEventListener('click', openModal);
  document.getElementById('pq-modal-close').addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);
  document.getElementById('pq-feedback-form').addEventListener('submit', handleSubmit);

  // Close modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('pq-hidden')) {
      closeModal();
    }
  });

  // Prevent modal content clicks from closing modal
  modal.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Auto-open functionality
  if (config.autoOpen) {
    const delay = Math.max(0, config.autoOpenDelay);
    setTimeout(() => {
      // Only auto-open once per session
      const sessionKey = `pq-auto-opened-${config.boardSlug}`;
      if (!sessionStorage.getItem(sessionKey)) {
        openModal();
        sessionStorage.setItem(sessionKey, 'true');
      }
    }, delay);
  }

  console.log('ProductQuarry Feedback Widget loaded successfully');
})();
