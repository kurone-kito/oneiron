# 📄 Yarn project boilerplate

## Features

- Yarn with PnP
- TypeScript
- ESLint
- Prettier
- Visual Studio Code / Vim ready
- CI / CD configurations
  - Dependabot
  - GitHub Actions

## System Requirements

- Node.js Gallium LTS (`^16.20.0`)
- Yarn (`>=2.4.3`)

## Install the dependencies

```sh
yarn install
```

## Linting

```sh
yarn run lint
yarn run lint:fix # Lint and auto-fix
```

## Testing

```sh
yarn run test
```

Currently, the command works as an alias for the `yarn run lint` command.

## Cleaning

```sh
yarn run clean
```

## Migrate to NPM

### 1. Remove following files

- `.yarn/`
- `.yarnrc.yml`
- `yarn.lock`

### 2. Apply the following patches

```diff
--- a/.github/workflows/push.yml
+++ b/.github/workflows/push.yml
@@ -13,16 +13,14 @@ jobs:
       - name: Prepare the Node.js version ${{ matrix.node-version }} environment
         uses: actions/setup-node@v2
         with:
-          cache: ${{ !env.ACT && 'yarn' || '' }}
+          cache: ${{ !env.ACT && 'npm' || '' }}
           node-version: ${{ matrix.node-version }}
-      - name: Install the Yarn
-        run: npm install --global yarn@berry
+      - name: set npm config
+        run: npm config set unsafe-perm true
       - env:
           HUSKY: 0
         name: Install the dependencies
-        run: yarn install --inline-builds
+        run: npm ci
       - name: Run the tests
-        run: yarn run test
+        run: npm test
     strategy:
       matrix:
         node-version:
```

```diff
--- a/.husky/commit-msg
+++ b/.husky/commit-msg
@@ -4,4 +4,4 @@

 . "$(dirname "$0")/_/husky.sh"

-yarn exec commitlint --edit "${1}"
+npx --no-install commitlint --edit "${1}"
```

```diff
--- a/.husky/pre-commit
+++ b/.husky/pre-commit
@@ -4,4 +4,4 @@

 . "$(dirname "$0")/_/husky.sh"

-yarn exec pretty-quick --staged
+npx --no-install pretty-quick --staged
```

```diff
--- a/.vim/coc-settings.json
+++ b/.vim/coc-settings.json
@@ -1,6 +1,4 @@
 {
-  "eslint.nodePath": ".yarn/sdks",
-  "eslint.packageManager": "yarn",
-  "tsserver.tsdk": ".yarn/sdks/typescript/lib",
+  "tsserver.tsdk": "node_modules/typescript/lib",
   "workspace.workspaceFolderCheckCwd": false
 }
```

```diff
--- a/.vscode/settings.json
+++ b/.vscode/settings.json
@@ -1,11 +1,6 @@
 {
-  "eslint.nodePath": ".yarn/sdks",
-  "eslint.packageManager": "yarn",
   "files.watcherExclude": {
-    "**/.eslintcache": true,
-    "**/.pnp.*": true,
-    "**/.yarn/cache/**": true,
-    "**/.yarn/unplugged/**": true
+    "**/.eslintcache": true
   },
   "json.schemas": [
     {
@@ -13,11 +8,6 @@
       "url": "https://raw.githubusercontent.com/streetsidesoftware/cspell/main/packages/cspell-types/cspell.schema.json"
     }
   ],
-  "prettier.prettierPath": ".yarn/sdks/prettier/index.js",
-  "search.exclude": {
-    "**/.pnp.*": true,
-    "**/.yarn": true
-  },
   "typescript.enablePromptUseWorkspaceTsdk": true,
-  "typescript.tsdk": ".yarn/sdks/typescript/lib"
+  "typescript.tsdk": "node_modules/typescript/lib"
 }
```

```diff
--- a/cspell.config.yml
+++ b/cspell.config.yml
@@ -15,10 +15,8 @@ ignorePaths:
   - .git/objects
   - .github/CODE_OF_CONDUCT.*
   - .vscode
-  - .yarn
   - cspell.config.yml
   - node_modules
-  - yarn.lock
 ignoreWords:
   - kito
   - kurone
```

```diff
--- a/package.json
+++ b/package.json
@@ -15,15 +15,15 @@
   "files": [],
   "scripts": {
     "clean": "rimraf -g \".eslintcache\" \"*.tgz\" \"*.tsbuildinfo\"",
-    "postinstall": "husky install",
-    "lint": "conc -m 1 \"yarn:lint:*:check\"",
+    "lint": "conc -m 1 \"npm:lint:*:check\"",
     "lint:eslint:check": "eslint --cache --cache-strategy=content -f codeframe \"./**/*\"",
-    "lint:eslint:fix": "yarn run lint:eslint:check --fix",
-    "lint:fix": "conc -m 1 \"yarn:lint:*:fix\"",
-    "lint:prettier:check": "yarn run prettier -cu",
-    "lint:prettier:fix": "yarn run prettier -uw",
-    "prettier": "prettier --cache --loglevel=warn \"$@\" \"./**/*\"",
-    "test": "yarn run lint"
+    "lint:eslint:fix": "npm run lint:eslint:check -- --fix",
+    "lint:fix": "conc -m 1 \"npm:lint:*:fix\"",
+    "lint:prettier:check": "npm run prettier -- -cu",
+    "lint:prettier:fix": "npm run prettier -- -uw",
+    "prepare": "husky install",
+    "prettier": "prettier --cache --loglevel=warn \"./**/*\"",
+    "test": "npm run lint"
   },
   "prettier": "@kurone-kito/prettier-config",
   "devDependencies": {
@@ -35,7 +35,6 @@
     "@kurone-kito/typescript-config": "^0.1.2",
     "@typescript-eslint/eslint-plugin": "^5.56.0",
     "@typescript-eslint/parser": "^5.56.0",
-    "@yarnpkg/sdks": "^3.0.0-rc.42",
     "concurrently": "^7.6.0",
     "eslint": "^8.38.0",
     "eslint-config-airbnb-typescript": "^17.0.0",
@@ -60,10 +59,8 @@
     "typescript": "~5.0.4",
     "typescript-eslint-language-service": "^5.0.5"
   },
-  "packageManager": "yarn@3.5.0",
   "engines": {
-    "node": ">=16.20",
-    "yarn": ">=2.4.3"
+    "node": ">=16.20"
   },
   "publishConfig": {
     "access": "public"
```

### 3. Run following command

```sh
npm install
git add -A
git commit -m "feat: migrate to NPM from Yarn"
```

## Rules for Development

Introduce commit message validation at commit time.
“**[Conventional Commits](https://www.conventionalcommits.org/ja/)**”
rule is applied to discourage committing messages that violate conventions.

## LICENSE

MIT
