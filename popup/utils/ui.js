// Toast notification system
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  const container = getOrCreateToastContainer();
  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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
  button.dataset.originalText = button.textContent;

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
