module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  plugins: [
    'jest'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Error Prevention
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'warn',
    'no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_' 
    }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-imports': 'error',
    
    // Code Quality
    'complexity': ['warn', { max: 10 }],
    'max-depth': ['warn', { max: 4 }],
    'max-lines-per-function': ['warn', { max: 50 }],
    'max-params': ['warn', { max: 5 }],
    'no-magic-numbers': ['warn', { 
      ignore: [-1, 0, 1, 2, 100, 1000],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true
    }],
    
    // Best Practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-throw-literal': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'prefer-arrow-callback': 'warn',
    'prefer-template': 'warn',
    
    // Style (handled by Prettier, but some logical rules)
    'consistent-return': 'warn',
    'default-case': 'warn',
    'no-else-return': 'warn',
    'no-lonely-if': 'warn',
    'no-nested-ternary': 'warn',
    'no-unneeded-ternary': 'warn',
    
    // Documentation
    'require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
        ArrowFunctionExpression: false,
        FunctionExpression: false
      }
    }],
    'valid-jsdoc': ['warn', {
      requireReturn: false,
      requireReturnDescription: false,
      requireParamDescription: true
    }]
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/__tests__/**/*.js'],
      env: {
        jest: true
      },
      rules: {
        'no-magic-numbers': 'off',
        'max-lines-per-function': 'off',
        'require-jsdoc': 'off'
      }
    }
  ],
  globals: {
    // Browser globals that might not be detected
    'fetch': 'readonly',
    'localStorage': 'readonly',
    'sessionStorage': 'readonly',
    'FormData': 'readonly',
    'URLSearchParams': 'readonly'
  }
};