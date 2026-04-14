// Toast notification system
const TOAST_DURATIONS = {
  success: 2000,
  info: 3000,
  warning: 5000,
  error: 7000
};

export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  if (type === 'error' || type === 'warning') {
    const closeBtn = document.createElement('span');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });
    toast.appendChild(closeBtn);
  }

  const container = getOrCreateToastContainer();
  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto remove
  const duration = TOAST_DURATIONS[type] || 3000;
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function getOrCreateToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

// Loading indicator for buttons
export function showLoading(button) {
  if (!button) return;
  button.classList.add('loading');
  button.disabled = true;

  const spinner = document.createElement('span');
  spinner.className = 'spinner';
  button.prepend(spinner);
}

export function hideLoading(button) {
  if (!button) return;
  button.classList.remove('loading');
  button.disabled = false;

  const spinner = button.querySelector('.spinner');
  if (spinner) spinner.remove();
}
