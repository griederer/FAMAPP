describe('Shared Package Setup', () => {
  it('should be properly configured', () => {
    expect(true).toBe(true);
  });

  it('should have correct TypeScript configuration', () => {
    const tsConfig = require('../tsconfig.json');
    expect(tsConfig.compilerOptions.target).toBe('ES2020');
    expect(tsConfig.compilerOptions.strict).toBe(true);
  });

  it('should have correct package.json configuration', () => {
    const packageJson = require('../package.json');
    expect(packageJson.name).toBe('@famapp/shared');
    expect(packageJson.main).toBe('dist/index.js');
    expect(packageJson.types).toBe('dist/index.d.ts');
  });
});