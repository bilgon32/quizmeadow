# Make your first quiz with a web chat

This walkthrough works with ChatGPT, Claude, Gemini, or another assistant that can return text. Use a free account if it provides enough messages for your quiz. File uploads and downloadable files are optional.

## 1. Find your library

In QuizMeadow, open **Settings & data**, then **Open in Finder** under Study library. Leave that Finder window open.

The library root is the folder containing `AUTHORING.md` and your category folders. If you selected your own empty folder, copy the [authoring guide](../library/AUTHORING.md) and [agent instructions](../library/AGENTS.md) into it first.

## 2. Give the chat its instructions

Open `AUTHORING.md` as text. Paste its full contents into a new chat and say:

> This is the file format for QuizMeadow. Use it for the quizzes we create in this conversation.

Then paste your notes, a lesson summary, or source material you are allowed to share. Start with one topic and 5–10 questions. The chat service receives this material; QuizMeadow does not send it.

You may attach the files if your account supports uploads. ChatGPT's [official guide](https://learn.chatgpt.com/docs/use-chatgpt) explains how to bring files into a conversation. Copy and paste works when uploads are unavailable or a file type is unsupported.

## 3. Request complete files

Copy [WEB-AGENT-PROMPT.md](../library/WEB-AGENT-PROMPT.md), fill in the subject, unit, level, and question count, and send it after the guide and notes.

Ask for separate files with paths, not one long YAML file containing a whole course. A minimal library needs **three files**:

```text
world-geography/category.yaml
world-geography/capitals/unit.yaml
world-geography/capitals/first-capitals.yaml
```

## 4. Save the answers

Create these folders inside your library in Finder:

```text
world-geography/
  capitals/
```

For each response, use the path supplied by the chat:

- `category.yaml` goes directly inside `world-geography`.
- `unit.yaml` goes inside `world-geography/capitals`.
- `first-capitals.yaml` goes beside `unit.yaml`.

If a download is offered, save it to the right folder. Otherwise open a plain-text editor, copy just the YAML from one block, and save it using the exact filename. Exclude the opening and closing triple backticks and any chat explanation.

**TextEdit on macOS:** choose **Format → Make Plain Text** before pasting and saving. Keep `.yaml` as the extension; avoid an extra `.txt` extension. A rich-text document renamed to `.yaml` will not work.

Here is a complete three-file example you can use to check your folder arrangement.

### world-geography/category.yaml

```yaml
id: world-geography
title: World geography
description: Learn about places around the world.
color: blue
order: 1
```

### world-geography/capitals/unit.yaml

```yaml
id: capitals
title: Capital cities
description: A small starting point.
order: 1
```

### world-geography/capitals/first-capitals.yaml

```yaml
schemaVersion: 1
id: first-capitals
title: A first capital
description: One question to try the workflow.
passScore: 80
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
```

## 5. Check it in the app

Open **Library** in QuizMeadow. File changes reload automatically; click **Refresh library** if needed. Choose the library root in Settings if you saved the files elsewhere.

The app checks file structure, required fields, answer IDs, and rubric totals. It cannot establish whether the author's facts are true, so review the answer key against your notes.

If a file needs attention, expand the warning on the Library page and copy the file path and error. Send the chat:

```text
QuizMeadow reported this error:
[paste the exact message]

Here is the complete affected file:
[paste its YAML]

Return a corrected complete file using the same IDs.
Check it against AUTHORING.md. Explain the correction separately
from the YAML so I can replace the file safely.
```

Save the corrected file over the affected quiz and refresh.

| Problem | What to check |
| --- | --- |
| Quiz does not appear | Select the whole library root; confirm category → unit → quiz nesting and the `.yaml` extension. |
| Unknown field | Ask the chat to use only fields in the guide; invented fields are rejected. |
| Invalid answer ID | Every expected answer must refer to an option ID in that question. |
| Rubric total does not match | Criterion points must add up to the question's points. |
| YAML parsing error | Preserve indentation; quote text containing a colon followed by a space; remove Markdown fences. |
| Valid file, incorrect facts | Ask the chat to correct the content using your notes or reliable sources. |

If Node and the source project are installed, you can also check every file from the project directory:

```sh
npm run validate -- "/absolute/path/to/My Study Library"
```

## 6. Take it, then improve it

Choose **Practice** for your first run. Check an answer, read the explanation, and record how confident you felt. Written questions show a model answer and criteria to tick. You award the points; an AI service does not grade your response.

For a second round, ask the chat to improve the existing quiz rather than replacing your whole library:

```text
Keep the category, unit, quiz, and existing question IDs stable.
Improve the explanations for these questions and add three original
application questions based on my notes. Return the complete quiz
file. Leave the metadata files and unrelated quizzes unchanged.
```

Changing a quiz keeps old attempt snapshots in History. Current coverage uses the new content revision, so previously explored questions may need another attempt.

For a larger course, create one unit per chapter and several focused quizzes per unit. Use **Build mixed session** in the app to combine units when you want broader practice.
