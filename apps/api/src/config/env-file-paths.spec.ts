import { resolveEnvFilePaths, resolveEnvFilePathsAscending } from './env-file-paths';

describe('resolveEnvFilePaths', () => {
  it('uses development files when mode is development (including .env.local)', () => {
    expect(resolveEnvFilePaths('development')).toEqual([
      '.env.development.local',
      '.env.local',
      '.env.development',
      '.env',
    ]);
  });

  it('falls back to process.env.NODE_ENV when argument is omitted', () => {
    // Jest sets NODE_ENV=test for this suite.
    expect(resolveEnvFilePaths()).toEqual([
      '.env.test.local',
      '.env.test',
      '.env',
    ]);
  });

  it('excludes .env.local and development files in production', () => {
    expect(resolveEnvFilePaths('production')).toEqual([
      '.env.production.local',
      '.env.production',
      '.env',
    ]);
    expect(resolveEnvFilePaths('Production')).toEqual([
      '.env.production.local',
      '.env.production',
      '.env',
    ]);
  });

  it('excludes .env.local in test', () => {
    expect(resolveEnvFilePaths('test')).toEqual([
      '.env.test.local',
      '.env.test',
      '.env',
    ]);
  });

  it('ascending order reverses for dotenv override layering', () => {
    expect(resolveEnvFilePathsAscending('production')).toEqual([
      '.env',
      '.env.production',
      '.env.production.local',
    ]);
  });
});
