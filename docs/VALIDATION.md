# Validation record

Validated on an Apple Silicon Mac on September 30, 2026, for version 1.1.0.

- TypeScript and 45 scoring, persistence, recovery, and migration tests.
- Valid starter library: 1 category, 1 unit, 1 everyday introduction quiz, 10 questions.
- Desktop workflow: all ten formats, practice/exam feedback, weighted 27/27 scoring, written/structured-text self-assessment, restart/resume, exports, checked-answer locking, bookmarks, mistake practice, mixed selection, save-on-quit, timed submission, and invalid-file isolation.
- Rendered visual checks: dark and light themes at 1380/960/320 px; all ten formats at the supported 960 px minimum; selected/checked answers; representative text contrast of at least 4.5:1; 48 px action targets; modal keyboard focus; skip link; Reduce Motion. No horizontal page overflow in checked screens.
- Typography: local Barlow 400/600 and Barlow Condensed 600; 18 px main text, 16 px secondary, 14 px labels, and 26 px question prompts. The supported minimum Mac window is 960 px; 320 px is a layout stress test.
- Brand mark: unchanged optical base with a study-specific foreground, reviewed at 128/64/32 px. Small icons use the monochrome silhouette. Font OFL notices are included in THIRD_PARTY_NOTICES.md.

## Release verification

`npm run dist:mac` signs the complete arm64 and x64 app bundles with an ad-hoc identity. The after-sign hook requires strict recursive signature verification. The archive verifier extracts each ZIP and checks its resource seal, version, CPU architecture, and expected app name, then writes SHA256SUMS.txt. `npm run verify:mac -- --test-tamper` confirms that a changed bundled resource is rejected.

The packaged Apple Silicon app is also launched with temporary data to check secure renderer settings, the bundled tour, quiz interaction, persistence after quitting, and the new visual assets. Intel archives receive integrity and architecture checks; Intel execution has not been tested on Intel hardware.

## First-open boundary

The prior 1.0.1 bundle failed strict verification with “code has no resources but signature indicates they must be present.” Signing an unchanged copy repaired the resource seal, isolating skipped signing as the cause. Both version 1.1.0 archives passed that same check after ZIP extraction. The modified-resource rejection check and the packaged Apple Silicon restart/save-on-quit checks also passed.

Community builds remain **without Apple Developer ID signing or Apple notarization**. A valid ad-hoc seal does not make them automatically trusted by Gatekeeper. Explicit first-open approval can still be required; see [MAC-FIRST-OPEN.md](MAC-FIRST-OPEN.md). This release does not claim an Apple-notarized launch experience.

All desktop tests and documentation screenshots use isolated temporary libraries and data. The user's course library and attempt history are not included or edited. Code responses remain plain text and are never executed. The README and agent/web-chat guides continue to recommend releases as the main installation path.
