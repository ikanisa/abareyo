# Repository Structure Report
Generated: 2025-11-02T12:16:44.461Z

## Current Workspace Layout

```
.
├── android
│   ├── app
│   └── gradle
├── app
│   ├── (onboarding)
│   ├── (routes)
│   ├── _components
│   ├── _config
│   ├── _data
│   ├── _lib
│   ├── admin
│   ├── api
│   ├── community
│   ├── gate
│   ├── legal
│   ├── link
│   ├── matchday
│   ├── members
│   ├── membership
│   ├── more
│   ├── mytickets
│   ├── onboarding
│   ├── orders
│   ├── profile
│   ├── services
│   ├── settings
│   ├── shop
│   ├── support
│   ├── tickets
│   └── wallet
├── apps
│   ├── admin
│   ├── mobile
│   └── web
├── audit
│   └── smoke-tests
├── backend
│   ├── prisma
│   ├── src
│   ├── test
│   └── tools
├── changelogs
├── config
│   └── compliance
├── docs
│   ├── admin
│   ├── adr
│   ├── architecture
│   ├── backend
│   ├── deployment
│   ├── design-system
│   ├── grafana
│   ├── k8s
│   ├── launch
│   ├── mobile
│   ├── observability
│   ├── operations
│   ├── runbooks
│   ├── supabase
│   └── workshops
├── infra
│   ├── caddy
│   ├── cloudflared
│   └── storage
├── ios
│   ├── Auth
│   └── AuthTests
├── k8s
├── lib
│   └── server
├── packages
│   ├── api
│   ├── config
│   ├── contracts
│   ├── design-tokens
│   ├── mobile
│   └── ui
├── plans
│   └── future
├── providers
├── public
│   ├── community
│   ├── media
│   ├── news
│   ├── partners
│   ├── shop
│   ├── tickets
│   └── workbox-v6.5.4
├── report
│   ├── checklists
│   ├── ci
│   ├── patches
│   └── sbom
├── reports
│   ├── ci
│   ├── cleanup
│   ├── refactor
│   └── sbom
├── routes
├── scripts
│   ├── ci
│   ├── cleanup
│   ├── db
│   ├── mac
│   └── reports
├── src
│   ├── components
│   ├── config
│   ├── hooks
│   ├── integrations
│   ├── lib
│   ├── providers
│   ├── services
│   ├── types
│   └── views
├── supabase
│   ├── functions
│   ├── migrations
│   ├── seed
│   └── supabase
├── tests
│   ├── e2e
│   ├── msw
│   ├── perf
│   └── unit
└── tools
    ├── ci
    ├── gsm-emulator
    ├── link-audit
    ├── scripts
    └── ussd-compliance

132 directories

```

## Package Directory Contents

### packages/
total 32
drwxrwxr-x  8 runner runner 4096 Nov  2 12:09 .
drwxr-xr-x 30 runner runner 4096 Nov  2 12:11 ..
drwxrwxr-x  4 runner runner 4096 Nov  2 12:09 api
drwxrwxr-x  3 runner runner 4096 Nov  2 12:09 config
drwxrwxr-x  5 runner runner 4096 Nov  2 12:14 contracts
drwxrwxr-x  4 runner runner 4096 Nov  2 12:14 design-tokens
drwxrwxr-x  9 runner runner 4096 Nov  2 12:11 mobile
drwxrwxr-x  3 runner runner 4096 Nov  2 12:09 ui


### apps/
total 20
drwxrwxr-x  5 runner runner 4096 Nov  2 12:09 .
drwxr-xr-x 30 runner runner 4096 Nov  2 12:11 ..
drwxrwxr-x  2 runner runner 4096 Nov  2 12:09 admin
drwxrwxr-x  2 runner runner 4096 Nov  2 12:09 mobile
drwxrwxr-x  2 runner runner 4096 Nov  2 12:09 web


## Key Configuration Files

- tsconfig.json (root)
- tsconfig.build.json
- eslint.config.js
- vitest.config.ts
- playwright.config.ts
- next.config.mjs
- package.json (workspaces: packages/*, apps/*, docs)

## Current Packages

---
{
  "name": "@abareyo/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {}
}
---
{
  "name": "@rayon/contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./onboarding": {
      "types": "./src/onboarding.ts",
      "default": "./src/onboarding.ts"
    },
    "./commerce": {
      "types": "./src/commerce.ts",
      "default": "./src/commerce.ts"
    },
    "./services": {
      "types": "./src/services.ts",
      "default": "./src/services.ts"
    },
    "./rewards": {
      "types": "./src/rewards.ts",
      "default": "./src/rewards.ts"
    },
    "./news": {
      "types": "./src/news.ts",
      "default": "./src/news.ts"
    },
    "./members": {
      "types": "./src/members.ts",
      "default": "./src/members.ts"
    }
  }
}
---
{
  "name": "@abareyo/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {}
}
---
{
  "name": "@abareyo/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {}
}
---
{
  "name": "@rayon/mobile",
  "private": true,
  "version": "0.1.0",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "lint": "eslint . --ext .ts,.tsx",
    "test:smoke": "jest --config jest.config.cjs"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.23.1",
    "@rayon/design-tokens": "file:../design-tokens",
    "@shopify/react-native-skia": "^1.3.4",
    "@tanstack/react-query": "^5.83.0",
    "expo": "~51.0.0",
    "expo-linear-gradient": "~13.0.0",
    "expo-router": "^3.5.16",
    "lottie-react-native": "^6.7.0",
    "react": "18.3.1",
    "react-native": "0.76.6",
    "react-native-gesture-handler": "^2.21.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.23",
    "@types/react-native": "^0.73.0",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.3.2",
    "typescript": "^5.8.3"
  }
}
---
{
  "name": "@rayon/mobile-widgets",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./feature-toggles": {
      "types": "./src/feature-toggles.ts",
      "default": "./src/feature-toggles.ts"
    }
  }
}
---
{
  "name": "lightningcss",
  "version": "1.19.0",
  "license": "MPL-2.0",
  "description": "A CSS parser, transformer, and minifier written in Rust",
  "main": "node/index.js",
  "types": "node/index.d.ts",
  "exports": {
    "import": "./node/index.mjs",
    "require": "./node/index.js"
  },
  "browserslist": "last 2 versions, not dead",
  "targets": {
    "main": false,
    "types": false
  },
  "publishConfig": {
    "access": "public"
  },
  "funding": {
    "type": "opencollective",
    "url": "https://opencollective.com/parcel"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/parcel-bundler/lightningcss.git"
  },
  "engines": {
    "node": ">= 12.0.0"
  },
  "napi": {
    "name": "lightningcss"
  },
  "files": [
    "node/*.js",
    "node/*.mjs",
    "node/*.d.ts",
    "node/*.flow"
  ],
  "dependencies": {
    "detect-libc": "^1.0.3"
  },
  "devDependencies": {
    "@codemirror/lang-css": "^6.0.1",
    "@codemirror/lang-javascript": "^6.1.2",
    "@codemirror/lint": "^6.1.0",
    "@codemirror/theme-one-dark": "^6.1.0",
    "@mdn/browser-compat-data": "^5.2.35",
    "@napi-rs/cli": "^2.14.0",
    "autoprefixer": "^10.4.13",
    "codemirror": "^6.0.1",
    "cssnano": "^5.0.8",
    "esbuild": "^0.13.10",
    "flowgen": "^1.21.0",
    "jest-diff": "^27.4.2",
    "json-schema-to-typescript": "^11.0.2",
    "markdown-it-anchor": "^8.6.6",
    "markdown-it-prism": "^2.3.0",
    "markdown-it-table-of-contents": "^0.6.0",
    "napi-wasm": "^1.0.1",
    "node-fetch": "^3.1.0",
    "parcel": "^2.8.2",
    "patch-package": "^6.5.0",
    "path-browserify": "^1.0.1",
    "postcss": "^8.3.11",
    "posthtml-include": "^1.7.4",
    "posthtml-markdownit": "^1.3.1",
    "posthtml-prism": "^1.0.4",
    "process": "^0.11.10",
    "puppeteer": "^12.0.1",
    "sharp": "^0.31.1",
    "util": "^0.12.4",
    "uvu": "^0.5.6"
  },
  "resolutions": {
    "lightningcss": "link:."
  },
  "scripts": {
    "prepare": "patch-package",
    "build": "node scripts/build.js && node scripts/build-flow.js",
    "build-release": "node scripts/build.js --release && node scripts/build-flow.js",
    "prepublishOnly": "node scripts/build-flow.js",
    "wasm:build": "cargo build --target wasm32-unknown-unknown -p lightningcss_node && cp target/wasm32-unknown-unknown/debug/lightningcss_node.wasm wasm/. && node scripts/build-wasm.js",
    "wasm:build-release": "cargo build --target wasm32-unknown-unknown -p lightningcss_node --release && cp target/wasm32-unknown-unknown/release/lightningcss_node.wasm wasm/. && node scripts/build-wasm.js",
    "website:start": "parcel 'website/*.html' website/playground/index.html",
    "website:build": "yarn wasm:build-release && parcel build 'website/*.html' website/playground/index.html",
    "build-ast": "cargo run --example schema --features jsonschema && node scripts/build-ast.js",
    "test": "uvu node/test"
  },
  "optionalDependencies": {
    "lightningcss-darwin-x64": "1.19.0",
    "lightningcss-linux-x64-gnu": "1.19.0",
    "lightningcss-win32-x64-msvc": "1.19.0",
    "lightningcss-darwin-arm64": "1.19.0",
    "lightningcss-linux-arm64-gnu": "1.19.0",
    "lightningcss-linux-arm-gnueabihf": "1.19.0",
    "lightningcss-linux-arm64-musl": "1.19.0",
    "lightningcss-linux-x64-musl": "1.19.0"
  }
}
---
{
  "name": "commander",
  "version": "7.2.0",
  "description": "the complete solution for node.js command-line programs",
  "keywords": [
    "commander",
    "command",
    "option",
    "parser",
    "cli",
    "argument",
    "args",
    "argv"
  ],
  "author": "TJ Holowaychuk <tj@vision-media.ca>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/tj/commander.js.git"
  },
  "scripts": {
    "lint": "eslint index.js esm.mjs \"tests/**/*.js\"",
    "typescript-lint": "eslint typings/*.ts tests/*.ts",
    "test": "jest && npm run test-typings",
    "test-esm": "node --experimental-modules ./tests/esm-imports-test.mjs",
    "test-typings": "tsd",
    "typescript-checkJS": "tsc --allowJS --checkJS index.js --noEmit",
    "test-all": "npm run test && npm run lint && npm run typescript-lint && npm run typescript-checkJS && npm run test-esm"
  },
  "main": "./index.js",
  "files": [
    "index.js",
    "esm.mjs",
    "typings/index.d.ts",
    "package-support.json"
  ],
  "type": "commonjs",
  "dependencies": {},
  "devDependencies": {
    "@types/jest": "^26.0.20",
    "@types/node": "^14.14.20",
    "@typescript-eslint/eslint-plugin": "^4.12.0",
    "@typescript-eslint/parser": "^4.12.0",
    "eslint": "^7.17.0",
    "eslint-config-standard": "^16.0.2",
    "eslint-plugin-jest": "^24.1.3",
    "jest": "^26.6.3",
    "standard": "^16.0.3",
    "ts-jest": "^26.5.1",
    "tsd": "^0.14.0",
    "typescript": "^4.1.2"
  },
  "types": "typings/index.d.ts",
  "jest": {
    "testEnvironment": "node",
    "collectCoverage": true,
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
    "testPathIgnorePatterns": [
      "/node_modules/"
    ]
  },
  "engines": {
    "node": ">= 10"
  },
  "support": true
}
---
{
  "name": "color-name",
  "version": "1.1.3",
  "description": "A list of color names and its values",
  "main": "index.js",


## Target Structure (GIKUNDIRO Spec)

### Packages (Shared)
- packages/ui - Design system, tokens, components
- packages/config - ESLint, Prettier, TSConfig base
- packages/api - API client, Supabase types, zod schemas
- packages/contracts - Shared DTOs (already exists)
- packages/design-tokens - Theme tokens (already exists)
- packages/mobile - Mobile app components (already exists)

### Apps
- apps/web - Next.js PWA (to be linked from root app/)
- apps/admin - Next.js Admin (to be enhanced)
- apps/mobile - Expo RN app (already exists as packages/mobile)

### Backend
- supabase/ - SQL migrations + Edge Functions

### Docs
- docs/ - Runbooks, env, release, security

## Gap Analysis

### Existing ✅
- packages/config (partial)
- packages/ui (partial)
- packages/api (partial)
- packages/contracts
- packages/design-tokens
- packages/mobile
- apps/admin (skeleton)
- apps/web (skeleton)

### Needs Enhancement 🔧
- packages/ui - Add liquid glass components
- packages/api - Add typed Supabase clients
- packages/config - Add ESLint/Prettier configs
- apps/admin - Apply design system
- PWA manifest and service worker

### Missing ❌
- Comprehensive testing setup (vitest not finding tests)
- Complete USSD payment components
- Mobile deeplink configuration
- Lighthouse CI integration
- Complete documentation
