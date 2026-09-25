// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { clearAllAutosaves } from './useAutosave';

afterEach(() => localStorage.clear());

describe('clearAllAutosaves', () => {
  it('removes only autosaved edits, for signing out on a shared computer', () => {
    localStorage.setItem('tmuh-admin-autosave:user:doc', '{}');
    localStorage.setItem('tmuh.lang', 'zh');

    clearAllAutosaves();

    expect(localStorage.getItem('tmuh-admin-autosave:user:doc')).toBeNull();
    expect(localStorage.getItem('tmuh.lang')).toBe('zh');
  });
});
