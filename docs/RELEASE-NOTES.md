# QuizMeadow 1.1.0

QuizMeadow now follows Bruno's visual style: dark green surfaces, local Barlow fonts, warm orange accents, and an optical study mark. Larger reading text, clearer control edges, sharper layouts, visible keyboard focus, and gentle transitions make study sessions easier to use. A separately reviewed light theme remains available; existing theme choices are preserved.

## Fixed Mac packaging

Versions 1.0.0 and 1.0.1 skipped bundle signing, leaving an invalid signature after Electron was repackaged. This caused macOS to report the app as damaged. This release signs the complete app and nested code with an ad-hoc identity. The build checks the final resource seal and checks it again after extracting both ZIPs. A modified-resource check confirms verification rejects changed resources.

**These are community builds: ad-hoc signed, without Apple Developer ID signing or Apple notarization.** macOS can still require explicit first-open approval. See [the first-open guide](https://github.com/bilgon32/quizmeadow/blob/main/docs/MAC-FIRST-OPEN.md) for Open Anyway, integrity checks, and a scoped fallback when necessary.

## Downloads

- **QuizMeadow-mac-arm64.zip** — Apple Silicon Macs (M1 or newer).
- **QuizMeadow-mac-x64.zip** — Intel Macs; experimental, not tested on Intel hardware.
- **SHA256SUMS.txt** — checksums for both archives.
- **MAC-FIRST-OPEN.md** — installation and first-open instructions.

Unzip the matching download, move QuizMeadow.app to Applications, and replace your previous copy. The local library and attempt history are stored separately and remain intact. No build tools, account, or AI service are required.

## Study features

All ten formats, practice/exam modes, weighted scoring, self-assessment, course units, mixed quizzes, bookmarks, confidence tracking, mistake review, spaced review, autosave/resume, and exports remain available. The bundled library contains only the everyday introduction tour. Personal course libraries are not included.

## Validation and limits

TypeScript, 45 scoring/persistence tests, starter-library validation, the complete desktop study flow, and visual/accessibility checks are recorded in [VALIDATION.md](https://github.com/bilgon32/quizmeadow/blob/main/docs/VALIDATION.md). Both archive resource seals, versions, and architectures are checked. The Apple Silicon build is tested locally. Gatekeeper approval without Developer ID and notarization is not claimed; Intel execution needs an Intel Mac.

Automatic updates, Windows/Linux installers, cloud sync, backup import, and AI grading are not included. Written and code responses use self-assessment; code is never executed.
