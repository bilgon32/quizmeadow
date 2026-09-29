# Authoring QuizMeadow study content

1. Read `AUTHORING.md` for the folder contract, scoring semantics, and question-type examples.
2. Create or update `category.yaml`, `unit.yaml`, and a quiz `.yaml` inside its unit folder. Keep stable IDs for the same learning objective.
3. Verify correct answers and explanations against primary sources. Include source URLs when a factual claim depends on current documentation. Write original learning questions, not exam dumps.
4. When the project and Node are available, run the QuizMeadow project's `npm run validate -- /absolute/path/to/this/library`. Otherwise, ask the learner to check the files in the app and report any validation errors. Completion means all files validate, referenced answer IDs exist, rubrics add up, and every prompt has a clear expected answer.

Quiz content is YAML data with Markdown text. App code is unnecessary for authoring. Completed attempts are stored elsewhere and must be preserved.
