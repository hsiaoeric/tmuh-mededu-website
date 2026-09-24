// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import { ActivitiesPayloadSchema } from '@/content/contracts/activities';
import { ActivitiesEditor } from './ActivitiesEditor';

afterEach(cleanup);

describe('activities fixture round-trip', () => {
  it('renders the exact fixture losslessly and emits no normalization', () => {
    // Given
    const document = snapshot.find((candidate) => candidate.kind === 'activities');
    if (document === undefined) throw new TypeError('Missing activities fixture');
    const payload = ActivitiesPayloadSchema.parse(document.payload);
    const onPayloadChange = vi.fn();

    // When
    const view = render(<ActivitiesEditor payload={payload} onPayloadChange={onPayloadChange} />);

    // Then
    expect(view.getByDisplayValue('2026/07/22（三）12:30–13:30')).toBeTruthy();
    expect(view.getByDisplayValue('Wed 2026/07/22 12:30–13:30')).toBeTruthy();
    expect(JSON.parse(JSON.stringify(payload))).toEqual(document.payload);
    expect(onPayloadChange).not.toHaveBeenCalled();
  });
});
