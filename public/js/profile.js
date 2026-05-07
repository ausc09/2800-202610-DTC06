async function logout() {
  const res = await fetch('/auth/logout', { method: 'POST' });
  if (res.ok) {
    localStorage.removeItem('onboarding_done');
    window.location.href = '/welcome';
  }
}

function startEdit() {
  document.getElementById('view-mode').classList.add('hidden');
  document.getElementById('edit-mode').classList.remove('hidden');
  document.getElementById('edit-btn').classList.add('hidden');
}

function cancelEdit() {
  document.getElementById('view-mode').classList.remove('hidden');
  document.getElementById('edit-mode').classList.add('hidden');
  document.getElementById('edit-btn').classList.remove('hidden');
}

async function saveEdit() {
  const err = document.getElementById('edit-err');
  err.classList.add('hidden');

  const firstName = document.getElementById('edit-firstName').value.trim();
  const lastName  = document.getElementById('edit-lastName').value.trim();

  if (!firstName || !lastName) {
    err.textContent = 'Name cannot be empty';
    err.classList.remove('hidden');
    return;
  }

  const res = await fetch('/auth/update-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName })
  });

  const data = await res.json();

  if (!res.ok) {
    err.textContent = data.error;
    err.classList.remove('hidden');
    return;
  }

  document.getElementById('display-name').textContent = firstName + ' ' + lastName;
  document.getElementById('avatar-letter').textContent = firstName.charAt(0).toUpperCase();
  cancelEdit();
}