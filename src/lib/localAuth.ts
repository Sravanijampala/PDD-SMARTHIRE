// Local auth - works without Firebase or backend
// Stores users in localStorage for demo/dev use

const USERS_KEY = 'smarthire_local_users';

interface LocalUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getUsers(): LocalUser[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users: LocalUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function localRegister(name: string, email: string, password: string) {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    throw new Error('An account with this email already exists.');
  }
  const newUser: LocalUser = {
    id: `local_${Date.now()}`,
    name,
    email,
    passwordHash: simpleHash(password),
    role: 'Candidate',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return { id: newUser.id, name, email, role: 'Candidate', token: `local_token_${newUser.id}` };
}

export function localLogin(email: string, password: string) {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user) {
    throw new Error('No account found with this email. Please sign up first.');
  }
  if (user.passwordHash !== simpleHash(password)) {
    throw new Error('Incorrect password. Please try again.');
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role, token: `local_token_${user.id}` };
}
