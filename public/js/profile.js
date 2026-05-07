async function logout() {
  const res = await fetch('/auth/logout', { method: 'POST' });
  if (res.ok) {
    localStorage.removeItem('onboarding_done');
    window.location.href = '/welcome';
  }
}