(function () {
  function getById(id) {
    return document.getElementById(id);
  }

  function openDevPortalModal() {
    var modal = document.querySelector('.js-modal');
    var blocks = document.querySelectorAll('.js-modal-block');
    var devPortalBlock = getById('dev-portal-modal-block');
    if (!modal || !devPortalBlock) return false;

    blocks.forEach(function (block) {
      block.classList.remove('is-selected');
    });

    modal.classList.add('is-visible');
    devPortalBlock.classList.add('is-selected');
    return false;
  }

  function closeDevPortalModal() {
    var modal = document.querySelector('.js-modal');
    var devPortalBlock = getById('dev-portal-modal-block');
    if (modal) modal.classList.remove('is-visible');
    if (devPortalBlock) devPortalBlock.classList.remove('is-selected');
  }

  function bind() {
    var devPortalBlock = getById('dev-portal-modal-block');
    if (!devPortalBlock || devPortalBlock.dataset.devPortalBound === 'true') {
      window.openDevPortalModal = openDevPortalModal;
      window.closeDevPortalModal = closeDevPortalModal;
      return;
    }

    var closeBtn = getById('dev-portal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (event) {
        event.preventDefault();
        closeDevPortalModal();
      });
    }

    devPortalBlock.dataset.devPortalBound = 'true';
    window.openDevPortalModal = openDevPortalModal;
    window.closeDevPortalModal = closeDevPortalModal;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  window.addEventListener('portal-components-ready', bind);
})();
