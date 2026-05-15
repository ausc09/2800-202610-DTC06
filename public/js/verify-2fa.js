async function verify2FA() {
  const err = document.getElementById('err');
  err.classList.add('hidden');

  const res = await fetch('/auth/2fa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: document.getElementById('token').value })
  });

  const data = await res.json();

  if (!res.ok) {
    err.textContent = data.error;
    err.classList.remove('hidden');
    return;
  }

  window.location.href = '/';
}