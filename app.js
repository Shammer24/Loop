const STORAGE_KEY = 'loop_tiktok_upgrade_v1';
const DEFAULT_STATE = {
  currentUser: { username:'Shammer24', emoji:'😎', bio:'Founder mode activated.', followers:128, following:47, streak:9 },
  posts: [
    { id:'p1', username:'loopking', emoji:'😄', title:'Smile Challenge', caption:'Smile at a stranger and capture the reaction right now.', type:'challenge', category:'social', likes:322, comments:[{u:'lunaflow', t:'this is actually hard 😂'}], accent1:'#ff4f8b' },
    { id:'p2', username:'lunaflow', emoji:'🎤', title:'One-line freestyle', caption:'Drop one line with confidence. No overthinking.', type:'response', category:'talent', likes:281, comments:[{u:'fitnova', t:'nah this one was smooth'}], accent1:'#6a7cff' },
    { id:'p3', username:'fitnova', emoji:'🔥', title:'Pushup VS', caption:'10 strict pushups. Tag somebody that thinks they can beat you.', type:'vs', category:'fitness', likes:490, comments:[{u:'loopking', t:'rematch tonight'}], accent1:'#ff8c4d' }
  ],
  notifications:[
    {text:'fitnova liked your post',time:'2m'},
    {text:'lunaflow challenged you to a VS',time:'18m'}
  ],
  live:{left:'loopking',right:'fitnova',leftEmoji:'😎',rightEmoji:'💪',leftVotes:81,rightVotes:94,title:'Pushup VS LIVE',chat:['luna: this is close','nova: left side slowing down']}
};
let state = loadState();
let view = 'feed';
let currentComments = null;
let deferredPrompt = null;
const app = document.getElementById('app');

function loadState(){ try{ const raw=localStorage.getItem(STORAGE_KEY); return raw?JSON.parse(raw):structuredClone(DEFAULT_STATE);}catch{return structuredClone(DEFAULT_STATE);} }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function toast(text){ let el=document.querySelector('.toast'); if(!el){el=document.createElement('div');el.className='toast';document.body.appendChild(el);} el.textContent=text; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1600); }
function installBanner(){ return deferredPrompt ? `<div class="install-banner"><div><strong>Install Loop</strong><div class="small">Add it to your home screen for a real app feel.</div></div><button class="secondary-btn" style="width:auto;padding:0 16px;height:42px" onclick="installApp()">Install</button></div>` : ''; }
window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault(); deferredPrompt=e; render();});
if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
window.installApp = async function(){ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; render(); }

function topbar(){
  return `
    <div class="topbar">
      <div class="brand"><div class="logo">L</div><span>Loop</span></div>
      <div class="top-actions">
        <button class="icon-btn" onclick="openNotifications()">🔔</button>
        <button class="icon-btn" onclick="openProfile()">${state.currentUser.emoji}</button>
      </div>
    </div>`;
}

function renderFeed(){
  return `
    <div class="feed-wrap">
      ${state.posts.map(post=>`
        <section class="feed-card" style="--accent1:${post.accent1}">
          <div class="feed-emoji">${post.emoji}</div>
          <div class="feed-copy">
            <div class="type-pill">${post.type.toUpperCase()} • ${post.category}</div>
            <div class="handle">@${post.username}</div>
            <h2 class="title">${post.title}</h2>
            <p class="caption">${post.caption}</p>
            <div class="tags">
              <div class="tag">#${post.category}</div>
              <div class="tag">#LoopChallenge</div>
              <div class="tag">Reta a otro</div>
            </div>
          </div>
          <div class="side-actions">
            <div class="side-item"><button class="side-circle" onclick="likePost('${post.id}')">❤️</button><div class="side-label">${post.likes}</div></div>
            <div class="side-item"><button class="side-circle" onclick="openComments('${post.id}')">💬</button><div class="side-label">${post.comments.length}</div></div>
            <div class="side-item"><button class="side-circle" onclick="openCreate('${post.type==='vs'?'vs':'challenge'}')">⚔️</button><div class="side-label">Retar</div></div>
            <div class="side-item"><button class="side-circle" onclick="toast('Shared')">↗️</button><div class="side-label">Share</div></div>
          </div>
        </section>`).join('')}
    </div>`;
}

function bottomNav(){
  return `
    <div class="bottom-nav">
      <button class="nav-btn ${view==='feed'?'active':''}" onclick="view='feed';render()">🏠<span>Feed</span></button>
      <button class="nav-btn" onclick="openCreate('challenge')">🎯<span>Create</span></button>
      <button class="nav-btn primary" onclick="openLive()">🆚<span>LIVE</span></button>
      <button class="nav-btn" onclick="openNotifications()">🔔<span>Activity</span></button>
      <button class="nav-btn" onclick="openProfile()">👤<span>Profile</span></button>
    </div>`;
}

function commentsSheet(){
  if(!currentComments) return '';
  const post = state.posts.find(p=>p.id===currentComments);
  return `
    <div class="comments-sheet show">
      <div class="backdrop" onclick="closeComments()"></div>
      <div class="drawer-panel">
        <div class="sheet-title">Comments</div>
        <div class="small-note" style="margin-top:-6px;margin-bottom:10px">${post.title}</div>
        <div class="comment-list">
          ${post.comments.map(c=>`<div class="comment-item"><div class="comment-user">@${c.u}</div><div>${c.t}</div></div>`).join('') || '<div class="comment-item">No comments yet.</div>'}
        </div>
        <div class="comment-input-row">
          <input id="commentInput" class="input" placeholder="Say something..." />
          <button class="secondary-btn" style="width:90px" onclick="addComment('${post.id}')">Send</button>
        </div>
      </div>
    </div>`;
}

function createModal(){
  return `
    <div class="modal" id="createModal">
      <div class="backdrop" onclick="closeCreate()"></div>
      <div class="modal-card">
        <div class="sheet-title">Create Loop</div>
        <form onsubmit="submitCreate(event)">
          <div class="field"><label class="label">Type</label><select id="createType" class="select"><option value="challenge">Challenge</option><option value="response">Response</option><option value="vs">VS</option></select></div>
          <div class="field"><label class="label">Title</label><input id="createTitle" class="input" placeholder="Ex: Song Reaction" required /></div>
          <div class="grid2">
            <div class="field"><label class="label">Category</label><select id="createCategory" class="select"><option>social</option><option>funny</option><option>talent</option><option>fitness</option><option>creative</option></select></div>
            <div class="field"><label class="label">Emoji</label><input id="createEmoji" class="input" value="🔥" maxlength="2" /></div>
          </div>
          <div class="field"><label class="label">Caption</label><textarea id="createCaption" class="textarea" placeholder="Tell the challenge story."></textarea></div>
          <button class="action-btn" type="submit">Post</button>
        </form>
      </div>
    </div>`;
}

function profileDrawer(){
  return `
    <div class="drawer" id="profileDrawer">
      <div class="backdrop" onclick="closeProfile()"></div>
      <div class="drawer-panel">
        <div class="sheet-title">Profile</div>
        <div class="profile-panel">
          <div class="profile-card">
            <div class="profile-head">
              <div class="avatar">${state.currentUser.emoji}</div>
              <div>
                <div style="font-size:24px;font-weight:900">@${state.currentUser.username}</div>
                <div class="small-note">${state.currentUser.bio}</div>
              </div>
            </div>
            <div class="stats">
              <div class="stat"><strong>${state.currentUser.followers}</strong><span>Followers</span></div>
              <div class="stat"><strong>${state.currentUser.following}</strong><span>Following</span></div>
              <div class="stat"><strong>${state.currentUser.streak}</strong><span>Streak</span></div>
            </div>
          </div>
          <div class="profile-card">
            <div class="sheet-title" style="font-size:22px;margin-bottom:10px">Edit profile</div>
            <div class="field"><label class="label">Username</label><input id="profileName" class="input" value="${state.currentUser.username}" /></div>
            <div class="field"><label class="label">Bio</label><textarea id="profileBio" class="textarea">${state.currentUser.bio}</textarea></div>
            <button class="action-btn" onclick="saveProfile()">Save profile</button>
          </div>
        </div>
      </div>
    </div>`;
}

function notificationsDrawer(){
  return `
    <div class="drawer" id="notificationsDrawer">
      <div class="backdrop" onclick="closeNotifications()"></div>
      <div class="drawer-panel">
        <div class="sheet-title">Activity</div>
        ${state.notifications.map(n=>`<div class="comment-item" style="margin-bottom:10px"><div class="comment-user">Loop</div><div>${n.text}</div><div class="small-note" style="margin-top:6px">${n.time}</div></div>`).join('')}
      </div>
    </div>`;
}

function liveDrawer(){
  const live = state.live;
  return `
    <div class="drawer" id="liveDrawer">
      <div class="backdrop" onclick="closeLive()"></div>
      <div class="drawer-panel">
        <div class="sheet-title">Live VS</div>
        <div class="small-note">${live.title}</div>
        <div class="live-score">
          <div class="fighter"><div class="big">${live.leftEmoji}</div><strong>@${live.left}</strong><div style="margin-top:8px">${live.leftVotes} votes</div></div>
          <div class="vs-badge">VS</div>
          <div class="fighter"><div class="big">${live.rightEmoji}</div><strong>@${live.right}</strong><div style="margin-top:8px">${live.rightVotes} votes</div></div>
        </div>
        <div class="dual" style="margin-top:12px">
          <button class="secondary-btn" onclick="vote('left')">Vote left</button>
          <button class="secondary-btn" onclick="vote('right')">Vote right</button>
        </div>
        <div class="chat-box">
          <strong>Live chat</strong>
          <div class="comment-list" style="margin-bottom:0">${live.chat.map(c=>`<div class="comment-item">${c}</div>`).join('')}</div>
        </div>
      </div>
    </div>`;
}

function render(){
  app.innerHTML = `
    <div class="shell">
      ${topbar()}
      ${installBanner()}
      ${renderFeed()}
      ${bottomNav()}
      ${commentsSheet()}
      ${createModal()}
      ${profileDrawer()}
      ${notificationsDrawer()}
      ${liveDrawer()}
    </div>`;
}

window.likePost = function(id){ const post=state.posts.find(p=>p.id===id); if(!post) return; post.likes++; saveState(); render(); };
window.openComments = function(id){ currentComments=id; render(); };
window.closeComments = function(){ currentComments=null; render(); };
window.addComment = function(id){ const input=document.getElementById('commentInput'); const text=input?.value?.trim(); if(!text) return; const post=state.posts.find(p=>p.id===id); post.comments.push({u:state.currentUser.username,t:text}); state.notifications.unshift({text:`New comment on ${post.title}`, time:'now'}); saveState(); currentComments=id; render(); toast('Comment added'); };
window.openCreate = function(type='challenge'){ document.getElementById('createModal').classList.add('show'); document.getElementById('createType').value=type; };
window.closeCreate = function(){ document.getElementById('createModal').classList.remove('show'); };
window.submitCreate = function(e){ e.preventDefault(); const title=document.getElementById('createTitle').value.trim(); if(!title) return; state.posts.unshift({ id:'p'+Date.now(), username:state.currentUser.username, emoji:document.getElementById('createEmoji').value || '🔥', title, caption:document.getElementById('createCaption').value.trim(), type:document.getElementById('createType').value, category:document.getElementById('createCategory').value, likes:0, comments:[], accent1:['#ff4f8b','#6a7cff','#ff8c4d','#13c296','#8f5bff'][Math.floor(Math.random()*5)] }); state.currentUser.streak++; state.notifications.unshift({text:`Your ${document.getElementById('createType').value} is live`, time:'now'}); saveState(); closeCreate(); render(); toast('Posted to Loop'); };
window.openProfile = function(){ document.getElementById('profileDrawer').classList.add('show'); };
window.closeProfile = function(){ document.getElementById('profileDrawer').classList.remove('show'); };
window.saveProfile = function(){ state.currentUser.username=document.getElementById('profileName').value.trim()||state.currentUser.username; state.currentUser.bio=document.getElementById('profileBio').value.trim()||state.currentUser.bio; saveState(); render(); toast('Profile updated'); };
window.openNotifications = function(){ document.getElementById('notificationsDrawer').classList.add('show'); };
window.closeNotifications = function(){ document.getElementById('notificationsDrawer').classList.remove('show'); };
window.openLive = function(){ document.getElementById('liveDrawer').classList.add('show'); };
window.closeLive = function(){ document.getElementById('liveDrawer').classList.remove('show'); };
window.vote = function(side){ if(side==='left') state.live.leftVotes++; else state.live.rightVotes++; saveState(); render(); toast('Vote counted'); };

render();
