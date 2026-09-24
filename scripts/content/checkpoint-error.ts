import { CheckpointAuthError, CheckpointConfigurationError } from './checkpoint-command';
import { CheckpointValidationError } from './checkpoint-render';

const UNKNOWN_CHECKPOINT_ERROR = 'CMS checkpoint failed';

export function formatCheckpointError(error: unknown): string {
  if (error instanceof CheckpointConfigurationError
    || error instanceof CheckpointAuthError
    || error instanceof CheckpointValidationError) {
    return error.message;
  }
  return UNKNOWN_CHECKPOINT_ERROR;
}
