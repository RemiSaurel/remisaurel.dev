---
title: Helping a learner draw an answer
description: A learner answers by drawing. What help can plain rules give, and what can a teacher read from the way the drawing was made?
date: 2026-10-25
tags: [Interaction Design, Learning, Assessment]
status: wip
icon: lucide:pencil-ruler
---

Some answers are not text: a diagram, a graph, a schema of a cell. How does a learner get help on them, and what does the teacher see of the way they answered?

::annotation{note="rules, not a model"}
There is no AI here. Every help is a rule you can read and test.
::

## A sheet to draw on

Draw a living cell and its main parts. A drawing is a list of strokes, and each stroke is a list of points with their time. Undo, redo and replay all come from that list.

::explorations-learner-drawing-answers-sketch
::

- **The strokes are data.** They can be saved, replayed or sent to a teacher as they are.
- **The log keeps what the drawing forgets.** Undone strokes and cleared sheets are not in the drawing, but they are in the log.
- **The replay skips the pauses.** Waiting time between strokes is capped at 0.6 s.

## A first help: a counter

The lightest help does not touch the drawing. The learner names parts with the label tool, then asks for a count: how many expected parts the labels name. It never says which ones.

Under the sheet, name a few parts, add a wrong label, and check.

- **It reads words, not ink.** A "nucleus" label placed on the outline still counts.
- **Asking is an act.** Each check goes in the trace.
- **A count can be climbed.** Change a word, check again, see if the number went up. Limiting checks is an open choice.
- **The list of parts is mine.** Six parts of an animal cell. A teacher would write it. The match is strict: "nuclear membrane" names nothing.

## The teacher side

Switch to Teacher to read the session as the teacher would. Draw and check on the Learner side first.

The counter says how many parts are named, never which. The teacher side lists each part with the label that named it, the labels that name nothing, and every check with its count. Point at a part, or click it, and its label lights up on the sheet.

Under the sheet, the timeline is a recording. Press play, or click it to see that moment.

- **The recording keeps what the drawing lost.** Undone strokes and old label names are still there.
- **Nothing is flagged as cheating.** What a trace proves is still open.

## One line of the log

Each act is a line. Point at a cell to see what it says. The three lines are written by hand, and drawn by the same code as the log.

::explorations-learner-drawing-answers-anatomy
::

- **A check shows what came before it.** "Since check 1: 2 labels added" is a learner who fixed the drawing. "Only renames" is a learner who changed words and asked again.
- **A rename names a part, or none.** "No part" is a word the list does not know.

## Fewer lines

Twenty strokes that make a circle are a circle, not twenty lines. Move the gap to see where one line ends.

::explorations-learner-drawing-answers-condense
::

- **A shape is one line.** "4 strokes in 3.2 s" is a drawing, not four things to read. Unfold a line in the log to see each stroke.
- **Some acts always stand alone.** A label, a rename, a clear and a check are what the teacher looks for.
- **The gap is a choice.** Too short and a circle is five lines. Too long and the circle and the nucleus are one.

## Skipping the pauses

Play on the recording's clock. The learner's time jumps over each pause.

::explorations-learner-drawing-answers-pauses
::

- **A pause stays on the timeline.** It is a gap you can see, and play does not wait for it.
- **A pause is not explained.** It can be thinking, or a break. The log cannot tell.

## Questions to explore

- **What kind of help?** A count, a hint on one part, a shape to trace, the answer itself. Each one takes more of the work from the learner.
- **What does the teacher see?** The final drawing, the steps, or both.
- **What does the learner learn?** A better answer can mean worse learning.
- **Are rules enough?** A word list misses a synonym nobody planned. Is that a flaw, or a limit simple enough to explain to a learner?

## To do

- Build the next helps: a hint pinned to a part, a shape to trace over.
- Test the teacher side with a real teacher: what do they look at first, and what do they ignore?
- Try the counter on real drawings: how often does it miss a right label?
