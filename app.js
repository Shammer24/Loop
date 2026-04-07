const STORAGE_KEY = 'loop_complete_state_v1';
const DEFAULT_STATE = {
  currentUser: null,
  users: [
    { id:'u1', username:'loopking', emoji:'😎', bio:'Retos. VS. Momentum.', followers:4221, following:183, streak:14 },
    { id:'u2', username:'lunaflow', emoji:'🌙', bio:'Creative + funny challenges', followers:2190, following:210, streak:8 },
    { id:'u3', username:'fitnova', emoji:'💪', bio:'Fitness battles only', followers:5340, following:90, streak:31 },
  ],
  posts: [
    { id:'p1', userId:'u1', title:'Smile Challenge', caption:'Smile at someone and record the reaction right now.', emoji:'😄', type:'challenge', category:'social', likes:322, comments:[{u:'luna', t:'this one is hard 😂'}], createdAt:Date.now()-100000 },
    { id:'p2', userId:'u2', title:'Song Reaction', caption:'Your face when your favorite song drops.', emoji:'🎶', type:'response', category:'funny', likes:189, comments:[{u:'fitnova', t:'nah this was clean'}], createdAt:Date.now()-70000 },
    { id:'p3', userId:'u3', title:'Pushup VS', caption:'10 pushups in perfect form. Who wins?', emoji:'🔥', type:'vs', category:'fitness', likes:411, comments:[{u:'loopking', t:'I got the rematch'}], createdAt:Date.now()-35000 },
  ],
  challenges: [
    { id:'c1', title:'Laugh in public', description:'Try not to laugh while making eye contact for 5 seconds.', category:'social', creatorId:'u1', participants:26 },
    { id:'c2', title:'One line freestyle', description:'Drop one hard line with confidence.', category:'talent', creatorId:'u2', participants:18 },
  ],
  notifications: [
    { id:'n1', text:'fitnova liked your post', time:'2m' },
    { id:'n2', text:'lunaflow challenged you to Song Reaction', time:'18m' },
  ],
  lives: [
    { id:'l1', left:'loopking', right:'fitnova', leftEmoji:'😎', rightEmoji:'💪', title:'Pushup VS LIVE', leftVotes:81, rightVotes:94, chat:['luna: nah this is close', 'nova: left side slowing down'] }
  ]
};

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : structuredClone(DEFAULT_STATE);
  } catch { return structuredClone(DEFAULT_STATE); }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
let state = loadState();

const app = document.getElementById('app');
let activeTab = 'home';
let currentCommentsPost = null;
let currentFilter = 'all';
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  render();
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}

function getUser(id){ return state.users.find(u=>u.id===id); }
function getCurrentUser(){ return state.currentUser ? getUser(state.currentUser) : null; }
function humanTime(ts){ const min = Math.max(1, Math.round((Date.now()-ts)/60000)); return min < 60 ? `${min}m` : `${Math.round(min/60)}h`; }
function showToast(text){
  let t = document.querySelector('.toast');
  if(!t){ t = document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
  t.textContent = text; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800);
}
function ensureAuth(){ if(!state.currentUser){ activeTab='auth'; render(); return false; } return true; }
function upsertNotification(text){ state.notifications.unshift({ id:`n${Date.now()}`, text, time:'now' }); saveState(); }

function loginDemo(username){
  let user = state.users.find(u=>u.username.toLowerCase()===username.toLowerCase());
  if(!user){
    user = { id:`u${Date.now()}`, username, emoji:'🌀', bio:'Ready to loop.', followers:0, following:0, streak:1 };
    state.users.unshift(user);
  }
  state.currentUser = user.id; saveState(); activeTab='home'; render(); showToast(`Welcome, ${user.username}`);
}
function logout(){ state.currentUser = null; saveState(); activeTab='auth'; render(); }
function createPost(form){
  if(!ensureAuth()) return;
  const user = getCurrentUser();
  const post = {
    id:`p${Date.now()}`,
    userId:user.id,
    title:form.title || 'New Challenge',
    caption:form.caption || '',
    emoji:form.emoji || '🎥',
    type:form.type,
    category:form.category,
    likes:0,
    comments:[],
    createdAt:Date.now()
  };
  state.posts.unshift(post);
  if(form.type === 'challenge'){
    state.challenges.unshift({ id:`c${Date.now()}`, title:form.title, description:form.caption, category:form.category, creatorId:user.id, participants:1 });
  }
  user.streak += 1;
  upsertNotification(`Your ${form.type} was posted`);
  saveState(); activeTab='home'; render(); showToast('Posted to Loop');
}
function toggleLike(postId){
  const post = state.posts.find(p=>p.id===postId); if(!post) return;
  post.likes += 1; saveState(); render();
}
function addComment(postId, text){
  if(!text.trim()) return;
  const post = state.posts.find(p=>p.id===postId); if(!post) return;
  const user = getCurrentUser();
  post.comments.push({ u:user?.username || 'guest', t:text.trim() });
  saveState(); render(); showToast('Comment added');
}
function createLiveVote(side){
  const live = state.lives[0]; if(!live) return;
  side === 'left' ? live.leftVotes++ : live.rightVotes++;
  saveState(); render(); showToast('Vote counted');
}

function topHeader(title, right = `<button class="icon-btn" onclick="activeTab='notifications';render()">🔔</button>`){
  const user = getCurrentUser();
  return `
    <div class="header">
      <div class="brand"><div class="brand-badge">∞</div><span>${title}</span></div>
      <div class="row">
        ${user ? `<button class="icon-btn" onclick="activeTab='profile';render()">${user.emoji}</button>` : ''}
        ${right}
      </div>
    </div>`;
}

function installBanner(){
  return deferredPrompt ? `
    <div class="install-banner">
      <div>
        <strong>Install Loop</strong>
        <div class="tiny muted">Add it to your home screen like a real app.</div>
      </div>
      <button class="action-btn primary" style="flex:unset;padding:0 16px" onclick="installApp()">Install</button>
    </div>` : '';
}
window.installApp = async function(){
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  render();
}

function renderStories(){
  return `<div class="stories">${state.users.slice(0,6).map(u=>`
    <div class="story">
      <div class="story-ring"><div class="story-inner">${u.emoji}</div></div>
      <div class="tiny" style="margin-top:6px">${u.username}</div>
    </div>`).join('')}</div>`;
}

function renderPost(post){
  const user = getUser(post.userId);
  return `
    <div class="card post-card">
      <div class="post-head">
        <div class="user">
          <div class="avatar">${user?.emoji || '👤'}</div>
          <div class="user-meta">
            <strong>@${user?.username || 'unknown'}</strong>
            <span class="muted tiny">${humanTime(post.createdAt)} • ${post.category}</span>
          </div>
        </div>
        <div class="pill ${post.type==='vs'?'live':''}">${post.type.toUpperCase()}</div>
      </div>
      <div class="video">
        <div class="video-label">${post.category} • Loop</div>
        <div class="video-center">${post.emoji}</div>
        <div class="video-bottom">
          <div class="video-copy">
            <h4>${post.title}</h4>
            <p>${post.caption}</p>
          </div>
          <div class="stat-stack">
            <div class="stat" onclick="toggleLike('${post.id}')">❤️<small>${post.likes}</small></div>
            <div class="stat" onclick="openComments('${post.id}')">💬<small>${post.comments.length}</small></div>
            <div class="stat" onclick="showToast('Challenge sent')">⚔️<small>Retar</small></div>
          </div>
        </div>
      </div>
      <div class="post-foot">
        <div class="chips">
          <div class="chip">#${post.category}</div>
          <div class="chip">@${user?.username}</div>
          <div class="chip">Loop original</div>
        </div>
      </div>
    </div>`;
}

function renderHome(){
  const posts = currentFilter === 'all' ? state.posts : state.posts.filter(p=>p.type===currentFilter);
  return `
    <div class="app-shell">
      ${topHeader('Loop')}
      ${installBanner()}
      ${renderStories()}
      <div class="section tabbar" style="margin-top:14px">
        ${['all','challenge','response','vs'].map(f=>`<button class="tab ${currentFilter===f?'active':''}" onclick="currentFilter='${f}';render()">${f==='all'?'For You':f.toUpperCase()}</button>`).join('')}
      </div>
      <div class="feed">${posts.map(renderPost).join('')}</div>
    </div>`;
}

function renderCreate(){
  if(!ensureAuth()) return renderAuth();
  return `
    <div class="app-shell">
      ${topHeader('Create', `<button class="icon-btn" onclick="showToast('Draft saved')">💾</button>`)}
      <div class="card panel">
        <div class="screen-title">Post to Loop</div>
        <form class="form" onsubmit="submitCreate(event)">
          <div>
            <div class="label">Type</div>
            <select class="select" name="type">
              <option value="challenge">Challenge</option>
              <option value="response">Response</option>
              <option value="vs">VS</option>
            </select>
          </div>
          <div>
            <div class="label">Title</div>
            <input class="input" name="title" placeholder="Ex: Song Reaction" required />
          </div>
          <div class="grid2">
            <div>
              <div class="label">Category</div>
              <select class="select" name="category">
                <option>social</option>
                <option>funny</option>
                <option>fitness</option>
                <option>talent</option>
                <option>creative</option>
              </select>
            </div>
            <div>
              <div class="label">Emoji cover</div>
              <input class="input" name="emoji" placeholder="🔥" maxlength="2" />
            </div>
          </div>
          <div>
            <div class="label">Caption / Rules</div>
            <textarea class="textarea" name="caption" placeholder="Say what the challenge is and how people win."></textarea>
          </div>
          <button class="action-btn primary" type="submit">Post to Loop</button>
          <div class="note">This complete version works with local storage on your phone. Real accounts, video upload and live streaming would be the next build.</div>
        </form>
      </div>
    </div>`;
}
window.submitCreate = function(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  createPost(Object.fromEntries(fd.entries()));
}

function renderNotifications(){
  return `
    <div class="app-shell">
      ${topHeader('Activity', `<button class="icon-btn" onclick="showToast('All caught up')">✓</button>`)}
      <div class="screen-title">Notifications</div>
      <div class="list">${state.notifications.map(n=>`<div class="list-item"><div class="row between"><strong>${n.text}</strong><span class="muted tiny">${n.time}</span></div></div>`).join('')}</div>
      <div class="card panel section">
        <div class="row between"><strong>Live VS Arena</strong><span class="badge">LIVE NOW</span></div>
        ${renderLiveArena()}
      </div>
    </div>`;
}

function renderLiveArena(){
  const live = state.lives[0];
  if(!live) return '<div class="empty">No live battle right now.</div>';
  return `
    <div class="section">
      <div class="live-arena">
        <div class="arena-side"><div class="arena-video">${live.leftEmoji}</div><div class="arena-foot"><strong>@${live.left}</strong><div class="muted tiny">${live.leftVotes} votes</div></div></div>
        <div class="arena-side"><div class="arena-video">${live.rightEmoji}</div><div class="arena-foot"><strong>@${live.right}</strong><div class="muted tiny">${live.rightVotes} votes</div></div></div>
      </div>
      <div class="vote-row"><button class="vote" onclick="createLiveVote('left')">Vote @${live.left}</button><button class="vote" onclick="createLiveVote('right')">Vote @${live.right}</button></div>
      <div class="list" style="margin-top:12px">${live.chat.map(msg=>`<div class="list-item tiny">${msg}</div>`).join('')}</div>
    </div>`;
}

function renderProfile(){
  if(!ensureAuth()) return renderAuth();
  const user = getCurrentUser();
  const userPosts = state.posts.filter(p=>p.userId===user.id);
  return `
    <div class="app-shell">
      ${topHeader('Profile', `<button class="icon-btn" onclick="logout()">↩️</button>`)}
      <div class="profile-header">
        <div class="avatar big">${user.emoji}</div>
        <div>
          <div class="screen-title" style="margin:0">@${user.username}</div>
          <div class="muted">${user.bio}</div>
        </div>
      </div>
      <div class="kpi-grid">
        <div class="kpi"><strong>${user.followers}</strong><span>Followers</span></div>
        <div class="kpi"><strong>${user.following}</strong><span>Following</span></div>
        <div class="kpi"><strong>${user.streak}</strong><span>Streak</span></div>
      </div>
      <div class="profile-actions">
        <button class="action-btn" onclick="editProfile()">Edit profile</button>
        <button class="action-btn blue" onclick="showToast('Share link copied')">Share profile</button>
      </div>
      <div class="section row between"><strong>Your posts</strong><span class="muted tiny">${userPosts.length} total</span></div>
      <div class="feed">${userPosts.length ? userPosts.map(renderPost).join('') : '<div class="card panel empty">Your first Loop post is waiting.</div>'}</div>
    </div>`;
}
window.editProfile = function(){
  const user = getCurrentUser(); if(!user) return;
  const bio = prompt('Edit your bio', user.bio); if(bio === null) return;
  user.bio = bio; saveState(); render();
}

function renderComments(){
  const post = state.posts.find(p=>p.id===currentCommentsPost);
  if(!post) { activeTab='home'; return renderHome(); }
  return `
    <div class="app-shell">
      ${topHeader('Comments', `<button class="icon-btn" onclick="activeTab='home';render()">✕</button>`)}
      <div class="card panel">
        <strong>${post.title}</strong>
        <div class="muted" style="margin-top:4px">${post.caption}</div>
        <div class="section">
          ${post.comments.length ? post.comments.map(c=>`<div class="comment"><strong>@${c.u}</strong><div class="muted">${c.t}</div></div>`).join('') : '<div class="empty">No comments yet.</div>'}
        </div>
        <form class="form" onsubmit="submitComment(event,'${post.id}')">
          <input class="input" name="comment" placeholder="Say something..." />
          <button class="action-btn primary" type="submit">Comment</button>
        </form>
      </div>
    </div>`;
}
window.openComments = function(postId){ currentCommentsPost = postId; activeTab='comments'; render(); }
window.submitComment = function(e, postId){ e.preventDefault(); if(!ensureAuth()) return; const txt = new FormData(e.target).get('comment'); addComment(postId, txt); }

function renderAuth(){
  return `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="brand"><div class="brand-badge">∞</div><span>Loop</span></div>
        <div class="hero">
          <h1>Real-time challenges.<br/>Real attention.</h1>
          <p>Create your profile in seconds and start posting to your own Loop universe from your phone.</p>
        </div>
        <form class="form" onsubmit="submitLogin(event)">
          <div>
            <div class="label">Username</div>
            <input class="input" name="username" placeholder="Choose your @name" required />
          </div>
          <button class="action-btn primary" type="submit">Enter Loop</button>
          <button class="action-btn" type="button" onclick="quickLogin('loopking')">Demo as @loopking</button>
          <div class="note">This is a complete phone-ready prototype with local accounts on your device. Real cloud accounts can be added later.</div>
        </form>
      </div>
    </div>`;
}
window.submitLogin = function(e){ e.preventDefault(); const username = new FormData(e.target).get('username').trim(); if(username) loginDemo(username); }
window.quickLogin = function(username){ loginDemo(username); }

function renderBottomNav(){
  if(activeTab === 'auth') return '';
  return `
    <div class="bottom-nav">
      <button class="nav-btn ${activeTab==='home'?'active':''}" onclick="activeTab='home';render()">🏠<span>Home</span></button>
      <button class="nav-btn ${activeTab==='notifications'?'active':''}" onclick="activeTab='notifications';render()">🔔<span>Activity</span></button>
      <button class="nav-btn create" onclick="activeTab='create';render()">＋<span>Create</span></button>
      <button class="nav-btn ${activeTab==='profile'?'active':''}" onclick="activeTab='profile';render()">👤<span>Profile</span></button>
      <button class="nav-btn" onclick="showToast('Search coming next')">🔎<span>Explore</span></button>
    </div>`;
}

function render(){
  let html = '';
  switch(activeTab){
    case 'home': html = renderHome(); break;
    case 'create': html = renderCreate(); break;
    case 'notifications': html = renderNotifications(); break;
    case 'profile': html = renderProfile(); break;
    case 'comments': html = renderComments(); break;
    case 'auth': html = renderAuth(); break;
    default: html = renderHome();
  }
  app.innerHTML = html + renderBottomNav();
}

render();
