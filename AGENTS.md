# QuizMeadow development

QuizMeadow is an offline desktop study app. Quiz content belongs to the selected library; session/attempt data belongs to Electron's user-data directory.

- For quiz authoring or content validation, read `library/AGENTS.md` and then `library/AUTHORING.md`.
- Runtime content validation is authoritative in `src/shared/schema.ts`. After changing its contract, regenerate schemas with `npm run schema` and update the authoring examples.
- Scoring is authoritative in `src/shared/scoring.ts`; cover grading changes with meaningful tests.
- Main-process code owns file access and persisted session snapshots. Renderer input may update responses and navigation, not question content or grading rules.
- Keep attempts immutable and writes atomic. Preserve old results when quizzes change.
- Render local content without raw HTML, remote images, executable code, or renderer Node access.
- Verify `npm run check`, production build, and the relevant desktop flow before claiming completion.

- Bundle only the everyday introduction tour. Additional test content belongs in test fixtures, not the starter library.
