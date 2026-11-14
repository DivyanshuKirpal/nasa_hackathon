import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Import boundaries from ARCHITECTURE.md section 6.
// no-restricted-imports sees the import text, not the resolved file, so an
// import that leaves a folder is caught by the name of the folder it reaches.
const otherSrcFolders =
  'store|features|components|lib|clock|link|data|styles|test|App|main|routes'
const outsideSrcFolders = 'ml|tools|public'

const relativeInto = (folders) => `^\\.{1,2}/(.*/)?(${folders})(\\.tsx?)?(/|$)`

// A bare package import other than zod (scoped packages start with "@").
const packageOtherThanZod = '^(?!zod(/|$))[^./]'

const engineBoundary = [
  {
    regex: packageOtherThanZod,
    message:
      'src/engine imports nothing outside src/engine except zod (ARCHITECTURE.md section 6).',
  },
  {
    regex: relativeInto(`bodyview|${otherSrcFolders}|${outsideSrcFolders}`),
    message:
      'src/engine imports nothing outside src/engine except zod, and never src/bodyview (decision D11).',
  },
]

const bodyviewBoundary = [
  {
    regex: packageOtherThanZod,
    message:
      'src/bodyview imports nothing outside src/bodyview except zod (ARCHITECTURE.md section 6).',
  },
  {
    regex: relativeInto(`engine|${otherSrcFolders}|${outsideSrcFolders}`),
    message:
      'src/bodyview imports nothing outside src/bodyview except zod, and never src/engine (decision D11).',
  },
]

const appBoundary = [
  {
    regex: '^three(/|$)',
    message:
      'three is imported only in src/features/body/viewer/ (ARCHITECTURE.md section 6).',
  },
  {
    regex: relativeInto('ml|tools'),
    message:
      'Nothing in src/ imports from ml/ or tools/; use the generated JSON in src/data/models/.',
  },
]

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/engine/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: engineBoundary }],
    },
  },
  {
    files: ['src/bodyview/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: bodyviewBoundary }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/engine/**',
      'src/bodyview/**',
      'src/features/body/viewer/**',
    ],
    rules: {
      'no-restricted-imports': ['error', { patterns: appBoundary }],
    },
  },
])
