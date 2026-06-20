export const getAuthToken = () =>
  localStorage.getItem('placementPrepToken') ||
  sessionStorage.getItem('placementPrepToken');

export const getAuthUser = () => {
  const savedUser =
    localStorage.getItem('placementPrepUser') ||
    sessionStorage.getItem('placementPrepUser');

  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = decodeURIComponent(
      window.atob(normalized)
        .split('')
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem('placementPrepToken');
  localStorage.removeItem('placementPrepUser');
  sessionStorage.removeItem('placementPrepToken');
  sessionStorage.removeItem('placementPrepUser');
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  if (payload.exp * 1000 <= Date.now()) {
    clearAuthSession();
    return false;
  }

  return true;
};
