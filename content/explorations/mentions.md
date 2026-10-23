---
title: Mentions in the teachers' chatbot
description: Teachers pick learners and subjects from a list while they type, like @file in a coding assistant. What that gives the agents behind the chatbot, and what it does not.
date: 2026-10-23
tags: [AI, Chatbot, UX]
status: wip
icon: lucide:at-sign
references:
  - id: saurel2026rjc
    authors: ["Saurel, R.", "Félix, E."]
    year: 2026
    title: "Une double approche pour la co-conception de tableaux de bord d'apprentissage : validation avec des prototypes, exploration avec un chatbot"
    venue: "RJC EIAH 2026"
    url: "https://hal.science/hal-05641999"
---

During the focus groups for the dashboards of Konsolidation (KDo), ten secondary school teachers asked a chatbot 66 questions about their learners. It turns each question into SQL on the attempts and scores. The chatbot is the exploration half of a double approach that Esther Félix and I wrote up together: teachers validate prototypes, then explore with a chatbot :citation{id="saurel2026rjc"}.

Most questions contain a name, and a name typed as a word causes two problems. The roster may hold two Jeans. And the name goes to a hosted model (the agents call the Mistral API) while the learners are minors. The fix, borrowed from coding assistants: the teacher types a trigger, picks the name in a list, and the prompt carries that exact learner or subject.

## Typing a mention

`@` opens the learners and `#` the subjects, like `@` for files in Claude Code. This input follows the rules of the app, with a made-up roster.

::explorations-mentions-input
::

- A trigger opens a list when it starts the text or follows a space. A space closes it.
- Picking writes the name in the input and remembers the pick on the side.
- On send, each remembered pick becomes a tag, like `<subject>Pythagoras</subject>`. A name typed by hand is left as plain text.

The input above adds a few things the app does not have: arrow keys, accent-insensitive search, and the id in the tag, like `<subject id="2">Pythagoras</subject>`. A name cannot tell two learners apart, an id can.

## From question to answer

The same question goes through the chain twice. The bottom row is the chatbot as it is. The top row is what mentions make possible: learners become labels before any model reads them, and the names come back at the end.

Both traces are written by hand, not recorded runs. The app answers in French, so the texts are translated.

::explorations-mentions-pipeline
::

- **Free text can be neither exact nor private.** "Jean" fits two learners, and spotting names by matching the roster misses nicknames and typos. Today the names, in the question and in the rows, go to Mistral.
- **A mention is exactly the name.** Swapping the tag for a label, and back, is a plain replacement. SQL-gen then filters on ids and has nothing to guess.
- **The last agent cannot catch a wrong Jean.** The Evaluator only rejects off-topic answers, and an answer about Jean Moreau is on topic. The check has to happen while the teacher types.

## Three ways to name someone

::compare{caption="The same question, three ways to point at Jean"}
:::compare-item{label="Free text" verdict="partial" note="Fine when the name is unique. Otherwise the model guesses, and the name goes to it as typed."}
The teacher types "Jean" and the agents work out which one.
:::

:::compare-item{label="Ask back" verdict="partial" note="Safe, but each ambiguity costs a round trip, and the name still goes to the model."}
The chatbot notices two Jeans and asks which one is meant.
:::

:::compare-item{label="Mentions" verdict="works" note="The ambiguity is settled while typing, and the name can be replaced by a label."}
The teacher types `@Je` and picks "Jean Martin".
:::
::

## What I do not know yet

- **Whether it works.** No comparison has run. A fair one sends the same questions with and without mentions through the same agents and checks the SQL, the kind of loop [MAESTRO-bench](/explorations/maestro-bench) is built for.
- **Whether the models keep the tags and labels.** SQL-gen reads the question as Clarification rewrote it, and the names only come back if the labels survive. A missing label must fail loudly, not show a wrong name.

## What else to point at

Teachers also ask about an evaluation and a time span, or about a set of learners ("make needs-based groups from the learners who failed"). The dashboard already filters by group, subject, tag and number of attempts. A mention is a filter written inside a sentence, so one list of things could feed both.
