---
title: Grading learner responses on Konsolidation
description: How Konsolidation grades what learners write. MCQ scores give a trusted binary grade, an AI proposes a score and skills, and a teacher validates them.
date: 2026-10-22
tags: [AI, ASAG, Workflow]
status: published
icon: lucide:git-merge
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
