---
title: MAESTRO-bench, comparing AI agents
description: How a benchmark tool for AI agents went from scripts and CSV files to a loop of dataset, experiment and analysis, grouped in studies.
date: 2026-10-22
tags: [AI, Benchmark, Workflow]
status: published
icon: lucide:flask-conical
---

::explorations-maestro-bench-logo
::

MAESTRO-bench (MB) is a benchmark tool to compare AI agents, built for research. It sits next to two other pieces of my [research](/research): Konsolidation, the study app for learners and teachers, and MAESTRO, the multi-agent AI backend behind it.

The agents of MAESTRO have a lot of settings: the architecture, the prompt, the model. Each configuration has to be analyzed, which raises two questions. How do we know which one is the best? And how do we prove it?

## A loop of three steps

The answer fits in one loop. You prepare a dataset, you run an experiment on it, you analyze the result against a reference. Then you change one thing and start again, until the configuration is the best one.

The flow below plays on its own. Each pass changes one element (a prompt, a model, the rows) and the analysis compares it to a baseline. The values are synthetic.

Hover a step to see what it depends on, and click it to open its details. Pause the flow or change its speed from the bottom right.

::explorations-maestro-bench-loop
::

### What each step holds

The dataset is a table of rows, for example learner responses with a reference grade. The experiment sends the chosen rows, all or a sample, to an agent (one prompt, one model) and records what comes back. The analysis compares those answers to the baseline, and to other experiments, with the indicators that fit the kind of value: RMSE, MAE or Pearson r for numbers, accuracy, macro F1 or Cohen's κ for categories. Each score comes with a 95% confidence interval from a bootstrap.

## How it got there

The first answer was not a tool, it was a folder. Each version below fixes what hurt in the previous one.

::compare{caption="Three ways to run the same loop"}
:::compare-item{label="Scripts and CSV files" verdict="fails" note="After a month, nobody knows which file is the best one, nor which prompt or model made it."}
The first answer. Copy a script, edit it, run it again, save a CSV. The folder grows with every variation.
:::

:::compare-item{label="One experiment at a time" verdict="partial" note="Everything is saved and analyzed, but each variation is still a manual round trip."}
MB records the prompt, the model and the answer of every launch, and the analysis is built in. A variation still means change, launch, wait, fetch.
:::

:::compare-item{label="Batches and studies" verdict="works" note="The variations run together, and the reasoning stays next to the results."}
A batch launches all the variations at once. A study keeps them with the analyses and the notes of the team, and a link shares them.
:::
::

Each version removes a chore of the previous one. Saving every launch replaces the folder, varying one element at a time keeps the comparison fair, the batch removes the waiting, and the study keeps the reasoning next to the results.

## More than one agent

An experiment does not have to stop at one agent. MAESTRO is a multi-agent backend, so MB can run a whole workflow of agents on each row, and the loop stays the same: dataset, experiment, analysis.

Two shapes cover most cases. Agents in a row, where the answer of the first becomes the input of the second. And agents side by side, which read the same row at the same time, followed by an aggregator that combines their grades with a formula. The aggregator can use arithmetic, comparisons, logic and functions such as `mean`, `min`, `max`, `clamp` or `vote`.

The example below grades a student answer with two judges: one reads the content, the other the language, each with its own prompt and its own model. Press play, then click the aggregator and try the formulas. The answers and grades are synthetic.

::explorations-maestro-bench-agents
::

Each agent is a variable of the experiment like any other: change the prompt of one judge, swap its model, or change the formula, and the analysis tells whether the workflow got better.

## How a study is structured

Four levels, from the question to a single launch:

- A study groups what matters for one question.
- A batch is a series of variations, launched together.
- An experiment is one configuration run on the dataset.
- An execution is one launch of an experiment, frozen as it was. It is the artifact, the piece of evidence behind a result.

Below, a study is drawn like the trace of a request: each level sits inside its parent, and the bars are time. The batch runs two experiments at once, a setting, and the others wait for a free slot. Click a row to see what it holds. The study is an example, with synthetic values.

::explorations-maestro-bench-structure
::

The frozen execution is what makes a result checkable. In reproducibility work, such a piece of evidence is called an artifact, and every execution is one. The prompt, the model, the parameters, each answer, the cost and the time stay as they were, even if the prompt is edited later. A study can also be shared as a read-only link, with no account needed to open it.

## Where it landed

MB is now one interface for the whole loop, instead of scripts to copy. Everything is configurable (prompt, model, temperature, sampling, even several agents in a row) and nothing ties it to one provider: Mistral, Claude and GPT run side by side. Every launch is recorded answer by answer, and every score comes with its interval against a baseline.

It is used by teams: each project has its own workspace, with roles and its own API keys, so the models, prompts, datasets and experiments of a team stay theirs.

## Open source, shared ownership

The code is open source: it can be inspected, reused and adapted. MB is jointly owned by the :entity-link{entity='ut' href='https://www.univ-toulouse.fr/'}[Université de Toulouse] and :entity-link{entity='kosmos' href='https://www.kosmos-education.com/'}[Kosmos Education]. It is being deployed on the infrastructure of the :entity-link{entity='irit' href='https://www.irit.fr/'}[IRIT], which will host it.
