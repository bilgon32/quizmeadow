# Contributing to QuizMeadow

Thanks for helping make studying easier. Useful contributions include bug fixes, clearer documentation, accessible layouts, reliable scoring, and approachable examples.

## Develop locally

Install Node.js 22.16 or later, clone or download the repository, then run:

```sh
npm ci
npm run dev
```

The app uses Electron, React, TypeScript, Zod, and YAML. The main process owns filesystem access and persistence; the renderer displays content and collects responses.

Read [AGENTS.md](AGENTS.md) for development conventions. For creating or changing quiz files, read [library/AGENTS.md](library/AGENTS.md) and [library/AUTHORING.md](library/AUTHORING.md).

The bundled library should contain only the everyday introduction tour. Test-only quizzes belong in `tests/fixtures`. Users can create libraries for any subject.

## Verify a change

```sh
npm run check
npm run test:desktop
npm run test:visual
```

The first command checks TypeScript, scoring/persistence tests, and starter-library validity. The second builds the app and tests the desktop study workflow with isolated data. Close a running development app first so Electron's single-instance lock does not interfere.

For scoring or persistence changes, add meaningful tests. For UI changes, inspect the relevant screens in both themes at the 960 px minimum width. Keep main text readable and respect Reduce Motion.

After a production build, run `node scripts/screenshots.mjs` to capture the current interface in `docs/screenshots/v<app-version>/`. Update the README image links to that folder. Use a new versioned path when the design changes so image caches cannot keep showing the previous interface. Screenshots must come from isolated demo data. They should never contain a contributor's real study history, notes, or personal paths.

## Build the Mac app

```sh
npm run package:mac
```

This creates `release/mac-arm64/QuizMeadow.app` for Apple Silicon. To create an Intel bundle:

```sh
npm run build
npx electron-builder --mac dir --x64
```

To create ZIP archives for both architectures:

```sh
npm run dist:mac
```

Output is written to `release/`. Community builds are ad-hoc signed and unnotarized. The build verifies the final app resource seal, then extracts both ZIPs to check their signatures, version, and CPU architecture. `npm run verify:mac -- --test-tamper` also confirms a modified resource is rejected and writes SHA256SUMS.txt. Run `npm run test:packaged` afterward to launch the extracted ZIP matching your Mac and check its bundled content, fonts, secure renderer, restart, and save-on-quit behavior. Only the Apple Silicon app has been run locally; an Intel archive must be tested on an Intel Mac before claiming that platform is verified.

The GitHub Actions **Check** workflow runs checks and the macOS desktop flow. The manually started **Build Mac archives** workflow creates downloadable build artifacts; it does not publish a GitHub Release automatically. Ad-hoc signing is configured; Apple Developer ID signing and notarization are not. The first-open instructions are in [MAC-FIRST-OPEN.md](docs/MAC-FIRST-OPEN.md).

## Visual identity

Read [the brand implementation record](docs/BRAND.md). Use the bundled semantic tokens and fonts. Keep the shared optical base unchanged and preserve the project-specific study glyph. Font license texts are bundled in THIRD_PARTY_NOTICES.md.

Run `npm run icon` on macOS to regenerate the committed app icon from the SVGs, and `npm run test:visual` to check both themes, narrow layouts, keyboard focus, text contrast, and all question formats. The icon export tool is pinned to keep raster exports reproducible. Refresh documentation screenshots after visual changes.

## Data during development

Set `QUIZMEADOW_DATA_DIR` and `QUIZMEADOW_LIBRARY_DIR` to temporary folders when using a test library. `tests/desktop.mjs` handles this automatically. Legacy `RECALL_*` variables remain supported.

The pre-release app was named Recall. Existing installations with study data (library, attempts, session, reviews, or settings) continue to use the original `recall-study` data folder, preserving history and the selected library. New installations use `quizmeadow`. Settings displays the actual location. App updates never rewrite user-authored libraries automatically.

Keep local data, private quizzes, credentials, and build outputs out of commits.

## Send a contribution

Open an issue for a bug with reproduction steps, your macOS version, and the relevant error message. For a pull request, explain the problem, the resulting behavior, and how you checked it. Keep changes focused.

Contributions are distributed under the project's [MIT license](LICENSE). Dependencies retain their own licenses.
