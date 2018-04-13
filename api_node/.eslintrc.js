// rules: 0 = off, 1 = warn, 2 = error
module.exports = {
    'extends': [
        'eslint:recommended',
        'google',
    ],
    'parserOptions': {
        'ecmaVersion': 7,
    },
    'rules': {
        'padded-blocks': 0,
        'camelcase': 'off',
        'object-curly-spacing': 'off',
        'max-len': ['error', { 'code': 1000, }],
        'no-console': 'off',
        'new-cap': 'off',
        'no-trailing-spaces': 'off',
        'arrow-parens': 'off',
    },
    'env': {
        'es6': true,
        'node': true,
    },
};
