---
title: Grading learner responses on Konsolidation
description: How Konsolidation grades what learners write. MCQ scores give a trusted binary grade, an AI proposes a score and skills, and a teacher validates them.
date: 2027-01-10
tags: [AI, ASAG, Workflow]
status: draft
icon: lucide:git-merge
references:
  - id: hattie2007
    authors: ["Hattie, J.", "Timperley, H."]
    year: 2007
    title: "The Power of Feedback"
    venue: "Review of Educational Research, 77(1), 81-112"
    url: "https://doi.org/10.3102/003465430298487"
  - id: shute2008
    authors: ["Shute, V. J."]
    year: 2008
    title: "Focus on Formative Feedback"
    venue: "Review of Educational Research, 78(1), 153-189"
    url: "https://doi.org/10.3102/0034654307313795"
---

This is the grading workflow running on Konsolidation, the out-of-class study app at the center of my [research](/research). For the bigger picture of where this work comes from, see [2 years after](/posts/2-years-after). A learner answers an exercise, and the response is graded on two tracks: MCQ scores, computed by rule, and an AI that reads the response. The workflow below plays on its own with mocked responses.

Hover a step to see what it depends on, and click it to open its details. Pause the flow or change its speed from the bottom right.

::explorations-konsolidation-flow
::

## Who sees what

The two tracks do not have the same status. The MCQ track gives a {0, 1} grade computed by rule, so the learner gets it right away. The AI track gives a score in [0, 1] and a mastery level for each skill linked to the question. They are useful, but they can be wrong, so they stay hidden until a teacher validates or edits them. Then the learner has access to them.

Here is how three setups would treat the same response.

::compare{caption="The same response, three setups"}
:::compare-item{label="AI evaluation shown right away" verdict="fails" note="A wrong AI evaluation reaches the learner before anyone has checked it."}
The AI grades the response and the learner sees the result immediately.
:::

:::compare-item{label="MCQ scores only" verdict="partial" note="The grade is safe, but it says nothing about partial credit or about the skills behind a mistake."}
Only the {0, 1} grade exists. Nothing is lost to AI errors, but nothing is learned from the open response either.
:::

:::compare-item{label="MCQ + AI + teacher" verdict="works" note="The learner gets a trusted grade first, then the AI evaluation once a teacher has checked it."}
The learner sees the {0, 1} grade. The teacher validates or edits the score and the skills, and the learner then sees them.
:::
::

## Feedback generation

Next to grades, the learner gets a short message about their results. A backend computes the indicators and picks the scenario (declining, low mastery, improving...). The AI only writes the message, and the teacher reads it before it is sent. The app is in French, so the messages below are translated.

The XP1 message is one a learner received. The XP2 message is written by hand, in the style the XP2 prompt asks for. Click a sentence to see what the prompt asks for.

::explorations-konsolidation-feedback
::

### Three sentences

The prompt follows :citation{id="hattie2007" narrative} and :citation{id="shute2008" narrative}. Good feedback answers three questions: where am I going, how am I doing, where to next. It targets the task, the process or self-regulation, never the person.

The backend decides this level before the AI writes anything, together with the scenario (declining, low mastery...). Whatever the level, the message has the same three short sentences:

1. Where the learner stands relative to the goal, in simple words.
2. The concept or strategy to focus on, with a tiny example from their own errors.
3. The one concrete next step.

### From XP1 to XP2

XP1 wrote one message for a whole group, from its most frequent errors. A group has no shared mistake to talk about, so the model followed the form and left the content generic. "Keep practicing" starts with a verb and still gives nothing to do.

XP2 writes one message per learner:

- **Their own errors.** The example and the next step come from one question the learner got wrong.
- **No empty remark.** "You chose the wrong option" is banned. The message says what they answered and what was expected.
- **Options named by their text.** The model only receives option numbers for MCQs, which mean nothing to the learner.
- **No normalized drops.** XP1 said a dip is normal. XP2 states the drop plainly and moves on to one small step.

### Pointing to a question or a subject

The model points to a question or a subject with a tag that only carries an id. The backend checks the id and stores a token with the label from the request. The client turns it into an inline icon.

The model never writes a label, so a question number or a subject name cannot be wrong. Skills are not covered yet: they are in the context, but the model has no tag to point to them.
