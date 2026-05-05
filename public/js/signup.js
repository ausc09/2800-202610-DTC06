async function signup() {
  const err = document.getElementById('err');
  err.classList.add('hidden');

  const password = document.getElementById('password').value;

  const res = await fetch('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: document.getElementById('firstName').value,
      lastName:  document.getElementById('lastName').value,
      email:     document.getElementById('email').value,
      password:  password,
    })
  });

  const data = await res.json();

  if (!res.ok) {
    err.textContent = data.error;
    err.classList.remove('hidden');
    return;
  }

 window.location.href = '/';
}