module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --max-warnings=0',
    'prettier --write'
  ],
  '*.{css,scss,md,mdx,json,yaml,yml}': 'prettier --write'
};
