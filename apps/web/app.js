const views = [...document.querySelectorAll('[data-view]')];
const triggers = [...document.querySelectorAll('[data-screen]')];

function navigate(screen) {
  views.forEach((view) => view.classList.toggle('is-hidden', view.dataset.view !== screen));
  triggers.forEach((trigger) => trigger.classList.toggle('is-active', trigger.dataset.screen === screen));
  if (window.location.hash !== `#${screen}`) history.replaceState(null, '', `#${screen}`);
}

triggers.forEach((trigger) => trigger.addEventListener('click', (event) => {
  event.preventDefault();
  navigate(trigger.dataset.screen);
}));

navigate(window.location.hash.slice(1) || 'overview');
