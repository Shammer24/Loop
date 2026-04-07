const seedPosts = [
  {
    id: '1', type: 'challenge', user: '@dri.loop', title: 'Reto del día',
    caption: 'Enséñanos tu mejor entrada caminando como si fueras famoso. Reta a 2 personas.',
    likes: 1284, comments: [
      { user: '@kevin', text: 'Durísimo 🔥' },
      { user: '@taisha', text: 'Yo me apunto 😂' }
    ],
    subtitle: 'Challenge trending · 24 min restante'
  },
  {
    id: '2', type: 'vs', user: '@mike.loop', target: '@anna.loop', title: 'Dance VS',
    caption: '@mike.loop vs @anna.loop — ¿quién se llevó este dance round?',
    likes: 2240, votesA: 321, votesB: 287,
    comments: [
      { user: '@jay', text: 'Mike se la comió' },
      { user: '@abi', text: 'Anna ganó fácil' }
    ],
    subtitle: 'VS battle · Vota abajo'
  },
  {
    id: '3', type: 'post', user: '@nina.loop', title: 'Reacción real',
    caption: 'Mi cara cuando me nominaron a un VS en pleno trabajo 💀',
    likes: 932,
    comments: [{ user: '@cris', text: 'JAJAJA demasiado real' }],
    subtitle: 'Post normal · hace 8 min'
  }
];

let posts = JSON.parse(localStorage.getItem('loop_v3_posts') || 'null') || seedPosts;
let profile = JSON.parse(localStorage.getItem('loop_v3_profile') || 'null') || {
  username: '@kevin', bio: 'Creator mode on', followers: 204, following: 91, wins: 4, losses: 2, streak: 7
};
let currentCommentsPost = null;
let composerMode = 'post';

const feedEl = document.getElementById('feed');
const createModal = document.getElementById('createModal');
const composerModal = document.getElementById('composerModal');
const commentsModal = document.getElementById('commentsModal');
const vsModal = document.getElementById('vsModal');
const profileModal = document.getElementById('profileModal');

function save() {
  localStorage.setItem('loop_v3_posts', JSON.stringify(posts));
  localStorage.setItem('loop_v3_profile', JSON.stringify(profile));
}

function cardTemplate(post) {
  const badge = post.type === 'challenge' ? 'RETO' : post.type === 'vs' ? 'VS' : 'POST';
  return `
    <section class="card ${post.type}" data-id="${post.id}">
      <div class="video-placeholder"></div>
      <div class="play-badge">▶ LIVE FEEL</div>
      <div class="meta">
        <div class="user-line">
          <span>${post.user}</span>
          <span class="badge">${badge}</span>
        </div>
        <h2>${post.title || ''}</h2>
        <div class="caption">${post.caption}</div>
        <div class="subline">${post.subtitle || ''}</div>
      </div>
      <div class="actions">
        <button class="action like-btn" data-id="${post.id}">❤️<small>${post.likes}</small></button>
        <button class="action comment-btn" data-id="${post.id}">💬<small>${post.comments.length}</small></button>
        <button class="action retar-btn" data-id="${post.id}">🔥<small>Retar</small></button>
        <button class="action share-btn" data-id="${post.id}">↗️<small>Share</small></button>
        ${post.type !== 'vs' ? `<button class="action vs-btn" data-id="${post.id}">⚔️<small>VS</small></button>` : `<button class="action arena-btn" data-id="${post.id}">🗳️<small>Votar</small></button>`}
      </div>
    </section>`;
}

function renderFeed() {
  feedEl.innerHTML = posts.map(cardTemplate).join('');
  bindFeedEvents();
}

function bindFeedEvents() {
  document.querySelectorAll('.like-btn').forEach(btn => btn.onclick = () => {
    const post = posts.find(p => p.id === btn.dataset.id); post.likes++; save(); renderFeed();
  });
  document.querySelectorAll('.comment-btn').forEach(btn => btn.onclick = () => openComments(btn.dataset.id));
  document.querySelectorAll('.retar-btn').forEach(btn => openComposer('challenge', btn.dataset.id));
  document.querySelectorAll('.vs-btn').forEach(btn => openComposer('vs', btn.dataset.id));
  document.querySelectorAll('.arena-btn').forEach(btn => openVs(btn.dataset.id));
  document.querySelectorAll('.share-btn').forEach(btn => navigator.clipboard?.writeText(location.href));
}

function openModal(el) { el.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.querySelectorAll('[data-close]').forEach(btn => btn.onclick = () => closeModal(btn.dataset.close));

document.getElementById('createPostBtn').onclick = () => openComposer('post');
document.getElementById('createChallengeBtn').onclick = () => openComposer('challenge');
document.getElementById('createVsBtn').onclick = () => openComposer('vs');
document.getElementById('openVsArena').onclick = () => openVs(posts.find(p => p.type === 'vs')?.id || posts[0].id);
document.getElementById('openProfile').onclick = openProfile;

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    if (tab === 'create') openModal(createModal);
    if (tab === 'vs') openVs(posts.find(p => p.type === 'vs')?.id || posts[0].id);
    if (tab === 'profile') openProfile();
    if (tab === 'feed') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});

function openComposer(mode, sourceId = null) {
  composerMode = mode;
  document.getElementById('composerTitle').textContent = mode === 'post' ? 'Nuevo post' : mode === 'challenge' ? 'Nuevo reto' : 'Nuevo VS';
  document.getElementById('inputType').value = mode;
  document.getElementById('inputTarget').classList.toggle('hidden', mode !== 'vs');
  document.getElementById('inputTitle').value = mode === 'post' ? 'Nuevo momento' : mode === 'challenge' ? 'Reto nuevo' : 'VS abierto';
  document.getElementById('inputCaption').value = sourceId ? `Inspirado en post ${sourceId}` : '';
  openModal(composerModal);
}

document.getElementById('publishBtn').onclick = () => {
  const type = document.getElementById('inputType').value;
  const newPost = {
    id: Date.now().toString(),
    type,
    user: document.getElementById('inputUser').value || '@kevin',
    target: document.getElementById('inputTarget').value || null,
    title: document.getElementById('inputTitle').value || 'Post',
    caption: document.getElementById('inputCaption').value || 'Nuevo contenido en Loop',
    likes: 0,
    comments: [],
    subtitle: type === 'vs' ? 'VS recién lanzado' : type === 'challenge' ? 'Reto recién creado' : 'Post nuevo'
  };
  if (type === 'vs') { newPost.votesA = 0; newPost.votesB = 0; }
  posts.unshift(newPost);
  save();
  closeModal('composerModal');
  renderFeed();
};

function openComments(postId) {
  currentCommentsPost = posts.find(p => p.id === postId);
  renderComments();
  openModal(commentsModal);
}

function renderComments() {
  const list = document.getElementById('commentsList');
  const comments = currentCommentsPost?.comments || [];
  list.innerHTML = comments.length ? comments.map(c => `
    <div class="comment-item">
      <div class="comment-user">${c.user}</div>
      <div>${c.text}</div>
    </div>`).join('') : `<div class="empty">Sé el primero en comentar.</div>`;
}

document.getElementById('sendComment').onclick = () => {
  const input = document.getElementById('commentInput');
  if (!input.value.trim() || !currentCommentsPost) return;
  currentCommentsPost.comments.push({ user: profile.username, text: input.value.trim() });
  input.value = '';
  save();
  renderComments();
  renderFeed();
};

function openVs(postId) {
  const post = posts.find(p => p.id === postId) || posts.find(p => p.type === 'vs');
  const vs = document.getElementById('vsContent');
  if (!post) return;
  const left = post.user;
  const right = post.target || '@otro.loop';
  vs.innerHTML = `
    <div class="vs-battle">
      <div class="vs-side"><h3>${left}</h3><p>${post.votesA || 0} votos</p></div>
      <div class="vs-center">VS</div>
      <div class="vs-side"><h3>${right}</h3><p>${post.votesB || 0} votos</p></div>
    </div>
    <p>${post.caption}</p>
    <div class="vote-row">
      <button class="primary-btn" id="voteA">Votar ${left}</button>
      <button class="primary-btn" id="voteB">Votar ${right}</button>
    </div>
  `;
  document.getElementById('voteA').onclick = () => { post.votesA = (post.votesA || 0) + 1; save(); openVs(post.id); renderFeed(); };
  document.getElementById('voteB').onclick = () => { post.votesB = (post.votesB || 0) + 1; save(); openVs(post.id); renderFeed(); };
  openModal(vsModal);
}

function openProfile() {
  document.getElementById('profileContent').innerHTML = `
    <div class="profile-card">
      <div class="profile-top">
        <div class="avatar">L</div>
        <div>
          <h3 style="margin:0">${profile.username}</h3>
          <p style="margin:6px 0;color:var(--muted)">${profile.bio}</p>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><strong>${profile.followers}</strong><div>Followers</div></div>
        <div class="stat"><strong>${profile.following}</strong><div>Following</div></div>
        <div class="stat"><strong>${profile.streak}</strong><div>Streak</div></div>
        <div class="stat"><strong>${profile.wins}</strong><div>Wins</div></div>
        <div class="stat"><strong>${profile.losses}</strong><div>Losses</div></div>
        <div class="stat"><strong>${posts.filter(p => p.user === profile.username).length}</strong><div>Posts</div></div>
      </div>
    </div>
  `;
  openModal(profileModal);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

renderFeed();
