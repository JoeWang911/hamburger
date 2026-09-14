(() => {
  const PASSWORD_HASH = '4225466f46976e5877d0c8f7a77eafbf97a92841dedabae705816fa4c76e033f';
  const lockScreen = document.querySelector('#lock-screen');
  const lockForm = document.querySelector('#lock-form');
  const passwordInput = document.querySelector('#album-password');
  const lockError = document.querySelector('#lock-error');
  const unlock = () => {
    document.body.classList.remove('locked');
    lockScreen.classList.add('unlocked');
    try { sessionStorage.setItem('hamburger-unlocked', 'yes'); } catch (_) {}
  };
  try { if (sessionStorage.getItem('hamburger-unlocked') === 'yes') unlock(); } catch (_) {}
  lockForm.addEventListener('submit', async event => {
    event.preventDefault();
    const bytes = new TextEncoder().encode(passwordInput.value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (hash === PASSWORD_HASH) {
      lockError.textContent = '';
      passwordInput.value = '';
      unlock();
    } else {
      lockError.textContent = '密码不对，再试一次。';
      passwordInput.select();
    }
  });

  const media = Array.isArray(window.HAMBURGER_MEDIA) ? window.HAMBURGER_MEDIA : [];
  const gallery = document.querySelector('#gallery');
  const count = document.querySelector('#photo-count');
  const viewer = document.querySelector('#viewer');
  const stage = viewer.querySelector('.viewer-stage');
  const indexLabel = document.querySelector('#viewer-index');
  const dateLabel = document.querySelector('#viewer-date');
  let current = 0;
  let touchStart = 0;

  const photos = media.filter(item => item.type === 'photo').length;
  const videos = media.length - photos;
  count.textContent = `${photos} 张照片 · ${videos} 段短片`;

  const fragment = document.createDocumentFragment();
  media.forEach((item, index) => {
    const button = document.createElement('button');
    button.className = `card card-${item.type}`;
    button.type = 'button';
    button.setAttribute('aria-label', item.type === 'photo' ? `打开第 ${index + 1} 张照片` : `播放第 ${index + 1} 个短片`);
    if (item.type === 'photo') {
      const image = new Image();
      image.src = item.thumb;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.width = item.width;
      image.height = item.height;
      button.append(image);
    } else {
      const video = document.createElement('video');
      video.src = item.src;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      button.append(video);
      button.addEventListener('mouseenter', () => video.play().catch(() => {}));
      button.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
    }
    button.addEventListener('click', () => openViewer(index));
    fragment.append(button);
  });
  gallery.append(fragment);

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  }
  function renderViewer() {
    const item = media[current];
    stage.replaceChildren();
    if (!item) return;
    const element = item.type === 'photo' ? new Image() : document.createElement('video');
    element.src = item.src;
    element.alt = item.type === 'photo' ? `相册照片 ${current + 1}` : '';
    if (item.type === 'video') { element.controls = true; element.autoplay = true; element.playsInline = true; }
    stage.append(element);
    indexLabel.textContent = `${String(current + 1).padStart(2, '0')} / ${String(media.length).padStart(2, '0')}`;
    dateLabel.textContent = formatDate(item.date);
  }
  function openViewer(index) { current = index; renderViewer(); viewer.showModal(); document.body.style.overflow = 'hidden'; }
  function closeViewer() { viewer.close(); document.body.style.overflow = ''; stage.replaceChildren(); }
  function move(delta) { current = (current + delta + media.length) % media.length; renderViewer(); }

  viewer.querySelector('.viewer-close').addEventListener('click', closeViewer);
  viewer.querySelector('.viewer-prev').addEventListener('click', () => move(-1));
  viewer.querySelector('.viewer-next').addEventListener('click', () => move(1));
  viewer.addEventListener('click', event => { if (event.target === viewer) closeViewer(); });
  viewer.addEventListener('cancel', event => { event.preventDefault(); closeViewer(); });
  document.addEventListener('keydown', event => {
    if (!viewer.open) return;
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
  });
  viewer.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
  viewer.addEventListener('touchend', event => {
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 55) move(distance > 0 ? -1 : 1);
  }, { passive: true });
  document.querySelector('#shuffle').addEventListener('click', () => {
    if (!media.length) return;
    openViewer(Math.floor(Math.random() * media.length));
  });
})();
