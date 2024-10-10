---
title: "Memoire: A Flashcard Project"
description: "A first retrospective on my flashcard project"
date: 2024-10-12
---

# What's this project about?

[Memoire](https://memoire.cloud) is a flashcard project I've been working on for a few weeks now. The goal is to create a tool that helps me memorize things more efficiently using flashcards.\
After some readings about :special-word{iconName='uil:calendar-alt'}[spaced-repetition] in technology-enhanced-learning, I've identified limitations about existing tools: **UX**, **flexibility**, but also **open-source alternatives** or **research-friendly tools**.

::blockquote{type="info"}
This post will mostly talk about the project's inception, the technologies I've used, and the first steps I've taken to build it. I won't go too deep in the technical details, this will be the subject of future posts.
::

## Technology-Enhanced Learning

:word-tooltip{tooltip="Technology-Enhanced Learning"}[TEL] is a broad term that refers to the use of technology to support learning.\
It's been 2 years that I've worked in the field of TEL: my apprenticeship at [Kosmos](https://www.kosmos-education.com/) and within the [TALENT team](https://www.irit.fr/TALENT/site/en/home/) at [IRIT](https://www.irit.fr/). This field particularly interests me because it combines my passion for technology and my interest in education.

:separator

### The 4 pillars of learning

Stanislas Dehaene, a French neuroscientist, has identified 4 pillars of learning: **Attention**, **Active Engagement**, **Error Feedback**, and **Consolidation**. In his book :special-word{iconName='uil:book-open'}[Apprendre] (Les talents du cerveau, le défi des machines), he explains how these 4 pillars are essential to learning. This book is incredibly interesting and I highly recommend it. Basically, the idea is that learning is a complex process that involves several mechanisms in the brain and the mobilization of multiple cognitive functions is necessary to learn effectively.

### Spacing & Testing effects

Two concepts are particularly interesting in the field of learning: the **spacing effect** and the **testing effect**.\
The **spacing effect** is the idea that we learn better when we space our learning over time. The **testing effect** is the idea that we learn better when we test our knowledge.\
These 2 effects are the basis of the **spaced repetition** technique, which is the foundation of many flashcard tools such as Anki or SuperMemo. The idea is to review information at increasing intervals of time to improve long-term retention.

## Global architecture

This is the global architecture of the project:
<img src="/blog/memoire_archi.png" alt="Memoire architecture" style="width: 100%;"/>
I chose to work with :icon-link{icon-name='i-logos-nuxt-icon' size='sm' route='https://nuxt.com' external}[Nuxt] and :icon-link{icon-name='i-logos-adonisjs-icon' size='sm' route='https://adonisjs.com' external}[AdonisJS] because I'm familiar with these technologies and I find them very powerful.
Thanks to :icon-link{icon-name='i-logos-github-icon' size='sm' route='https://github.com' external}[Github Actions] I can build :icon-link{icon-name='i-logos-docker-icon' size='sm' route='https://www.docker.com' external}[Docker] images and deploy containers on a small 5€/month VPS.\
I wanted to keep the project simple and focus on the core features. I also wanted to make it easy to deploy and maintain, thus the choice of Docker and the pipeline with Github Actions.

## Research-oriented features

The main goal of Memoire is to help me memorize things more efficiently. But I also want to make it a research-friendly tool. To enable this, I plan to add features to make it easy to export data, to analyze it, and to integrate it with other tools or be compliant with [xAPI](https://fr.wikipedia.org/wiki/XAPI).\
The project **is** open-source and one goal is also to make it easy to deploy and maintain for other people, on their own infrastructure.

# What's next?

Here are some features I plan to add in the future:
<img src="/blog/next-memoire.png" alt="Next memoire" style="width: 100%;"/>

A lot of work remains to be done. After exploring some [Linear](https://linear.app) products and company vision, I'll also focus the work on providing a better user experience and a more flexible tool.

I'm very excited about this project and I can't wait to see where it will lead me. I plan to write more posts about it in the future, so stay tuned!
