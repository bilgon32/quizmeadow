# Validation record

Verified on this Apple Silicon Mac on September 29, 2026 (local time).

- TypeScript: passes.
- Unit tests: 36 pass, covering all scoring formats, validation, partial credit, deadlines, immutable snapshots, restart/resume, checked-answer locking, corruption backup, duplicate submission, interrupted-completion recovery, and review scheduling.
- Starter library: 1 category, 1 unit, 1 introduction quiz, 10 questions; no validation errors.
- Desktop flow: all ten question types; exam feedback withholding; correct weighted total of 27/27; written/code self-assessment; restart/resume; JSON/CSV/Markdown exports; invalid-file isolation; practice feedback locking; bookmarks; mistake practice; mixed unit selection; save-on-quit; timed automatic submission; dark-theme text contrast.
- Typography: 16 px main text, 14 px secondary text, 24 px question prompts, and a 12 px minimum for small labels. Visually checked at 1380 px and the 960 px minimum window width, including light/dark themes, setup, choice, ordering, matching, fill-in, written, and code layouts; no horizontal overflow.
- Packaged QuizMeadow.app: the Apple Silicon ZIP was extracted and verified with bundled dependencies and starter content, renderer context isolation, sandbox enabled, Node integration disabled, quiz interaction, and persistence after quitting.

Tests use isolated temporary data directories and leave the user's study history untouched.

Both Mac archives build successfully; Intel is experimental and has not been verified on Intel hardware. The apps are unsigned and unnotarized. Code responses are self-assessed and are never executed. The starter tour uses everyday examples, including a plain-text shopping list for the structured-text editor. Additional desktop-test content lives only in tests/fixtures.

The web-chat tutorial's three-file example validates. All local README/tutorial links resolve. Packaged application and dependency license notices are present.
