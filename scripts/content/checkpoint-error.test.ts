import { describe, expect, it } from 'vitest';
import { CheckpointAuthError, CheckpointConfigurationError } from './checkpoint-command';
import { CheckpointFileCleanupError } from './checkpoint-file';
import { CheckpointValidationError } from './checkpoint-render';
import { formatCheckpointError } from './checkpoint-error';

describe('formatCheckpointError', () => {
  it.each([
    [
      new CheckpointConfigurationError('controlled configuration failure'),
      'controlled configuration failure',
    ],
    [
      new CheckpointAuthError('authentication-failed', 'controlled authentication failure'),
      'controlled authentication failure',
    ],
    [
      new CheckpointValidationError(['wrong-count'], 'controlled validation failure'),
      'controlled validation failure',
    ],
  ] satisfies readonly (readonly [Error, string])[])('retains the controlled message for %s', (error, message) => {
    expect(formatCheckpointError(error)).toBe(message);
  });

  it.each([
    [new Error('attacker message', { cause: new Error('attacker cause') })],
    [new CheckpointFileCleanupError(['remove'], new Error('attacker cause'))],
    ['attacker string'],
    [42],
    [null],
    [undefined],
    [{ name: 'attacker object', message: 'attacker message' }],
  ] satisfies readonly (readonly [unknown])[])('uses one fixed message for unknown failures: %j', (error) => {
    expect(formatCheckpointError(error)).toBe('CMS checkpoint failed');
  });

  it('does not emit attacker-controlled names, messages, causes, or control characters', () => {
    const error = new Error('message\u001b[31m\nforged stderr line', {
      cause: new Error('cause\u0000marker'),
    });
    error.name = 'name\u001b[2J\rforged';

    const message = formatCheckpointError(error);

    expect(message).toBe('CMS checkpoint failed');
    expect(message).not.toMatch(/[\u0000-\u001f\u007f]/);
  });
});
