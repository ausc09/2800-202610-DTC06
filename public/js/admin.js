let allUsers = [];
let editingUserId = null;
let allReviews = [];
let currentUserId = null;

async function loadUsers() {
  const meRes = await fetch('/auth/me');
  const me = await meRes.json();
  currentUserId = me.id;

  const res = await fetch('/admin/users');
  if (!res.ok) {
    window.location.href = '/';
    return;
  }
  allUsers = await res.json();
  renderUsers(allUsers);

  document.getElementById('total-users').textContent = allUsers.length;
  document.getElementById('total-admins').textContent = allUsers.filter(u => u.role === 'admin').length;
}

function renderUsers(users) {
  const list = document.getElementById('users-list');
  if (users.length === 0) {
    list.innerHTML = '<div class="px-4 py-8 text-center text-brand-muted text-sm">No users found</div>';
    return;
  }

  list.innerHTML = users.map(user => `
    <div class="flex items-center justify-between px-4 py-4 border-b border-brand-border last:border-0">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-brand-green flex items-center justify-center flex-shrink-0">
          <span class="text-white font-bold text-sm">${user.firstName.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <p class="text-sm font-medium">${user.firstName} ${user.lastName}</p>
          <p class="text-xs text-brand-muted">${user.email}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-brand-greenPale text-brand-green' : 'bg-brand-alt text-brand-sub'}">
          ${user.role}
        </span>
        <button onclick="openModal('${user._id}', '${user.firstName} ${user.lastName}', '${user.role}')"
          class="p-1.5 hover:bg-brand-alt rounded-lg transition">
          <i data-lucide="pencil" class="w-4 h-4 text-brand-sub"></i>
        </button>
        <button onclick="deleteUser('${user._id}', '${user.firstName}')"
          class="p-1.5 hover:bg-red-50 rounded-lg transition">
          <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
        </button>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

function filterUsers() {
  const query = document.getElementById('search').value.toLowerCase();
  const filtered = allUsers.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(query) ||
    u.email.toLowerCase().includes(query)
  );
  renderUsers(filtered);
}

function openModal(id, name, role) {
  editingUserId = id;
  document.getElementById('modal-name').textContent = name;
  document.getElementById('modal-role').value = role;
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  editingUserId = null;
}

async function saveRole() {
  const role = document.getElementById('modal-role').value;
  const res = await fetch(`/admin/users/${editingUserId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  });
  if (res.ok) {
    closeModal();
    loadUsers();
  }
}

async function deleteUser(id, name) {
  if (id === currentUserId) {
    alert('You cannot delete your own account.');
    return;
  }
  if (!confirm(`Are you sure you want to delete ${name}?`)) return;
  const res = await fetch(`/admin/users/${id}`, { method: 'DELETE' });
  if (res.ok) loadUsers();
}

async function loadReviews() {
  const res = await fetch('/admin/reviews');
  if (!res.ok) return;
  allReviews = await res.json();
  renderReviews(allReviews);
}

function renderReviews(reviews) {
  const list = document.getElementById('reviews-list');
  if (reviews.length === 0) {
    list.innerHTML = '<div class="px-4 py-8 text-center text-brand-muted text-sm">No reviews found</div>';
    return;
  }

  list.innerHTML = reviews.map(review => `
    <div class="px-4 py-4 border-b border-brand-border last:border-0">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-medium">${review.username}</span>
            <span class="text-xs text-brand-muted">•</span>
            <span class="text-xs text-brand-muted">${review.plantId?.name || 'Unknown plant'}</span>
            <span class="text-xs text-brand-muted">•</span>
            <span class="text-xs text-brand-muted">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
          </div>
          <p class="text-sm text-brand-sub">${review.comment || 'No comment'}</p>
          ${review.foodSafetyNotes ? `<p class="text-xs text-brand-muted mt-1">Safety notes: ${review.foodSafetyNotes}</p>` : ''}
          <p class="text-xs text-brand-muted mt-1">${new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <button onclick="deleteReview('${review._id}')"
          class="p-1.5 hover:bg-red-50 rounded-lg transition flex-shrink-0">
          <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
        </button>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

function filterReviews() {
  const query = document.getElementById('search-review').value.toLowerCase();
  const filtered = allReviews.filter(r =>
    r.comment?.toLowerCase().includes(query) ||
    r.username?.toLowerCase().includes(query)
  );
  renderReviews(filtered);
}

async function deleteReview(id) {
  if (!confirm('Are you sure you want to delete this review?')) return;
  const res = await fetch(`/admin/reviews/${id}`, { method: 'DELETE' });
  if (res.ok) loadReviews();
}

loadUsers();
loadReviews();