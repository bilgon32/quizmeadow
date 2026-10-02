# Validation record

Validated on an Apple Silicon Mac on October 2, 2026, for QuizMeadow 1.2.0. Detailed design adoption evidence is in [design-review-3.0.1.md](design-review-3.0.1.md).

- TypeScript and 45 scoring, persistence, recovery and migration tests; valid bundled everyday tour (1 category, 1 unit, 1 quiz, all 10 formats).
- Full desktop flow: weighted 27/27 scoring, practice/exam feedback, self-assessment, restart/resume, exports, bookmarks, mistake practice, mixed selection, save-on-quit, timed submission and invalid-file isolation.
- Both themes, all routes and representative outcomes; shared heading baselines and frame gutters; 1380/960/320px layouts; 200% text and zoom; sampled contrast ≥4.5:1 and 48px action buttons. Native radio keyboard selection, modal containment/dismissal/focus return, review disclosure reversal, persistent blue prerequisites, skip link, and immediate OS/local reduced motion passed.
- Original meadow-fold geometry: micro/standard/display masters, positive/negative and theme variants, transparent 1×/2× exports, actual-size review on three backgrounds and Mac ICNS. Font licensing/provenance is bundled. Design system 3.0.1 has no managed asset drift.
- Saved settings retain their values; only new installations default to System appearance. No schema, scoring, session, attempt or library migration is introduced.

## Release verification

`npm run dist:mac` signs the complete arm64 and x64 app bundles with an ad-hoc identity. The after-sign hook requires strict recursive signature verification. The archive verifier extracts each ZIP and checks its resource seal, version, CPU architecture, and expected app name, then writes SHA256SUMS.txt. `npm run verify:mac -- --test-tamper` confirms that a changed bundled resource is rejected.

The packaged Apple Silicon app is also launched with temporary data to check secure renderer settings, the bundled tour, quiz interaction, persistence after quitting, and the new visual assets. Intel archives receive integrity and architecture checks; Intel execution has not been tested on Intel hardware.

## First-open boundary

The historical 1.0.1 bundle failed strict verification with “code has no resources but signature indicates they must be present.” Signing an unchanged copy repaired the resource seal, isolating skipped signing as the cause. Both version 1.1.0 archives passed that same check after ZIP extraction. The modified-resource rejection check and the packaged Apple Silicon restart/save-on-quit checks also passed.

Community builds remain **without Apple Developer ID signing or Apple notarization**. A valid ad-hoc seal does not make them automatically trusted by Gatekeeper. Explicit first-open approval can still be required; see [MAC-FIRST-OPEN.md](MAC-FIRST-OPEN.md). This release does not claim an Apple-notarized launch experience.

All desktop tests and documentation screenshots use isolated temporary libraries and data. The user's course library and attempt history are not included or edited. Code responses remain plain text and are never executed. The README and agent/web-chat guides continue to recommend releases as the main installation path.
