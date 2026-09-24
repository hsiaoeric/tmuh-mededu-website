// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteProvider } from '@/app/site';
import type { RawPerson } from '@/data/people';
import { Avatar, PersonCard } from './Person';

const FAILED_PORTRAIT_URL = 'https://cms.example.invalid/portraits/chung-che-wu.jpg';
const CORRECTED_PORTRAIT_URL = '/assets/chung-che-wu.jpg';
const PERSON = {
  zh: '吳重慶',
  en: 'Chung-Che Wu',
  role: 'director',
  dZh: '醫學教育',
  dEn: 'Medical Education',
  slug: '',
  hubId: 'chung-che-wu',
} satisfies RawPerson;
const FAILED_PERSON = { ...PERSON, photoSrc: FAILED_PORTRAIT_URL } satisfies RawPerson;
const CORRECTED_PERSON = { ...PERSON, photoSrc: CORRECTED_PORTRAIT_URL } satisfies RawPerson;

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('shared person images', () => {
  it('resets PersonCard portrait failure only after its resolved URL changes or is removed', () => {
    // Given
    const view = render(
      <SiteProvider><PersonCard person={FAILED_PERSON} accent="var(--accent)" /></SiteProvider>,
    );
    const failedImage = screen.getByRole('img', { name: PERSON.zh });
    fireEvent.error(failedImage);
    expect(screen.queryByRole('img')).toBeNull();

    view.rerender(
      <SiteProvider><PersonCard person={FAILED_PERSON} accent="var(--accent)" /></SiteProvider>,
    );
    expect(screen.queryByRole('img')).toBeNull();

    // When
    view.rerender(
      <SiteProvider><PersonCard person={CORRECTED_PERSON} accent="var(--accent)" /></SiteProvider>,
    );

    // Then
    const correctedImage = screen.getByRole('img', { name: PERSON.zh });
    expect(correctedImage.getAttribute('src')).toBe(CORRECTED_PORTRAIT_URL);

    view.rerender(
      <SiteProvider><PersonCard person={FAILED_PERSON} accent="var(--accent)" /></SiteProvider>,
    );
    expect(screen.getByRole('img', { name: PERSON.zh }).getAttribute('src')).toBe(FAILED_PORTRAIT_URL);

    fireEvent.error(screen.getByRole('img', { name: PERSON.zh }));
    view.rerender(
      <SiteProvider><PersonCard person={PERSON} accent="var(--accent)" /></SiteProvider>,
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('CW')).toBeTruthy();

    view.rerender(
      <SiteProvider><PersonCard person={FAILED_PERSON} accent="var(--accent)" /></SiteProvider>,
    );
    expect(screen.getByRole('img', { name: PERSON.zh }).getAttribute('src')).toBe(FAILED_PORTRAIT_URL);
  });

  it('resets decorative Avatar failure only after its resolved URL changes or is removed', () => {
    // Given
    const view = render(
      <SiteProvider><Avatar person={FAILED_PERSON} accent="var(--accent)" /></SiteProvider>,
    );
    fireEvent.error(screen.getByRole('presentation'));
    expect(screen.queryByRole('presentation')).toBeNull();

    view.rerender(
      <SiteProvider><Avatar person={FAILED_PERSON} accent="var(--accent)" /></SiteProvider>,
    );
    expect(screen.queryByRole('presentation')).toBeNull();

    // When
    view.rerender(
      <SiteProvider><Avatar person={CORRECTED_PERSON} accent="var(--accent)" /></SiteProvider>,
    );

    // Then
    const correctedImage = screen.getByRole('presentation');
    expect(correctedImage.getAttribute('alt')).toBe('');
    expect(correctedImage.getAttribute('src')).toBe(CORRECTED_PORTRAIT_URL);

    view.rerender(
      <SiteProvider><Avatar person={FAILED_PERSON} accent="var(--accent)" /></SiteProvider>,
    );
    expect(screen.getByRole('presentation').getAttribute('src')).toBe(FAILED_PORTRAIT_URL);

    fireEvent.error(screen.getByRole('presentation'));
    view.rerender(
      <SiteProvider><Avatar person={PERSON} accent="var(--accent)" /></SiteProvider>,
    );
    expect(screen.queryByRole('presentation')).toBeNull();
    expect(screen.getByText('CW')).toBeTruthy();

    view.rerender(
      <SiteProvider><Avatar person={FAILED_PERSON} accent="var(--accent)" /></SiteProvider>,
    );
    expect(screen.getByRole('presentation').getAttribute('src')).toBe(FAILED_PORTRAIT_URL);
  });
});
