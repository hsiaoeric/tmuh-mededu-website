// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NavMenu } from './NavMenu';

afterEach(cleanup);

function renderMenu(onNavigate = vi.fn()) {
  render(
    <MemoryRouter>
      <button type="button">Before</button>
      <NavMenu label="更多" onNavigate={onNavigate}>
        <a className="nav-menu-item" href="#gallery">活動花絮</a>
        <a className="nav-menu-item" href="#videos">影音看板</a>
        <button type="button" className="nav-menu-item">聯絡我們</button>
      </NavMenu>
      <button type="button">After</button>
    </MemoryRouter>,
  );
  const trigger = screen.getByRole('button', { name: '更多' });
  const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
  if (panel === null) throw new TypeError('aria-controls must point at the panel');
  return { trigger, panel, onNavigate };
}

describe('NavMenu', () => {
  it('is a disclosure: aria-expanded tracks the panel, which stays mounted and hidden while closed', () => {
    const { trigger, panel } = renderMenu();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.hasAttribute('aria-haspopup')).toBe(false);
    expect(panel.hidden).toBe(true);
    expect(screen.queryByRole('link', { name: '活動花絮' })).toBeNull();

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    expect(screen.getByRole('link', { name: '活動花絮' })).toBeTruthy();

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const { trigger } = renderMenu();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const first = screen.getByRole('link', { name: '活動花絮' });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(first, { key: 'Escape' });

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Escape without stealing focus when it was opened by hover', () => {
    const { trigger } = renderMenu();
    const before = screen.getByRole('button', { name: 'Before' });
    before.focus();
    fireEvent.mouseEnter(trigger.parentElement as HTMLElement);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(before);
  });

  it('moves between items with the arrow keys, Home and End, wrapping at the ends', () => {
    const { trigger } = renderMenu();
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    const contact = screen.getByRole('button', { name: '聯絡我們' });
    expect(document.activeElement).toBe(contact);

    fireEvent.keyDown(contact, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('link', { name: '活動花絮' }));
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('link', { name: '影音看板' }));
    fireEvent.keyDown(document.activeElement as Element, { key: 'End' });
    expect(document.activeElement).toBe(contact);
    fireEvent.keyDown(contact, { key: 'Home' });
    expect(document.activeElement).toBe(screen.getByRole('link', { name: '活動花絮' }));
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(contact);
  });

  it('closes when focus tabs out of it and when the pointer presses outside', () => {
    const { trigger } = renderMenu();
    fireEvent.click(trigger);
    const last = screen.getByRole('button', { name: '聯絡我們' });
    fireEvent.blur(last, { relatedTarget: screen.getByRole('button', { name: 'After' }) });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Before' }));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('stays open while focus moves inside it', () => {
    const { trigger } = renderMenu();
    fireEvent.click(trigger);
    fireEvent.blur(trigger, { relatedTarget: screen.getByRole('link', { name: '活動花絮' }) });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes and reports navigation when an item is activated', () => {
    const { trigger, onNavigate } = renderMenu();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('link', { name: '影音看板' }));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('keeps a hover-opened panel open when the trigger is then clicked', () => {
    vi.useFakeTimers();
    try {
      const { trigger } = renderMenu();
      const root = trigger.parentElement as HTMLElement;
      fireEvent.mouseEnter(root);
      fireEvent.click(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      fireEvent.mouseLeave(root);
      act(() => { vi.advanceTimersByTime(500); });
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('opens on a tap, whose mouseenter and click arrive before a render', () => {
    const { trigger } = renderMenu();
    act(() => {
      fireEvent.mouseEnter(trigger.parentElement as HTMLElement);
      fireEvent.click(trigger);
    });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes a hover-opened panel shortly after the pointer leaves', () => {
    vi.useFakeTimers();
    try {
      const { trigger } = renderMenu();
      const root = trigger.parentElement as HTMLElement;
      fireEvent.mouseEnter(root);
      fireEvent.mouseLeave(root);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      act(() => { vi.advanceTimersByTime(500); });
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    } finally {
      vi.useRealTimers();
    }
  });
});
