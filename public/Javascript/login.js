async function login() {
  const err = document.getElementById('err');
  err.classList.add('hidden');

  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
    })
  });

  const data = await res.json();

  if (!res.ok) {
    err.textContent = data.error;
    err.classList.remove('hidden');
    return;
  }

  if (data.requires2FA) {
    window.location.href = '/verify-2fa';
    return;
  }

  window.location.href = '/dashboard';
}