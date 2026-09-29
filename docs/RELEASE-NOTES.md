# QuizMeadow 1.0.0

An offline study app for growing what you know, one quiz at a time.

## Download and use

- **QuizMeadow-mac-arm64.zip**: Apple Silicon Macs (M1 and later).
- **QuizMeadow-mac-x64.zip**: Intel Macs — experimental; built but not tested on an Intel Mac.
- **SHA256SUMS.txt**: checksums for both downloads.

Unzip the download, move QuizMeadow.app to Applications, and open it. No Node.js, Terminal, account, or AI subscription is needed to run the app.

These builds are **unsigned and unnotarized**. macOS may restrict opening a downloaded copy. Review the source and Apple's guidance linked in the README before deciding to open it.

## Included

- A friendly introduction tour with all ten question styles and everyday examples.
- Practice and exam modes, weighted points, optional partial credit, and self-assessment for open responses.
- Categories, units, mixed quizzes, bookmarks, confidence tracking, mistake practice, and spaced review.
- Autosave and resume, immutable attempt history, timers, and JSON/CSV/Markdown exports.
- Light/dark themes, readable text, keyboard navigation, and reduced-motion support.
- An agent-friendly YAML format, authoring guide, and copy-and-paste tutorial for free web chats.
- MIT-licensed source and bundled dependency notices.

## Validation

36 scoring/persistence tests and the complete desktop study workflow passed. The packaged Apple Silicon app was checked for bundled content, secure renderer settings, quiz interaction, and saving on quit. The Intel archive is provided for testing and has not been verified on Intel hardware.

## Existing pre-release users

The app was previously called Recall. Existing local settings and attempt history remain in their original data folder. New installations start with just the introduction tour. Updating the app does not automatically rewrite a custom study library.

## Current limitations

Windows and Linux installers, automatic updates, cloud sync, automatic backup import, and AI grading are not included. Short answers use explicit accepted strings. Written and code responses are self-assessed; code is never executed.
