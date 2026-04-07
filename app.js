const STORAGE_KEY = 'loop_mvp_data_v1';

const seedData = {
  posts: [
    {
      id: crypto.randomUUID(),
      type: 'challenge',
      user: '@alexloop',
      avatar: 'A',
      title: 'Show your reaction in 5 seconds',
      description: 'Record your first reaction when your favorite song starts. Keep it real and raw.',
      category: 'Reaction',
      tags: ['music', 'reaction', 'real-time'],
      likes: 182,
      comments: [
        { user: '@mia', text: 'This one is hilarious 😂' },
        { user: '@jay', text: 'Doing this tonight.' }
      ],
      createdAt: Date.now() - 1000 * 60 * 45,
      mine: false,
    },
    {
      id: crypto.randomUUID(),
      type: 'vs',
      user: '@mialive',
      avatar: 'M',
      title: 'Dance face-off: old school vs new school',
      description: 'Vote for the best style. Winner gets featured on the top rail tonight.',
      category: 'Dance',
      tags: ['vs', 'dance', 'battle'],
      likes: 241,
      comments: [
        { user: '@rio', text: 'Mia cleared 😮‍💨' }
      ],
      createdAt: Date.now() - 1000 * 60 * 120,
      mine: false,
    },
    {
      id: crypto.randomUUID(),
      type: 'live',
      user: '@loopteam',
      avatar: 'L',
      title: 'LIVE VS Tonight: Alex vs Mia',
      description: 'Split-screen battle live now. Vote inside the arena and drop your reactions in chat.',
      category: 'Live',
      tags: ['live', 'vs', 'battle'],
      likes: 94,
      comments: [
        { user: '@kevin', text: 'The app feels crazy with live battles 🔥' }
      ],
      createdAt: Date.now() - 1000 * 60 * 15,
      mine: false,
    },
  ],
  liveVotes: { left: 124, right: 119 },
  liveChat: [
    { user: '@loopbot', text: 'Live battle started.' },
    { user: '@sofia', text: 'Alex got this 🔥' },
    { user: '@niko', text: 'Mia is going crazy wow' },
  ],
};

let state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : structuredClone(seedData);
  } catch {
    return structuredClone(seedData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const els = {
  navBtns: [...document.querySelectorAll('.nav-btn')],
  views: {
    feed: document.getElementById('feedView'),
    create: document.getElementById('createView'),
    live: document.getElementById('liveView'),
    profile: document.getElementById('profileView'),
  },
  viewTitle: document.getElementById('viewTitle'),
  viewSubtitle: document.getElementById('viewSubtitle'),
  feedList: document.getElementById('feedList'),
  postTemplate: document.getElementById('postTemplate'),
  filterType: document.getElementById('filterType'),
  sortBy: document.getElementById('sortBy'),
  searchInput: document.getElementById('searchInput'),
  challengeForm: document.getElementById('challengeForm'),
  vsForm: document.getElementById('vsForm'),
  profilePosts: document.getElementById('profilePosts'),
  statPosts: document.getElementById('statPosts'),
  statLikes: document.getElementById('statLikes'),
  statComments: document.getElementById('statComments'),
  leftVotes: document.getElementById('leftVotes'),
  rightVotes: document.getElementById('rightVotes'),
  voteLeftBtn: document.getElementById('voteLeftBtn'),
  voteRightBtn: document.getElementById('voteRightBtn'),
  liveChat: document.getElementById('liveChat'),
  chatForm: document.getElementById('chatForm'),
  chatInput: document.getElementById('chatInput'),
  resetDataBtn: document.getElementById('resetDataBtn')
};

const viewMeta = {
  feed: ['Trending Feed', 'Challenges, VS battles and real-time reactions.'],
  create: ['Create', 'Launch a challenge or start a VS battle.'],
  live: ['Live VS Arena', 'Vote, comment and watch battles in real time.'],
  profile: ['Profile', 'Your stats, streak and recent posts.'],
};

els.navBtns.forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

function switchView(view) {
  els.navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
  Object.entries(els.views).forEach(([key, el]) => el.classList.toggle('active', key === view));
  els.viewTitle.textContent = viewMeta[view][0];
  els.viewSubtitle.textContent = viewMeta[view][1];
}

function renderFeed() {
  const type = els.filterType.value;
  const sortBy = els.sortBy.value;
  const q = els.searchInput.value.trim().toLowerCase();
  let posts = [...state.posts];

  if (type !== 'all') posts = posts.filter(post => post.type === type);
  if (q) {
    posts = posts.filter(post =>
      [post.title, post.description, post.user, ...(post.tags || [])].join(' ').toLowerCase().includes(q)
    );
  }

  posts.sort((a, b) => {
    if (sortBy === 'likes') return b.likes - a.likes;
    if (sortBy === 'comments') return b.comments.length - a.comments.length;
    return b.createdAt - a.createdAt;
  });

  els.feedList.innerHTML = '';

  posts.forEach(post => {
    const node = els.postTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('.avatar').textContent = post.avatar;
    node.querySelector('.post-user').textContent = post.user;
    node.querySelector('.post-meta').textContent = `${post.category} • ${timeAgo(post.createdAt)}`;
    node.querySelector('.type-badge').textContent = labelForType(post.type);
    node.querySelector('.post-title').textContent = post.title;
    node.querySelector('.post-description').textContent = post.description;

    const tagsWrap = node.querySelector('.tags');
    (post.tags || []).forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'tag';
      chip.textContent = `#${tag}`;
      tagsWrap.appendChild(chip);
    });

    const likeBtn = node.querySelector('.like-btn');
    likeBtn.querySelector('span').textContent = post.likes;
    likeBtn.addEventListener('click', () => {
      post.likes += 1;
      saveState();
      renderFeed();
      renderProfile();
    });

    const commentToggleBtn = node.querySelector('.comment-toggle-btn');
    commentToggleBtn.querySelector('span').textContent = post.comments.length;
    const commentsSection = node.querySelector('.comments-section');
    commentToggleBtn.addEventListener('click', () => {
      commentsSection.classList.toggle('hidden');
    });

    const commentList = node.querySelector('.comment-list');
    post.comments.forEach(comment => {
      const div = document.createElement('div');
      div.className = 'comment-item';
      div.innerHTML = `<strong>${comment.user}</strong><span>${comment.text}</span>`;
      commentList.appendChild(div);
    });

    const commentForm = node.querySelector('.comment-form');
    commentForm.addEventListener('submit', e => {
      e.preventDefault();
      const input = commentForm.querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      post.comments.unshift({ user: '@kevinloop', text });
      input.value = '';
      saveState();
      renderFeed();
      renderProfile();
    });

    node.querySelector('.vs-btn').addEventListener('click', () => {
      alert(`VS launched from: ${post.title}\n\nIn the full app this would open a battle invite flow.`);
    });

    node.querySelector('.challenge-btn').addEventListener('click', () => {
      alert(`Challenge accepted: ${post.title}\n\nIn the full app this would open camera + timer.`);
    });

    els.feedList.appendChild(node);
  });
}

function renderProfile() {
  const myPosts = state.posts.filter(post => post.mine);
  els.statPosts.textContent = myPosts.length;
  els.statLikes.textContent = myPosts.reduce((sum, post) => sum + post.likes, 0);
  els.statComments.textContent = myPosts.reduce((sum, post) => sum + post.comments.length, 0);

  els.profilePosts.innerHTML = '';
  if (!myPosts.length) {
    els.profilePosts.innerHTML = '<div class="mini-post">You have no posts yet. Create your first challenge.</div>';
    return;
  }
  myPosts.sort((a, b) => b.createdAt - a.createdAt).slice(0, 6).forEach(post => {
    const item = document.createElement('div');
    item.className = 'mini-post';
    item.innerHTML = `<strong>${post.title}</strong><div>${labelForType(post.type)} • ❤️ ${post.likes} • 💬 ${post.comments.length}</div>`;
    els.profilePosts.appendChild(item);
  });
}

function labelForType(type) {
  if (type === 'challenge') return 'Challenge';
  if (type === 'vs') return 'VS';
  return 'Live';
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

els.filterType.addEventListener('change', renderFeed);
els.sortBy.addEventListener('change', renderFeed);
els.searchInput.addEventListener('input', renderFeed);

els.challengeForm.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(els.challengeForm);
  const post = {
    id: crypto.randomUUID(),
    type: 'challenge',
    user: '@kevinloop',
    avatar: 'K',
    title: fd.get('title').trim(),
    description: fd.get('description').trim(),
    category: fd.get('category'),
    tags: String(fd.get('tags') || '').split(',').map(tag => tag.trim()).filter(Boolean),
    likes: 0,
    comments: [],
    createdAt: Date.now(),
    mine: true,
    duration: Number(fd.get('duration')),
  };
  state.posts.unshift(post);
  saveState();
  els.challengeForm.reset();
  switchView('feed');
  renderFeed();
  renderProfile();
});

els.vsForm.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(els.vsForm);
  const mode = fd.get('mode');
  const post = {
    id: crypto.randomUUID(),
    type: mode === 'live' ? 'live' : 'vs',
    user: '@kevinloop',
    avatar: 'K',
    title: fd.get('title').trim(),
    description: `${fd.get('description').trim()} Opponent: @${String(fd.get('opponent')).replace('@','')}`,
    category: fd.get('category'),
    tags: ['vs', mode === 'live' ? 'live' : 'recorded'],
    likes: 0,
    comments: [],
    createdAt: Date.now(),
    mine: true,
  };
  state.posts.unshift(post);
  saveState();
  els.vsForm.reset();
  switchView(mode === 'live' ? 'live' : 'feed');
  renderFeed();
  renderProfile();
});

function renderLiveChat() {
  els.liveChat.innerHTML = '';
  state.liveChat.forEach(line => {
    const div = document.createElement('div');
    div.className = 'chat-line';
    div.innerHTML = `<strong>${line.user}</strong><span>${line.text}</span>`;
    els.liveChat.appendChild(div);
  });
  els.liveChat.scrollTop = els.liveChat.scrollHeight;
  els.leftVotes.textContent = state.liveVotes.left;
  els.rightVotes.textContent = state.liveVotes.right;
}

els.chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = els.chatInput.value.trim();
  if (!text) return;
  state.liveChat.push({ user: '@kevinloop', text });
  els.chatInput.value = '';
  saveState();
  renderLiveChat();
});

els.voteLeftBtn.addEventListener('click', () => {
  state.liveVotes.left += 1;
  state.liveChat.push({ user: '@loopbot', text: '@kevinloop voted for Alex' });
  saveState();
  renderLiveChat();
});

els.voteRightBtn.addEventListener('click', () => {
  state.liveVotes.right += 1;
  state.liveChat.push({ user: '@loopbot', text: '@kevinloop voted for Mia' });
  saveState();
  renderLiveChat();
});

els.resetDataBtn.addEventListener('click', () => {
  if (!confirm('Reset demo data and restore the original Loop feed?')) return;
  state = structuredClone(seedData);
  saveState();
  renderAll();
});

function renderAll() {
  renderFeed();
  renderProfile();
  renderLiveChat();
}

renderAll();


let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('installBanner');
  if (banner) banner.classList.remove('hidden');
});

document.getElementById('installBtn')?.addEventListener('click', async () => {
  if (!deferredPrompt) {
    alert('On iPhone: open in Safari, tap Share, then "Add to Home Screen".');
    return;
  }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('installBanner')?.classList.add('hidden');
});

document.getElementById('closeInstallBtn')?.addEventListener('click', () => {
  document.getElementById('installBanner')?.classList.add('hidden');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  });
}
