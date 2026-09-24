import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type PackageManifest = {
  readonly scripts?: { readonly doctor?: string };
  readonly devDependencies?: { readonly ['react-doctor']?: string };
};

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as PackageManifest;

describe('doctor script contract', () => {
  it('uses the local exact react-doctor dependency without mutable resolution', () => {
    // Given
    const doctorScript = packageJson.scripts?.doctor;
    const doctorVersion = packageJson.devDependencies?.['react-doctor'];

    // When
    const usesMutableResolution = doctorScript?.includes('npx') || doctorScript?.includes('@latest');

    // Then
    expect(doctorScript).toBe('react-doctor');
    expect(doctorVersion).toBe('0.9.12');
    expect(usesMutableResolution).toBe(false);
  });
});
