# QuizMeadow 1.2.0

QuizMeadow has a new product identity and a full interface redesign using Bruno project design system 3.0.1.

- Original meadow-fold logo with size-specific masters and a new Mac icon.
- Calm blue-grey light/dark workspaces and one stable dark identity header.
- Consistent page spacing, plain readable headings, raised course/quiz cards and recessed study readouts.
- Blue actions and guidance, green success, red failure and amber caution/partial credit.
- Native keyboard answer choices, clearer selected/disabled states, focus-safe dialogs and review disclosures.
- Local feedback motion with immediate macOS/local Reduce motion support.
- New installations follow macOS appearance; existing saved preferences remain.

Your categories, units, quizzes, saved sessions and attempt history retain their formats and locations. There is no data migration or new service requirement. The starter library still contains only the everyday introduction tour.

## Download and first open

- **QuizMeadow-mac-arm64.zip** — Apple Silicon Macs.
- **QuizMeadow-mac-x64.zip** — Intel Macs, experimental; not tested on Intel hardware.
- **SHA256SUMS.txt** — integrity checksums.
- **MAC-FIRST-OPEN.md** — first-open instructions.

Unzip, move QuizMeadow to Applications, then open it. These community packages are ad-hoc signed and unnotarized. If macOS blocks first launch, use the [first-open guide](https://github.com/bilgon32/quizmeadow/blob/main/docs/MAC-FIRST-OPEN.md). Replacing the app preserves the library and history in their separate folders.

## Validation

Typecheck, 45 tests, starter-library validation, production build, all ten desktop question flows, saved-session restart/quit, exports, and full design review passed. Rendered checks covered both themes, all routes, 320px reflow, 200% text/zoom, keyboard focus, prerequisites, outcomes, and interrupted reduced motion. Both Mac archives must pass version/architecture/signature checks and tamper rejection, and the Apple Silicon packaged flow must pass before publication. Intel launch and native layered icon variants remain untested.
