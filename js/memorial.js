/* Memorial experience: static-site friendly data, support and pending moderation. */
const MEMORIAL_FALLBACK = {
  siteName: 'Little Star Wish',
  deceased: {
    name: 'Izuchukwu Chisom Okeke',
    nickname: 'Soft Lion',
    dates: '1994 – 2026',
    photo: '',
    biography: 'Izuchukwu Chisom Okeke, lovingly known as Soft Lion, will be remembered with love by his family, friends and everyone whose life he touched.',
    quote: 'Some lives leave footprints that time cannot erase.'
  },
  support: {
    bank: 'First Bank',
    accountName: 'Ifeoma Sandra Okeke',
    accountNumber: '3087652436',
    whatsapp: '2348138985308',
  },
  registryUrl: 'https://mylittlestarwish.com/',
  messagesApi: '',
  approvedMessages: [
    {
      firstName: 'Adaeze',
      lastName: 'Nwosu',
      message: 'Soft Lion will be remembered for his warmth, kindness and the joy he brought to everyone around him. May his memory remain a blessing.'
    },
    {
      firstName: 'Chinedu',
      lastName: 'Okafor',
      message: 'My deepest condolences to the family. Wishing you comfort, strength and peace as you honour a life so deeply loved.'
    },
    {
      firstName: 'Amaka',
      lastName: 'Eze',
      message: 'May the beautiful memories you shared bring comfort in the days ahead. You are all in my thoughts and prayers.'
    },
    {
      firstName: 'Ifeanyi',
      lastName: 'Obi',
      message: 'May God grant the family strength and surround you with peace during this difficult season.'
    },
    {
      firstName: 'Ngozi',
      lastName: 'Umeh',
      message: 'Your kindness and gentle spirit will not be forgotten. Rest peacefully, Soft Lion.'
    },
    {
      firstName: 'Tunde',
      lastName: 'Adebayo',
      message: 'Thinking of the family with love and prayer. May every precious memory bring comfort.'
    }
  ]
};

const PENDING_MESSAGES_KEY = 'little-star-wish-memorial-pending-v1';
let memorialConfig = MEMORIAL_FALLBACK;

async function loadMemorial() {
  try {
    const response = await fetch('data/memorial.json');
    if (!response.ok) throw new Error('Memorial data unavailable');
    memorialConfig = await response.json();
  } catch {
    memorialConfig = MEMORIAL_FALLBACK;
  }

  renderContent(memorialConfig);
  initSupport(memorialConfig.support);
  initMessageForm();
  await refreshMessages();
}

async function refreshMessages() {
  const api = memorialConfig.messagesApi;
  if (api) {
    try {
      const response = await fetch(`${api}?action=list`);
      if (!response.ok) throw new Error('Messages unavailable');
      const messages = await response.json();
      renderMessages(Array.isArray(messages) ? messages : []);
      return;
    } catch (error) {
      console.error('Could not load messages from the Sheet API', error);
      // Fall through to static/local messages if the Sheet API is unreachable.
    }
  }
  renderMessages(getDisplayMessages());
}

function getDisplayMessages() {
  const approved = memorialConfig.approvedMessages || [];
  const pending = memorialConfig.messagesApi ? [] : readPendingMessages();
  return [...approved, ...pending];
}

function renderContent(config) {
  const { deceased, family, support } = config;
  const nameParts = deceased.name.trim().split(/\s+/);
  setText('memorialFirstNames', nameParts.slice(0, -1).join(' '));
  setText('memorialSurname', nameParts.length > 1 ? nameParts[nameParts.length - 1] : '');
  setText('memorialNickname', deceased.nickname ? `(${deceased.nickname})` : '');
  setText('heroBiography', deceased.biography);
  setText('bankName', support.bank);
  setText('accountName', support.accountName);
  setText('accountNumber', support.accountNumber);

  const dates = document.getElementById('memorialDates');
  if (dates && deceased.dates) {
    dates.hidden = false;
    dates.textContent = deceased.dates;
  }

  const photo = document.getElementById('memorialPhoto');
  const placeholder = document.getElementById('portraitPlaceholder');
  if (photo && placeholder && deceased.photo) {
    photo.src = deceased.photo;
    photo.alt = `A photograph of ${deceased.name}`;
    photo.hidden = false;
    placeholder.hidden = true;
  }

  const registryLink = document.querySelector('.registry-link a');
  if (registryLink) registryLink.href = config.registryUrl || '/';
  document.title = `Remembering ${deceased.name} | ${config.siteName || 'Little Star Wish'}`;
}

function initSupport(support) {
  const dialog = document.getElementById('supportDialog');
  const openButton = document.getElementById('openSupport');
  const heroButton = document.getElementById('heroSupport');
  const closeButton = document.getElementById('closeSupport');
  openButton?.addEventListener('click', () => dialog?.showModal());
  heroButton?.addEventListener('click', () => dialog?.showModal());
  closeButton?.addEventListener('click', () => dialog?.close());
  document.getElementById('dialogMessageLink')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  document.getElementById('copyAccount')?.addEventListener('click', () => copyAccount(support.accountNumber));
}

function initMessageForm() {
  const form = document.getElementById('messageForm');
  const message = document.getElementById('condolenceMessage');
  const counter = document.getElementById('characterCount');
  if (!form) return;

  message?.addEventListener('input', () => {
    if (counter) counter.textContent = `${message.value.length} / 500`;
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const firstName = document.getElementById('senderFirstName')?.value.trim() || '';
    const lastName = document.getElementById('senderLastName')?.value.trim() || '';
    const text = message?.value.trim() || '';
    const status = document.getElementById('formStatus');
    if (!firstName || !lastName || !text) {
      setStatus(status, 'Please add your first name, last name and a message before submitting.', true);
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const api = memorialConfig.messagesApi;

    if (api) {
      const originalLabel = submitButton?.textContent;
      submitButton?.setAttribute('disabled', 'true');
      if (submitButton) submitButton.textContent = 'Sending…';
      setStatus(status, 'Sending your message…', false);
      try {
        await fetch(api, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'submit', firstName, lastName, message: text })
        });
        form.reset();
        if (counter) counter.textContent = '0 / 500';
        setStatus(status, 'Thank you. Your message has been saved for the family and is pending moderation.', false);
      } catch (error) {
        console.error('Condolence submission failed', error);
        setStatus(status, 'Could not reach the message service. Please try again shortly.', true);
      } finally {
        submitButton?.removeAttribute('disabled');
        if (submitButton && originalLabel) submitButton.textContent = originalLabel;
      }
      return;
    }

    const pending = readPendingMessages();
    const duplicate = pending.some(item => item.firstName === firstName && item.lastName === lastName && item.message === text);
    if (duplicate) {
      setStatus(status, 'This message is already saved on this device for moderation.', false);
      return;
    }

    pending.push({ firstName, lastName, message: text, submittedAt: new Date().toISOString(), status: 'pending' });
    localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(pending));
    form.reset();
    if (counter) counter.textContent = '0 / 500';
    setStatus(status, 'Thank you. Your message has been saved for the family and is pending moderation.', false);
    renderMessages(getDisplayMessages());
  });
}

function renderMessages(messages) {
  const list = document.getElementById('messageList');
  if (!list) return;
  if (!messages.length) {
    list.innerHTML = '<p class="empty-wall">Messages of love will appear here when the family has approved them.</p>';
    return;
  }
  list.innerHTML = messages.map(item => `
    <article class="message-card">
      <p>${escapeHTML(item.message)}</p>
      <footer>— ${escapeHTML(`${item.firstName || ''} ${item.lastName || ''}`.trim() || item.name || 'A friend')}</footer>
    </article>
  `).join('');
  initMessageScroller(list);
}

function initMessageScroller(list) {
  if (list.dataset.scrollerRunning === 'true') return;

  const trySetup = attemptsLeft => {
    if (list.scrollHeight <= list.clientHeight) {
      if (attemptsLeft > 0) {
        window.setTimeout(() => trySetup(attemptsLeft - 1), 50);
      }
      return;
    }
    if (list.dataset.scrollerRunning === 'true') return;
    list.dataset.scrollerRunning = 'true';

    let paused = false;
    let lastTime = 0;
    const setPaused = value => { paused = value; };
    list.addEventListener('mouseenter', () => setPaused(true));
    list.addEventListener('mouseleave', () => setPaused(false));
    list.addEventListener('focusin', () => setPaused(true));
    list.addEventListener('focusout', () => setPaused(false));
    list.addEventListener('touchstart', () => setPaused(true), { passive: true });
    list.addEventListener('touchend', () => setPaused(false), { passive: true });

    const scroll = time => {
      if (!lastTime) lastTime = time;
      const elapsed = time - lastTime;
      lastTime = time;
      if (!paused) {
        list.scrollTop += elapsed * 0.008;
        const bottom = list.scrollHeight - list.clientHeight;
        if (list.scrollTop >= bottom) list.scrollTop = 0;
      }
      window.requestAnimationFrame(scroll);
    };
    window.requestAnimationFrame(scroll);
  };

  window.requestAnimationFrame(() => trySetup(10));
}

function readPendingMessages() {
  try { return JSON.parse(localStorage.getItem(PENDING_MESSAGES_KEY) || '[]'); } catch { return []; }
}

async function copyAccount(accountNumber) {
  try {
    await navigator.clipboard.writeText(accountNumber);
    setStatus(document.getElementById('formStatus'), 'Account number copied.', false);
  } catch {
    setStatus(document.getElementById('formStatus'), `Account number: ${accountNumber}`, false);
  }
}

function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value || ''; }
function setStatus(element, text, isError) { if (!element) return; element.textContent = text; element.classList.toggle('is-error', isError); }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }

document.addEventListener('DOMContentLoaded', loadMemorial);
