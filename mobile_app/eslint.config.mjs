// eslint.config.mjs
import expo from 'eslint-config-expo';
import tsEslint from 'typescript-eslint';

export default [
    ...expo,
    ...tsEslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@/modules/reader/*', '**/modules/reader/*'],
                            message: 'DDD Violation: Import from public API ("@/modules/reader") only.',
                        },
                    ],
                },
            ],
        },
    },
    {
        // Exception for inside the module
        files: ['src/modules/reader/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': 'off',
        },
    },
];
