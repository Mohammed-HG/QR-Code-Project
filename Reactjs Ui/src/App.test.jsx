import React from 'react';
import { test, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
vi.mock('./LocationMap', () => ({ default: () => <div>Location map</div> }));
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
test('login updates navigation, uses HttpOnly session responses and logout sends CSRF', async () => {
  const user = userEvent.setup();
  window.history.replaceState(null, '', '/login');
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === '/api/users/me') return json({ error: 'Please sign in.' }, 401);
    if (url === '/api/login') return json({ user: { username: 'person' }, csrfToken: 'csrf-test' });
    if (url === '/api/logout') return new Response(null, { status: 204 });
    throw new Error('Unexpected URL ' + url);
  }));
  render(<App />);
  await user.type(screen.getByLabelText('Username', { exact: true }), 'person');
  await user.type(screen.getByLabelText('Password', { exact: true }), 'long secret password');
  await user.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
  await screen.findByText('Welcome, person');
  expect(window.location.pathname).toBe('/');
  expect(localStorage.getItem('token')).toBeNull();
  await user.click(screen.getByText('Menu',{exact:true}));
  await user.click(screen.getByRole('button', { name: 'Sign out', exact: true }));
  await screen.findByRole('heading', { name: 'Welcome back' });
  const call = fetch.mock.calls.find(([url]) => url === '/api/logout');
  expect(call[1].headers['X-CSRF-Token']).toBe('csrf-test');
});
test('registration requires a server challenge and passes proof to account creation', async () => {
  const user = userEvent.setup();
  window.history.replaceState(null, '', '/register');
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === '/api/users/me') return json({ error: 'Please sign in.' }, 401);
    if (url === '/api/send-otp') return json({ challengeId: 'challenge-test', resendAfter: 60 }, 202);
    if (url === '/api/verify-otp') return json({ verificationToken: 'proof-test' });
    if (url === '/api/register') return json({ message: 'Created.' }, 201);
    throw new Error('Unexpected URL ' + url);
  }));
  render(<App />);
  await user.type(screen.getByLabelText('Username', { exact: true }), 'person');
  await user.type(screen.getByLabelText('Email', { exact: true }), 'person@example.com');
  await user.type(screen.getByLabelText('Password', { exact: true }), 'long secret password');
  await user.click(screen.getByRole('button', { name: 'Send verification code' }));
  await screen.findByLabelText('Verification code');
  await user.type(screen.getByLabelText('Verification code'), '123456');
  await user.click(screen.getByRole('button', { name: 'Verify and create account' }));
  await screen.findByRole('heading', { name: 'Welcome back' });
  expect(window.location.pathname).toBe('/login');
  const verify = fetch.mock.calls.find(([url]) => url === '/api/verify-otp');
  const register = fetch.mock.calls.find(([url]) => url === '/api/register');
  expect(JSON.parse(verify[1].body)).toMatchObject({ challengeId: 'challenge-test', otp: '123456' });
  expect(JSON.parse(register[1].body).verificationToken).toBe('proof-test');
  expect(fetch.mock.calls.every(([url]) => !url.startsWith('http'))).toBe(true);
});
test('unknown routes show a useful page instead of an empty screen', async () => {
  window.history.replaceState(null, '', '/does-not-exist');
  vi.stubGlobal('fetch', vi.fn(async () => json({}, 401)));
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeTruthy();
  await waitFor(() => expect(screen.queryByText('Loading account…')).toBeNull());
});

test('a delayed account lookup cannot overwrite a newer login', async () => {
  let finishLookup;
  const user = userEvent.setup();
  window.history.replaceState(null, '', '/login');
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === '/api/users/me') return new Promise(resolve => { finishLookup = resolve; });
    if (url === '/api/login') return json({ user: { username: 'newperson' }, csrfToken: 'new-csrf' });
    throw new Error('Unexpected request');
  }));
  render(<App />);
  await user.type(screen.getByLabelText('Username', { exact: true }), 'newperson');
  await user.type(screen.getByLabelText('Password', { exact: true }), 'long secret password');
  await user.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
  await screen.findByText('Welcome, newperson');
  finishLookup(json({ user: { username: 'oldperson' }, csrfToken: 'old-csrf' }));
  await waitFor(() => expect(screen.getByText('Welcome, newperson')).toBeTruthy());
  expect(screen.queryByText('Welcome, oldperson')).toBeNull();
});
