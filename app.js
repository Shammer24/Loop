
const DEMO_POSTS = [
  {
    id: 1,
    user: '@dri.loop',
    avatar: 'D',
    type: 'RETO',
    title: 'Reto del día',
    caption: 'Enséñanos tu mejor entrada caminando como si fueras famoso. Reta a 2 personas.',
    meta: 'Challenge trending · 24 min restante',
    bg: 'linear-gradient(135deg,#1a1f3b,#602749)',
    likes: 1284,
    comments: [
      { user:'@anna.loop', text:'esto se va viral 🔥' },
      { user:'@mike.loop', text:'aceptado 😮‍💨' }
    ]
  },
  {
    id: 2,
    user: '@mike.loop',
    avatar: 'M',
    type: 'VS',
    title: 'Dance VS',
    caption: '@mike.loop vs @anna.loop — ¿quién se llevó este dance round?',
    meta: 'VS battle · vota abajo',
    bg: 'linear-gradient(135deg,#19253f,#09203f,#537895)',
    likes: 2240,
    comments: [
      { user:'@nina.loop', text:'anna ganó fácil' },
      { user:'@kevin.loop', text:'mike estuvo duro' }
    ]
  },
  {
    id: 3,
    user: '@nina.loop',
    avatar: 'N',
    type: 'POST',
    title: 'Reacción real',
    caption: 'Mi cara cuando me nominaron a un VS en pleno trabajo 💀',
    meta: 'Post normal · hace 8 min',
    bg: 'linear-gradient(135deg,#28113d,#1b3358)',
    likes: 932,
    comments: [
      { user:'@dri.loop', text:'jajajaj real' }
    ]
  }
];

let posts = JSON.parse(localStorage.getItem('loop_v4_posts') || 'null') || DEMO_POSTS;
let activeCommentsPost = null;

const feed = document.getElementById('feed');
const commentsSheet = document.getElementById('commentsSheet');
const commentsList = document.getElementById('commentsList');
const commentInput = document.getElementById('commentInput');

function save() {
  localStorage.setItem('loop_v4_posts', JSON.stringify(posts));
}

function renderFeed() {
  feed.innerHTML = posts.map((p, index) => `
    <section class="post" data-id="${p.id}">
      <div class="post-media" style="--bg-image:${p.bg}"></div>

      <div class="post-content">
        <div class="user-row">
          <div class="avatar">${p.avatar}</div>
          <div class="user-meta">
            <strong>${p.user}</strong>
            <span><span class="badge">${p.type}</span></span>
          </div>
        </div>
        <h2 class="title">${p.title}</h2>
        <p class="caption">${p.caption}</p>
        <div class="meta">${p.meta}</div>
      </div>

      <div class="side-actions">
        <button class="action like-btn" data-id="${p.id}">
          <div class="icon">❤️</div>
          <span>${p.likes}</span>
        </button>
        <button class="action comment-btn" data-id="${p.id}">
          <div class="icon">💬</div>
          <span>${p.comments.length}</span>
        </button>
        <button class="action challenge-btn">
          <div class="icon">🔥</div>
          <span>Retar</span>
        </button>
        <button class="action share-btn">
          <div class="icon">↗️</div>
          <span>Share</span>
        </button>
        <button class="action vs-btn">
          <div class="icon">⚔️</div>
          <span>VS</span>
        </button>
      </div>
    </section>
  `).join('');
  bindPostActions();
}

function bindPostActions() {
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const post = posts.find(p => p.id === id);
      post.likes += 1;
      save();
      renderFeed();
    };
  });

  document.querySelectorAll('.comment-btn').forEach(btn => {
    btn.onclick = () => openComments(Number(btn.dataset.id));
  });

  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.onclick = async () => {
      const url = window.location.href;
      if (navigator.share) {
        try { await navigator.share({ title: 'Loop', text: 'Mira esto en Loop', url }); } catch {}
      } else {
        alert('Comparte Loop con este link: ' + url);
      }
    };
  });

  document.querySelectorAll('.challenge-btn').forEach(btn => btn.onclick = () => openSheet('createSheet'));
  document.querySelectorAll('.vs-btn').forEach(btn => btn.onclick = () => openSheet('vsSheet'));
}

function openComments(postId) {
  activeCommentsPost = posts.find(p => p.id === postId);
  commentsList.innerHTML = activeCommentsPost.comments.map(c => `
    <div class="comment"><strong>${c.user}</strong>${c.text}</div>
  `).join('') || '<div class="comment">Sin comentarios todavía.</div>';
  openSheet('commentsSheet');
}

function openSheet(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeSheet(id) {
  document.getElementById(id).classList.add('hidden');
}

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.onclick = () => closeSheet(btn.dataset.close);
});
document.getElementById('openCreateTop').onclick = () => openSheet('createSheet');
document.getElementById('openProfileTop').onclick = () => openSheet('profileSheet');

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const screen = btn.dataset.screen;
    if (screen === 'create') openSheet('createSheet');
    if (screen === 'profile') openSheet('profileSheet');
    if (screen === 'vs') openSheet('vsSheet');
    if (screen === 'feed') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});

document.getElementById('publishBtn').onclick = () => {
  const type = document.querySelector('[data-create-type].selected')?.dataset.createType || 'post';
  const user = document.getElementById('creatorUser').value || '@nuevo.loop';
  const title = document.getElementById('creatorTitle').value || 'Nuevo post';
  const caption = document.getElementById('creatorCaption').value || 'Acabo de publicar en Loop';
  posts.unshift({
    id: Date.now(),
    user,
    avatar: user.replace('@','')[0]?.toUpperCase() || 'L',
    type: type.toUpperCase(),
    title,
    caption,
    meta: 'Publicado ahora mismo',
    bg: 'linear-gradient(135deg,#3a0ca3,#f72585)',
    likes: 0,
    comments: []
  });
  save();
  renderFeed();
  closeSheet('createSheet');
};

document.querySelectorAll('[data-create-type]').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('[data-create-type]').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  };
});
document.getElementById('sendComment').onclick = () => {
  const text = commentInput.value.trim();
  if (!text || !activeCommentsPost) return;
  activeCommentsPost.comments.push({ user: '@kevin.loop', text });
  commentInput.value = '';
  save();
  openComments(activeCommentsPost.id);
};
document.querySelectorAll('.vote-btn').forEach(btn => {
  btn.onclick = () => alert('Voto registrado 🔥');
});

renderFeed();

// basic pwa prompt
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
