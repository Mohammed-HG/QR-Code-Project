import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  vi.stubGlobal('scrollTo', vi.fn());
  URL.createObjectURL = vi.fn(() => 'blob:qr-preview');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
