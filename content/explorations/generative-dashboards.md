---
title: Generative learning analytics dashboards
description: What changes when a dashboard is generated on demand from a teacher's question instead of designed once for everyone.
date: 2026-12-15
tags: [AI, Dashboard, Learning Analytics]
status: draft
icon: lucide:layout-dashboard
---

A learning analytics dashboard is designed once, from what a few teachers said in focus groups, then shown to all of them. A generative dashboard is built at the moment a teacher asks, from the question and the data of their own classes.

This is the same family of questions as the [chatbot behind Konsolidation's dashboards](/explorations/mentions), pushed one step further: the answer is no longer a sentence, it is an interface.

## Questions to explore

- **What does the model generate?** A chart spec, a layout of existing widgets, or code. Each gives a different amount of freedom and a different amount of risk.
- **How does a teacher trust what they see?** A generated chart can be wrong in ways a designed one cannot: a wrong filter, a wrong aggregation, a title that says more than the data does.
- **What stays fixed?** Some views are worth keeping stable so teachers can compare week to week and class to class.
- **Can a generated view be kept?** A teacher who likes one will want it back next week.

## To do

- Pick a small set of real questions from the focus groups.
- Prototype the three levels of generation (spec, layout, code) on the same questions.
- Write an interactive part where a question produces a dashboard.
