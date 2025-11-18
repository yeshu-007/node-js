
const API_BASE = 'http://localhost:5000'; 


function saveSession(data){

  localStorage.setItem('travelDiarySession', JSON.stringify(data));
}
function getSession(){
  const v = localStorage.getItem('travelDiarySession');
  return v ? JSON.parse(v) : null;
}
function clearSession(){
  localStorage.removeItem('travelDiarySession');
}
function authHeaders(){
  const s = getSession();
  const headers = { 'Content-Type': 'application/json' };
  if(s && s.userId) headers['x-user-id'] = s.userId;
  if(s && s.sessionToken) headers['x-session-token'] = s.sessionToken;
  return headers;
}


function toArrayFromCSV(str){
  if(!str) return [];
  return str.split(',').map(s=>s.trim()).filter(Boolean);
}
async function handleFetch(url, options){
  try{
    const res = await fetch(url, options);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch(e){ data = text; }
    if(!res.ok){
      throw { status: res.status, body: data };
    }
    return data;
  } catch(err){

    if(err instanceof TypeError || (err && err.message && err.message.toLowerCase().includes('failed to fetch'))){
      const msg = `Network error: could not reach ${API_BASE}. Is the backend running and accessible? (original: ${err.message || err})`;
      const e = new Error(msg);
      e.code = 'NETWORK_ERROR';
      throw e;
    }
    throw err;
  }
}

async function testBackend(){
  try{
    const res = await fetch(API_BASE, { method: 'GET' });
    return { ok: true, status: res.status };
  }catch(err){
    return { ok: false, error: err };
  }
}

async function uploadFiles(fileList){
  const fd = new FormData();
  for(const f of fileList){ fd.append('photos', f); }
  const uploadUrl = new URL('/api/uploads', API_BASE).toString();
  console.log('uploadFiles: POST to', uploadUrl);
  const res = await fetch(uploadUrl, {
    method: 'POST',
    body: fd
  });
  let text;
  try{
    text = await res.text();
  }catch(e){
    text = '' + e;
  }

  let parsed;
  try{ parsed = JSON.parse(text); }catch(e){ parsed = text; }
  console.log('uploadFiles response', res.status, parsed);
  if(!res.ok){
    const bodyMsg = (parsed && parsed.message) ? parsed.message : (typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
    const err = new Error(`Upload failed (status ${res.status}): ${bodyMsg}`);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  const data = parsed;
  return data.urls || [];
}

async function renderDiagnostic(){
}

/* --- Register Page --- */
async function registerSubmit(ev){
  ev.preventDefault();
  const name = document.getElementById('r-name').value.trim();
  const email = document.getElementById('r-email').value.trim();
  const password = document.getElementById('r-password').value;
  if(!name || !email || !password){ alert('Please fill all required fields'); return; }
  const body = { name, email, password };
  try{
    const r = await handleFetch(API_BASE + '/api/auth/register', {
      method:'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    alert('Registered successfully. You can login now.');
    window.location.href = 'login.html';
  }catch(e){
    console.error(e);
    alert('Register failed: ' + (e.body?.message || e.body || e.status || e));
  }
}

/* --- Login Page --- */
async function loginSubmit(ev){
  ev.preventDefault();
  const email = document.getElementById('l-email').value.trim();
  const password = document.getElementById('l-password').value;
  if(!email || !password){ alert('Please fill all required fields'); return; }
  try{
    const r = await handleFetch(API_BASE + '/api/auth/login', {
      method:'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    });

    if(r.userId){
      saveSession({ userId: r.userId, sessionToken: r.sessionToken });
      alert('Login successful');
      window.location.href = 'index.html';
    } else {
      alert('Login failed: ' + (r.message || JSON.stringify(r)));
    }
  }catch(e){
    console.error(e);
    alert('Login failed: ' + (e.body?.message || e.body || e.status || e));
  }
}

async function addTripSubmit(ev){
  ev.preventDefault();
  const title = document.getElementById('t-title').value.trim();
  const departDate = document.getElementById('t-depart').value;
  const arrivalDate = document.getElementById('t-arrival').value;
  const placesVisited = toArrayFromCSV(document.getElementById('t-places').value);
  const about = document.getElementById('t-about').value.trim();
  const tips = document.getElementById('t-tips').value.trim();
  const budget = Number(document.getElementById('t-budget').value || 0);
  const category = document.getElementById('t-category').value;
  const photos = toArrayFromCSV(document.getElementById('t-photos').value);

  const fileInput = document.getElementById('t-photos-files');
  let uploadedUrls = [];
  if(fileInput && fileInput.files && fileInput.files.length > 0){
    try{
      uploadedUrls = await uploadFiles(fileInput.files);
    }catch(err){
      console.error('uploadFiles error', err);
      alert('Image upload failed: ' + (err.message || err));
      return;
    }
  }

  const finalPhotos = [...photos, ...uploadedUrls];
  if(!title || !departDate || !arrivalDate){ alert('Title and dates are required'); return; }
  const body = { title, departDate, arrivalDate, placesVisited, about, tips, budget, category, photos: finalPhotos };
  try{
    const r = await handleFetch(API_BASE + '/api/trips', {
      method:'POST',
      headers: authHeaders(),
      body: JSON.stringify(body)
    });
    alert('Trip added successfully');
    window.location.href = 'index.html';
  }catch(e){
    console.error(e);
    alert('Add trip failed: ' + (e.body?.message || e.body || e.status || e));
  }
}


async function loadTrips(){
  try{
    const trips = await handleFetch(API_BASE + '/api/trips', {
      method: 'GET',
      headers: { 'Content-Type':'application/json' }
    });
    renderTrips(trips);
  }catch(e){
    console.error(e);
    document.getElementById('tripsArea').innerHTML = '<div class="alert">Could not load trips. See console.</div>';
  }
}


async function loadMyTrips(){
  const s = getSession();
  if(!s || !s.userId){
    document.getElementById('tripsArea').innerHTML = '<div class="alert">You must be logged in to view your trips.</div>';
    return;
  }
  try{
    const trips = await handleFetch(API_BASE + '/api/trips?owner=' + encodeURIComponent(s.userId), {
      method: 'GET',
      headers: { 'Content-Type':'application/json' }
    });
    renderTrips(trips);
  }catch(e){
    console.error(e);
    document.getElementById('tripsArea').innerHTML = '<div class="alert">Could not load trips. See console.</div>';
  }
}

function initPage(){
  renderDiagnostic();
  showAllTrips();
}

function showAllTrips(ev){
  if(ev && ev.preventDefault) ev.preventDefault();
  const a = document.getElementById('btnAllTrips');
  const b = document.getElementById('btnMyTrips');
  if(a) a.classList.add('button');
  if(b) b.classList.remove('button');
  loadTrips();
}

function showMyTrips(ev){
  if(ev && ev.preventDefault) ev.preventDefault();
  const a = document.getElementById('btnAllTrips');
  const b = document.getElementById('btnMyTrips');
  if(a) a.classList.remove('button');
  if(b) b.classList.add('button');
  loadMyTrips();
}

function renderTrips(trips){
  const container = document.getElementById('tripsArea');
  if(!trips || trips.length === 0){ container.innerHTML = '<p class="small">No trips yet. Add one!</p>'; return; }
  container.innerHTML = '';
  trips.forEach(trip=>{
    const el = document.createElement('div');

    const session = getSession();
    const ownerId = trip.owner ? String(trip.owner) : (trip.ownerId ? String(trip.ownerId) : null);
    const isMine = session && session.userId && ownerId && String(session.userId) === ownerId;
    el.className = 'trip-card' + (isMine ? ' mine' : '');

    function normalizeUrl(u){ if(!u) return ''; if(u.startsWith('http') || u.startsWith('data:')) return u; if(u.startsWith('/')) return API_BASE.replace(/\/$/,'') + u; return u; }
    const photoUrl = normalizeUrl((trip.photos && trip.photos[0]) ? trip.photos[0] : '');
    const thumb = document.createElement('img');
    thumb.className = 'trip-thumb';
    thumb.alt = trip.title || 'Trip photo';

    const placeholder = 'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22450%22%3E%3Crect fill=%22%23f3f6fb%22 width=%22100%25%22 height=%22100%25%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%238a94a6%22 font-size=%2224%22%3ENo image%3C/text%3E%3C/svg%3E';
    thumb.src = photoUrl || placeholder;

    thumb.onerror = function(){ this.onerror = null; this.src = placeholder; };

    const link = document.createElement('a');
    link.href = photoUrl || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.appendChild(thumb);
    el.appendChild(link);

    const title = document.createElement('h3');
    title.innerText = trip.title || '';
    el.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerText = `${trip.departDate || ''} → ${trip.arrivalDate || ''}`;
    el.appendChild(meta);

    const places = document.createElement('div');
    places.className = 'meta small';
    places.innerText = (trip.placesVisited || []).join(', ');
    el.appendChild(places);

    const p = document.createElement('p');
    p.innerText = (trip.about || '').slice(0,220) + ((trip.about && trip.about.length>220)?'...':'');
    el.appendChild(p);

    const tags = document.createElement('div');
    tags.className = 'tags';
    const cat = document.createElement('span'); cat.className='tag'; cat.innerText = trip.category || '';
    const bud = document.createElement('span'); bud.className='tag budget'; bud.innerText = '₹ ' + (trip.budget || 0);
    tags.appendChild(cat); tags.appendChild(bud);
    el.appendChild(tags);

    const actions = document.createElement('div'); actions.style.marginTop = '10px'; actions.className = 'row';
    const photoLink = document.createElement('a'); photoLink.className='small'; photoLink.href = photoUrl || '#'; photoLink.target='_blank'; photoLink.innerText = 'Open Photo';

    if(isMine){
      const editBtn = document.createElement('button'); editBtn.className='btn'; editBtn.innerText='Edit'; editBtn.onclick = ()=> startEdit(trip._id || trip.id);
      const delBtn = document.createElement('button'); delBtn.className='btn ghost'; delBtn.innerText='Delete'; delBtn.onclick = ()=> deleteTrip(trip._id || trip.id);
      actions.appendChild(editBtn); actions.appendChild(delBtn);
    } else {
      const ownerBadge = document.createElement('span'); ownerBadge.className = 'small muted'; ownerBadge.style.marginRight = '8px'; ownerBadge.innerText = ownerId ? `by ${ownerId.slice(0,6)}...` : 'by guest';
      actions.appendChild(ownerBadge);
    }
    actions.appendChild(photoLink);
    el.appendChild(actions);

    container.appendChild(el);
  });
}

function escapeHTML(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });}

async function deleteTrip(id){
  if(!confirm('Delete this trip?')) return;
  try{
    const headers = authHeaders();
    console.log('Deleting trip', id, 'with headers:', headers);
    await handleFetch(API_BASE + '/api/trips/' + id, {
      method:'DELETE',
      headers
    });
    alert('Deleted');
    loadTrips();
  }catch(e){
    console.error('deleteTrip error:', e);
    if(e && e.code === 'NETWORK_ERROR'){
      alert(e.message);
      return;
    }
    const status = e?.status || (e?.body && e.body.status) || null;
    const body = e?.body || e?.message || e;
    if(status === 401 || status === 403){
      alert('Not authorized. Please login again.');
      clearSession();
      window.location.href = 'login.html';
      return;
    }
    alert('Delete failed: ' + (body?.message || body || status || 'Unknown error'));
  }
}

let currentEditingTripId = null;

function closeEditModal(){
  const modal = document.getElementById('editModal');
  if(modal) modal.style.display = 'none';
  currentEditingTripId = null;
}

function openEditModal(trip){
  const modal = document.getElementById('editModal');
  if(!modal) return;
  
  document.getElementById('e-title').value = trip.title || '';
  document.getElementById('e-category').value = trip.category || 'Leisure';
  document.getElementById('e-depart').value = trip.departDate || '';
  document.getElementById('e-arrival').value = trip.arrivalDate || '';
  document.getElementById('e-budget').value = trip.budget || 0;
  document.getElementById('e-places').value = (trip.placesVisited || []).join(', ');
  document.getElementById('e-about').value = trip.about || '';
  document.getElementById('e-tips').value = trip.tips || '';
  document.getElementById('e-photos').value = (trip.photos || []).join(', ');
  
  currentEditingTripId = trip._id || trip.id;
  modal.style.display = 'flex';
}

async function startEdit(id){
  try{
    const trip = await handleFetch(API_BASE + '/api/trips/' + id, { 
      method:'GET', 
      headers:{'Content-Type':'application/json'} 
    });
    openEditModal(trip);
  }catch(e){ 
    console.error(e); 
    alert('Could not load trip: ' + (e.body?.message || e.body || e.status || e)); 
  }
}

async function submitEditTrip(ev){
  ev.preventDefault();
  if(!currentEditingTripId){
    alert('No trip selected for editing');
    return;
  }
  
  try{
    const title = document.getElementById('e-title').value.trim();
    const departDate = document.getElementById('e-depart').value;
    const arrivalDate = document.getElementById('e-arrival').value;
    const placesVisited = toArrayFromCSV(document.getElementById('e-places').value);
    const about = document.getElementById('e-about').value.trim();
    const tips = document.getElementById('e-tips').value.trim();
    const budget = Number(document.getElementById('e-budget').value || 0);
    const category = document.getElementById('e-category').value;
    const photos = toArrayFromCSV(document.getElementById('e-photos').value);
    
    if(!title || !departDate || !arrivalDate){ 
      alert('Title and dates are required'); 
      return; 
    }
    
    const body = { title, departDate, arrivalDate, placesVisited, about, tips, budget, category, photos };
    
    await handleFetch(API_BASE + '/api/trips/' + currentEditingTripId, {
      method:'PUT',
      headers: authHeaders(),
      body: JSON.stringify(body)
    });
    
    alert('Trip updated successfully');
    closeEditModal();
    loadTrips();
  }catch(e){
    console.error('submitEditTrip error:', e);
    alert('Update failed: ' + (e.body?.message || e.body || e.status || e));
  }
}

function doLogout(){
  clearSession();
  window.location.href = 'login.html';
}

window.registerSubmit = registerSubmit;
window.loginSubmit = loginSubmit;
window.addTripSubmit = addTripSubmit;
window.loadTrips = loadTrips;
window.deleteTrip = deleteTrip;
window.startEdit = startEdit;
window.submitEditTrip = submitEditTrip;
window.closeEditModal = closeEditModal;
window.doLogout = doLogout;
