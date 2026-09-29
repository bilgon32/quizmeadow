# QuizMeadow quiz authoring

Create a study library using this structure:

```text
<library-root>/
  <category-folder>/
    category.yaml
    <unit-folder>/
      unit.yaml
      <quiz-name>.yaml
```

The directory names organize files; IDs inside the metadata identify content. Categories can represent whole courses. Units divide a course into modules or topics. Cross-unit tests are created in the app using mixed sessions.

## Create a category and unit

`category.yaml`:

```yaml
id: world-geography
title: World geography
description: Learn about places, countries, and landmarks.
color: blue # violet, blue, green, amber, or rose
order: 1
```

`unit.yaml`:

```yaml
id: capitals
title: Capital cities
description: A few places to start exploring.
order: 1
```

IDs are lowercase kebab-case. Keep them stable when correcting or refining the same content. Changing an ID creates a new tracked learning item. Question identity is category ID / unit ID / quiz ID / question ID.

## Create a quiz

```yaml
schemaVersion: 1
id: first-capitals
title: A few capital cities
description: A short first quiz about places around the world.
passScore: 80 # percentage, inclusive
shuffleQuestions: false
shuffleOptions: true
timeLimitMinutes: 10 # optional; used in exam mode
tags: [geography, capitals]
questions:
  - id: france-capital
    type: single_choice
    points: 2
    prompt: What is the capital of France?
    options:
      - id: paris
        text: Paris
      - id: rome
        text: Rome
      - id: madrid
        text: Madrid
    answer: paris
    explanation: Paris is the capital of France.
    difficulty: foundation
    tags: [france]
```

Use YAML multiline `|` for paragraphs, Markdown, and code. Quote text that contains `: `, starts with YAML punctuation, or resembles a boolean/number. YAML anchors and aliases are intentionally unsupported. Regular `.yaml` and `.yml` quiz files work; category/unit metadata uses the exact `.yaml` filenames above.

Required quiz fields: `schemaVersion`, `id`, `title`, `questions`. Required question fields: `id`, `type`, `points`, `prompt`, and the type-specific answer fields. Defaults and field bounds are in the accompanying JSON Schema files. Unknown fields are rejected to catch typos.

## Question types

See `question-lab/01-formats/all-types.yaml` for working examples of every type. The code editor example uses a plain shopping list, so everyone can try it. Set `language: text` for structured text or name a programming language for code exercises.

| Type | Required answer fields | Grading |
| --- | --- | --- |
| `single_choice` | `options: [{id, text}]`, `answer: option-id` | Exact selected option |
| `multiple_choice` | `options`, `answer: [option-ids]` | Exact set, or optional partial credit |
| `true_false` | `answer: true` or `false` | Exact boolean |
| `ordering` | `options`, `answer: [every-option-id-in-order]` | Exact order, or optional partial credit |
| `matching` | `pairs: [{id, left, right}]` | Each left matches its own pair's right |
| `fill_blank` | `prompt` with `{{blank-id}}`, `blanks: [{id, answers: [accepted-strings]}]` | Authored acceptable strings per blank |
| `numeric` | `answer: number` | Absolute difference ≤ `tolerance` (default 0); optional display `unit` |
| `short_answer` | `answers: [accepted-strings]` | Authored acceptable strings |
| `written` | `modelAnswer`, `rubric: [{id, description, points}]` | Learner checks criteria met |
| `code` | Same as written; optional `language` (default `csharp`) | Learner checks criteria met; code is not executed |

Each question has positive `points`. Rubric criterion points must sum to the question's points. All answer IDs must exist and be unique. An ordering answer contains every option once. Matching answers are shuffled in the player; each pair ID identifies its expected right-hand value. Each `{{blank-id}}` must have a matching blank definition and vice versa.

Text grading normalizes Unicode, trims leading/trailing whitespace, collapses repeated whitespace, and ignores case unless `caseSensitive: true`. Include meaningful synonyms explicitly. Matching and choice grading use IDs, not display text. Numbers support an absolute nonnegative `tolerance`.

## Partial credit

Set `partialCredit: true` on multiple choice, ordering, matching, or fill-in-the-blank questions. Default is false.

- Multiple choice: `points × max(0, (correct selections - wrong selections) / number of correct options)`. Selecting every option does not guarantee full credit. Duplicate selections are counted once.
- Ordering: `points × correct positions / total positions`.
- Matching: `points × correct matches / total pairs`.
- Fill-in-the-blank: `points × correct blanks / total blanks`.

Unanswered questions earn zero. Self-assessment awards the sum of selected rubric criteria; empty responses earn zero regardless of criteria. Scores are rounded to four decimal places. Full points count as correct for review scheduling; partial results remain review candidates. Pass thresholds use the unrounded percentage before display rounding.

## Feedback and sources

Use an explanation to teach the distinction that made an answer right. A useful distractor reflects a plausible misconception, not a trick. Use `difficulty: foundation`, `applied`, or `advanced`. Include a few topic tags for searching.

Ground factual answers in the learner's notes or reliable primary sources. Verify time-sensitive facts and link the supporting page in `sources: [{title, url}]`. Write original questions about the chosen subject. Mark gaps in the source material instead of inventing answers.

Markdown links open externally only when selected. Images and raw HTML are not rendered. Code fences display as text and are never executed. This makes agent-produced files safe to study without reviewing app internals.

## Validate and finish

From the QuizMeadow source directory:

```sh
npm run validate -- /absolute/path/to/library
```

The app also shows file paths and validation errors while keeping valid quizzes available. JSON Schemas are generated from the runtime types, but cross-reference and rubric checks require the CLI/app validator.

The library reloads after file changes. Attempts keep an immutable content snapshot and revision hash. Correcting a quiz preserves past results; the app excludes outdated revisions from current coverage and spaced review until reattempted. Back up the library independently of attempt data.
