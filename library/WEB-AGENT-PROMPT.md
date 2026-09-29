# A reusable prompt for your web assistant

First provide `AUTHORING.md` from the library and your study notes. Then copy the prompt below and replace the bracketed values. You can paste files as text when uploads are unavailable.

```text
Create a QuizMeadow study quiz following the AUTHORING.md guide
I provided. Treat the guide as the file-format contract.

Subject or course: [World geography]
Unit or chapter: [Capital cities]
Level: [beginner]
Number of questions: [8]
Quiz title: [My first capitals quiz]
Source material: [the notes I pasted or attached]

Choose clear lowercase kebab-case folder names and stable IDs.
Return category.yaml, unit.yaml, and one quiz YAML file, each in its
correct category/unit folder. Put the relative file path above each
separate YAML block. Return complete files, ready to save.

Use single_choice, multiple_choice, true_false, short_answer, and
written where they suit the material. Give every question points
and a helpful explanation. Include explicit acceptable text answers.
For written questions, provide a model answer and a rubric whose
criterion points add up to the question's points.

Ground answers in my source material. Identify gaps or ambiguity
rather than inventing facts. Write original questions that help me
understand and apply the topic. Avoid copied exam questions.

Before replying, check required fields, valid type names, unique
IDs, answer references, YAML indentation, and rubric point totals.
If you cannot run a validator, say so outside the YAML.

When revising existing files, preserve their IDs and unrelated
content. Keep chat explanations outside the files.
```
