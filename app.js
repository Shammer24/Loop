const DEMO_DATA = {
  profile: {
    username: '@kevin.loop',
    displayName: 'Kevin',
    points: 1260,
    wins: 18,
    followers: 428,
    likes: 3921,
  },
  posts: [
    {
      id: 1,
      user: '@dri.loop',
      avatar: 'D',
      type: 'RETO',
      title: 'Reto del día',
      caption: 'Enséñanos tu mejor entrada caminando como si fueras famoso. Reta a dos personas.',
      meta: 'Challenge trending · 24 min restante',
      likes: 1284,
      bg: 'linear-gradient(135deg,#1a1f3b,#602749)',
      comments: [
        { user: '@anna.loop', text: 'esto se va viral 🔥' },
        { user: '@mike.loop', text: 'aceptado 😮‍💨' },
      ],
    },
    {
      id: 2,
      user: '@mike.loop',
      avatar: 'M',
      type: 'VS',
      title: 'Dance VS',
      caption: '@mike.loop vs @anna.loop — ¿quién se llevó este dance round?',
      meta: 'VS battle · vota abajo',
      likes: 2240,
      bg: 'linear-gradient(135deg,#19253f,#09203f,#537895)',
      comments: [
        { user: '@nina.loop', text: 'anna ganó fácil' },
        { user: '@kevin.loop', text: 'mike estuvo duro' },
      ],
    },
    {
      id: 3,
      user: '@nina.loop',
      avatar: 'N',
      type: 'POST',
      title: 'Reacción real',
      caption: 'Mi cara cuando me nominaron a un VS en pleno trabajo 😂',
      meta: 'Post normal · hace 8 min',
      likes: 932,
      bg: 'linear-gradient(135deg,#28113d,#1b3358)',
      comments: [{ user: '@dri.loop', text: 'jajajaj real' }],
    },
  ],
  battles: [
    {
      id: 1,
      title: 'Mejor outfit con sneakers blancos',
      left: { user: '@kevin.loop', title: 'Street clean', votes: 41, bg: 'linear-gradient(135deg,#312e81,#7c3aed)' },
      right: { user: '@anna.loop', title: 'Summer flex', votes: 38, bg: 'linear-gradient(135deg,#9d174d,#ec4899)' },
      endsIn: 'Cierra en 18 min',
    },
  ],
}

const STORAGE_KEY = 'loop_v5_state'
let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || DEMO_DATA
let activeCommentsPost = null
let selectedCreateType = 'post'

const feed = document.getElementById('feed')
const leaderboardEl = document.getElementById('leaderboard')
const featuredBattle = document.getElementById('featuredBattle')
const profileStats = document.getElementById('profileStats')
const commentsList = document.getElementById('commentsList')
const commentInput = document.getElementById('commentInput')
const overlay = document.getElementById('overlay')

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function showToast(text) {
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = text
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 1800)
}

function openSheet(id) {
  overlay.classList.remove('hidden')
  document.getElementById(id).classList.remove('hidden')
}

function closeSheet(id) {
  document.getElementById(id).classList.add('hidden')
  if ([...document.querySelectorAll('.sheet')].every((el) => el.classList.contains('hidden'))) {
    overlay.classList.add('hidden')
  }
}

function medal(index) {
  return index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`
}

function buildLeaderboardData() {
  return [
    { user: '@kevin.loop', points: state.profile.points, wins: state.profile.wins },
    { user: '@anna.loop', points: 1190, wins: 17 },
    { user: '@mike.loop', points: 1085, wins: 14 },
    { user: '@dri.loop', points: 990, wins: 12 },
  ].sort((a, b) => b.points - a.points)
}

function renderLeaderboard() {
  const rows = buildLeaderboardData()
  leaderboardEl.innerHTML = rows.map((row, index) => `
    <div class="rank-row">
      <div class="rank-medal">${medal(index)}</div>
      <div>
        <strong>${row.user}</strong>
        <div class="muted">${row.wins} wins</div>
      </div>
      <div class="rank-score">${row.points} pts</div>
    </div>
  `).join('')
}

function renderProfileStats() {
  const stats = [
    ['Puntos', state.profile.points],
    ['Wins', state.profile.wins],
    ['Followers', state.profile.followers],
    ['Likes', state.profile.likes],
  ]

  profileStats.innerHTML = stats.map(([label, value]) => `
    <div class="stat-card card">
      <span class="muted">${label}</span>
      <strong>${value}</strong>
    </div>
  `).join('')
}

function renderFeaturedBattle() {
  const battle = state.battles[0]
  featuredBattle.innerHTML = `
    <article class="battle-card card">
      <div class="battle-users">
        <div>
          <p class="eyebrow">${battle.endsIn}</p>
          <h3>${battle.title}</h3>
        </div>
        <span class="badge">VS Arena</span>
      </div>
      <div class="battle-grid">
        <div class="battle-side" style="background:${battle.left.bg}">
          <strong>${battle.left.user}</strong>
          <p>${battle.left.title}</p>
          <button class="vote-btn" data-side="left">Votar izquierda</button>
        </div>
        <div class="vs-mark">VS</div>
        <div class="battle-side right" style="background:${battle.right.bg}">
          <strong>${battle.right.user}</strong>
          <p>${battle.right.title}</p>
          <button class="vote-btn" data-side="right">Votar derecha</button>
        </div>
      </div>
      <div class="battle-score">
        <span>${battle.left.votes} votos</span>
        <span>${battle.right.votes} votos</span>
      </div>
    </article>
  `

  featuredBattle.querySelectorAll('.vote-btn').forEach((btn) => {
    btn.onclick = () => {
      const side = btn.dataset.side
      state.battles[0][side].votes += 1
      state.profile.points += 5
      save()
      renderFeaturedBattle()
      renderProfileStats()
      renderLeaderboard()
      showToast('Voto registrado. +5 puntos')
    }
  })
}

function renderFeed() {
  feed.innerHTML = state.posts.map((post) => `
    <article class="post-card card">
      <div class="post-head">
        <div class="user-chip">
          <div class="avatar">${post.avatar}</div>
          <div>
            <strong>${post.user}</strong>
            <div class="muted">${post.meta}</div>
          </div>
        </div>
        <span class="badge">${post.type}</span>
      </div>

      <div class="visual" style="background:${post.bg}">
        <div class="post-copy">
          <h3>${post.title}</h3>
          <p>${post.caption}</p>
        </div>
      </div>

      <div class="post-actions">
        <div class="stat-line"><span>❤️</span><span>${post.likes}</span></div>
        <div class="stat-line"><span>💬</span><span>${post.comments.length}</span></div>
        <button class="icon-btn like-btn" data-id="${post.id}">Like</button>
        <button class="icon-btn comment-btn" data-id="${post.id}">Comentarios</button>
      </div>
    </article>
  `).join('')

  bindPostActions()
}

function bindPostActions() {
  document.querySelectorAll('.like-btn').forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id)
      const post = state.posts.find((p) => p.id === id)
      post.likes += 1
      if (post.user === state.profile.username) state.profile.likes += 1
      save()
      renderFeed()
      renderProfileStats()
      showToast('Like agregado')
    }
  })

  document.querySelectorAll('.comment-btn').forEach((btn) => {
    btn.onclick = () => openComments(Number(btn.dataset.id))
  })
}

function openComments(postId) {
  activeCommentsPost = state.posts.find((p) => p.id === postId)
  commentsList.innerHTML = activeCommentsPost.comments.length
    ? activeCommentsPost.comments.map((comment) => `
      <div class="comment-item">
        <strong>${comment.user}</strong>
        <span>${comment.text}</span>
      </div>
    `).join('')
    : '<div class="comment-item"><strong>Loop</strong><span>Sin comentarios todavía.</span></div>'

  openSheet('commentsSheet')
}

function publishNewPost() {
  const user = document.getElementById('creatorUser').value.trim() || state.profile.username
  const title = document.getElementById('creatorTitle').value.trim() || 'Nuevo contenido'
  const caption = document.getElementById('creatorCaption').value.trim() || 'Acabo de publicar en Loop'
  const label = selectedCreateType.toUpperCase()

  const gradients = {
    post: 'linear-gradient(135deg,#0f766e,#06b6d4)',
    reto: 'linear-gradient(135deg,#7c2d12,#f97316)',
    respuesta: 'linear-gradient(135deg,#4c1d95,#a855f7)',
  }

  state.posts.unshift({
    id: Date.now(),
    user,
    avatar: user.replace('@', '').charAt(0).toUpperCase() || 'L',
    type: label,
    title,
    caption,
    meta: 'Publicado ahora mismo',
    likes: 0,
    bg: gradients[selectedCreateType],
    comments: [],
  })

  state.profile.points += 10
  save()
  renderFeed()
  renderProfileStats()
  renderLeaderboard()
  closeSheet('createSheet')
  document.getElementById('creatorTitle').value = ''
  document.getElementById('creatorCaption').value = ''
  showToast('Publicado. +10 puntos')
}

function setScreen(screen) {
  document.querySelectorAll('.screen').forEach((node) => node.classList.remove('active'))
  document.querySelectorAll('.nav-btn').forEach((node) => node.classList.remove('active'))

  const screenMap = {
    home: 'homeScreen',
    leaderboard: 'leaderboardScreen',
  }

  if (screen === 'create') return openSheet('createSheet')
  if (screen === 'profile') return openSheet('profileSheet')

  document.getElementById(screenMap[screen] || 'homeScreen').classList.add('active')
  document.querySelector(`.nav-btn[data-screen="${screen}"]`)?.classList.add('active')
}

function bindGlobalActions() {
  document.getElementById('openCreateTop').onclick = () => openSheet('createSheet')
  document.getElementById('openProfileTop').onclick = () => openSheet('profileSheet')
  document.getElementById('publishBtn').onclick = publishNewPost
  document.getElementById('sendComment').onclick = () => {
    const text = commentInput.value.trim()
    if (!text || !activeCommentsPost) return
    activeCommentsPost.comments.push({ user: state.profile.username, text })
    commentInput.value = ''
    save()
    openComments(activeCommentsPost.id)
    showToast('Comentario enviado')
  }
  document.getElementById('openLeaderboardFromProfile').onclick = () => {
    closeSheet('profileSheet')
    setScreen('leaderboard')
  }

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.onclick = () => setScreen(btn.dataset.screen)
  })

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.onclick = () => closeSheet(btn.dataset.close)
  })

  document.querySelectorAll('[data-create-type]').forEach((btn) => {
    btn.onclick = () => {
      selectedCreateType = btn.dataset.createType
      document.querySelectorAll('[data-create-type]').forEach((node) => node.classList.remove('selected'))
      btn.classList.add('selected')
    }
  })

  overlay.onclick = () => {
    document.querySelectorAll('.sheet').forEach((sheet) => sheet.classList.add('hidden'))
    overlay.classList.add('hidden')
  }
}

function init() {
  renderFeaturedBattle()
  renderFeed()
  renderProfileStats()
  renderLeaderboard()
  bindGlobalActions()

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}))
  }
}

init()
