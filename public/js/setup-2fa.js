(async () => {
  const res = await fetch('/auth/2fa/setup');
  const data = await res.json();
  document.getElementById('qr-img').src = data.qr;
})();

async function enable2FA() {
  const err = document.getElementById('err');
  const ok  = document.getElementById('ok');
  err.classList.add('hidden');
  ok.classList.add('hidden');

  const res = await fetch('/auth/2fa/enable', {
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

  ok.textContent = '2FA enabled! Redirecting...';
  ok.classList.remove('hidden');
  setTimeout(() => window.location.href = '/profile', 1500);
}