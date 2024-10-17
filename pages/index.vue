<script setup lang="ts">
useSeoMeta({
  title: "RemiSaurel",
  ogTitle: "RemiSaurel",
  description: "My little corner of the internet.",
  ogImage: "/home.png",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="text-2xl font-semibold">Rémi Saurel</div>
    <div
      class="flex gap-2 items-center rounded-xl border-solid border-1 border-zinc-2 dark:border-zinc-5 pr-3 pl-2 py-0.5 w-fit"
    >
      <div
        class="size-3 bg-zinc-700 dark:bg-zinc-200 rounded-full animate-ping"
      ></div>
      <span class="text-xs"> PhD student in CS </span>
    </div>
  </div>

  <div class="mt-12">
    Hey! I'm a Rémi, a French PhD student in Computer Science and
    Technology-Enhanced Learning located in Toulouse, France.
  </div>

  <div class="inline-flex flex-wrap gap-1 mt-4">
    You can find blog<ProseA href="/posts"> posts</ProseA> and some
    <ProseA href="/projects"> projects </ProseA> I've been working on.
  </div>

  <Separator />

  <div class="mt-6 flex flex-col gap-1.5">
    <div class="flex flex-wrap items-center gap-2">
      <span class="font-semibold">Creator</span> of
      <div>
        <IconLink
          image="/landing/memoire.png"
          route="https://memoire.cloud"
          external
          >Memoire
        </IconLink>
      </div>
      <div>
        <IconLink
          iconName="uil:book"
          route="https://elaasticatalog.irit.fr"
          external
        >
          elaasticatalog
        </IconLink>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <span class="font-semibold">Contributed</span> on
      <IconLink
        image="/landing/elaastic_logo.webp"
        route="https://elaastic.irit.fr"
        external
        >Elaastic
      </IconLink>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <span class="font-semibold">Mainly programming</span> with
      <IconLink
        iconName="i-logos-nuxt-icon"
        route="https://nuxtjs.org"
        external
        size="sm"
        >Nuxt
      </IconLink>
      <IconLink
        iconName="i-logos-vue"
        route="https://vuejs.org"
        external
        size="sm"
        >Vue
      </IconLink>
      <IconLink
        iconName="i-logos-typescript-icon"
        route="https://www.typescriptlang.org"
        external
        size="sm"
        >TypeScript
      </IconLink>
      <IconLink
        iconName="i-logos-adonisjs-icon"
        route="https://www.adonisjs.com"
        external
        size="sm"
        >AdonisJS
      </IconLink>
      <IconLink
        iconName="i-logos-spring-icon"
        route="https://www.spring.io"
        external
        size="sm"
        >Spring Boot
      </IconLink>
    </div>
  </div>

  <div class="my-8">
    I'm interested in the design and evaluation of TEL environments, with a
    focus on the use of AI and data analytics to support learning and teaching.
  </div>

  <div class="flex gap-2">
    Outside of programming, I enjoy listening to music, playing padel and
    watching Stade Toulousain rugby games.
  </div>

  <div class="mt-16 flex flex-col gap-2">
    <span class="text-xl font-semibold">Find me on</span>
    <div class="flex flex-wrap gap-4">
      <IconLink
        iconName="uil:github-alt"
        route="https://github.com/remisaurel"
        external
        >GitHub
      </IconLink>
      <IconLink
        iconName="i-logos-linkedin-icon"
        route="https://www.linkedin.com/in/r%C3%A9mi-saurel/"
        external
        >LinkedIn
      </IconLink>
      <IconLink
        iconName="i-simple-icons-x"
        route="https://twitter.com/remisaurel"
        external
        >Twitter
      </IconLink>
    </div>
  </div>
</template>

<style scoped>
.animate-ping {
  position: relative;
}

.animate-ping::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: gray;
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes ping {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  75% {
    transform: scale(2.2);
    opacity: 0;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
</style>
