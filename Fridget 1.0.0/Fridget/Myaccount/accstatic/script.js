(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    card: $('profileCard'), file: $('fileInput'), avatar: $('avatarImg'), edit: $('editProfileBtn'),
    btnText: $('btnText'), actions: $('formActionsContainer'), save: $('saveChangesBtn'), cancel: $('cancelChangesBtn'),
    name: $('inputDisplayName'), username: $('inputUsername'), email: $('inputEmail'), bio: $('inputBio'),
    displayName: $('displayUserName'), handle: $('displayHandle'), displayBio: $('displayBio'),
    joined: $('joinedAt'), notice: $('profileNotice'), form: $('profileForm')
  };
  let csrf = '', editing = false, avatarData = '', original = null;
  els.save.disabled = true;
  const message = (text, kind='') => { els.notice.textContent = text; els.notice.className = `profile-notice ${kind}`; };
  const snapshot = () => ({display_name:els.name.value, username:els.username.value, bio:els.bio.value, avatar_data:avatarData});
  const render = (p) => {
    els.name.value = p.display_name || ''; els.username.value = p.username || ''; els.email.value = p.email || ''; els.bio.value = p.bio || '';
    els.displayName.textContent = p.display_name || 'Fridget user'; els.handle.textContent = '@' + (p.username || 'user');
    els.displayBio.textContent = p.bio || 'Add a little introduction about yourself.';
    els.joined.textContent = p.created_at ? new Date(p.created_at.replace(' ','T')+'Z').toLocaleDateString() : 'recently';
    avatarData = p.avatar_data || '';
    if (avatarData) els.avatar.src = avatarData;
    original = snapshot();
  };
  const load = async () => {
    try {
      const response = await fetch('/api/profile'); const data = await response.json();
      if (!response.ok) { if (response.status === 401) { message('Please sign in to view your profile.', 'error'); return; } throw new Error(data.error || 'Could not load profile.'); }
      csrf = data.csrf_token; render(data.profile);
    } catch (error) { message(error.message, 'error'); }
  };
  const setEditing = (enabled) => {
    editing = enabled; els.card.classList.toggle('editing', enabled);
    els.save.disabled = !enabled;
    els.name.disabled = !enabled; els.username.disabled = !enabled; els.bio.disabled = !enabled;
    els.username.readOnly = !enabled;
    els.username.classList.toggle('active-editable', enabled);
    els.name.classList.toggle('active-editable', enabled);
    els.bio.classList.toggle('active-editable', enabled);
    els.actions.hidden = !enabled; els.edit.querySelector('span').textContent = enabled ? 'Editing Profile' : 'Edit Profile';
    els.edit.classList.toggle('saved-mode', enabled);
    if (enabled) { original = snapshot(); els.name.focus(); els.card.scrollIntoView({behavior:'smooth',block:'start'}); }
  };
  els.edit.addEventListener('click', () => { if (!editing) setEditing(true); else els.form.requestSubmit(); });
  $('scrollArrowBtn').addEventListener('click', () => $('editDetailsCard').scrollIntoView({behavior:'smooth'}));
  $('changeAvatarBtn').addEventListener('click', () => { if (editing) els.file.click(); });
  els.avatar.addEventListener('click', () => { if (editing) els.file.click(); });
  els.file.addEventListener('change', () => {
    const file = els.file.files && els.file.files[0]; if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 2*1024*1024) { message('Choose a PNG, JPG, or WebP image under 2 MB.', 'error'); els.file.value=''; return; }
    const reader = new FileReader(); reader.onload = () => { avatarData = String(reader.result); els.avatar.src = avatarData; }; reader.readAsDataURL(file);
  });
  els.cancel.addEventListener('click', () => { if (original) { els.name.value=original.display_name; els.username.value=original.username; els.bio.value=original.bio; avatarData=original.avatar_data; if(avatarData) els.avatar.src=avatarData; } setEditing(false); message('Changes discarded.'); });
  $('profileLogout').addEventListener('click', async () => {
    try {
      const response = await fetch('/api/logout', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csrf_token:csrf})});
      if (response.ok) location.href = '/'; else message('Could not log out. Please try again.', 'error');
    } catch (_) { message('Could not connect to the server.', 'error'); }
  });
  els.form.addEventListener('submit', async (event) => {
    event.preventDefault(); if (!editing) return;
    els.save.disabled = true; message('Saving your changes…');
    try {
      const response = await fetch('/api/profile', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...snapshot(),csrf_token:csrf})});
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not save profile.');
      render({...snapshot(),email:els.email.value,created_at:''}); setEditing(false); message(data.message, 'success');
    } catch (error) { message(error.message, 'error'); }
    finally { els.save.disabled = !editing; }
  });
  els.username.addEventListener('input', () => { const start=els.username.selectionStart; const end=els.username.selectionEnd; els.username.value=els.username.value.toLowerCase().replace(/[^a-z0-9._-]/g,'').slice(0,30); try{els.username.setSelectionRange(start,end);}catch(_){} });
  load();
})();
