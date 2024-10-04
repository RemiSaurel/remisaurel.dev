<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const headings = ref<{ level: number; text: string; anchor: string }[]>([]);

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

onMounted(() => {
  const allHeadings = document.querySelectorAll("h1, h2, h3");
  allHeadings.forEach((heading) => {
    const level = parseInt(heading.tagName.slice(1));
    const textContent = heading.textContent?.trim();
    if (textContent) {
      const anchor = slugify(textContent);
      headings.value.push({ level, text: textContent, anchor });
      heading.id = anchor;
    }
  });
  headings.value.shift(); // Remove first heading from ToC

  const handleClickOutside = (event: MouseEvent) => {
    const tocElement = document.querySelector(".relative");
    if (tocElement && !tocElement.contains(event.target as Node)) {
      showToC.value = false;
    }
  };

  document.addEventListener("click", handleClickOutside);

  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
  });
});

const showToC = ref(false);
const toggleToC = () => (showToC.value = !showToC.value);

const to = (anchor: string) => {
  const element = document.getElementById(anchor);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
  showToC.value = false;
};
</script>

<template>
  <div>
    <div class="relative inline-block">
      <div
        @click="toggleToC"
        class="text-zinc-400 hover:text-zinc-6 transition duration-400 dark:text-zinc-6 dark:hover:text-zinc-4 flex items-center space-x-2 cursor-pointer group"
      >
        <span>Table of contents</span>
        <span
          :class="showToC ? 'rotate-90' : ''"
          class="transition-transform duration-300 flex items-center justify-center"
        >
          <Icon name="uil:angle-right" class="size-6" />
        </span>
      </div>

      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="opacity-0 transform -translate-y-2"
        enter-to-class="opacity-100 transform translate-y-0"
        leave-from-class="opacity-100 transform translate-y-0"
        leave-to-class="opacity-0 transform -translate-y-2"
      >
        <div
          v-if="showToC"
          class="absolute mt-2 bg-white dark:bg-zinc-8 border-solid border-0.5 shadow-lg border-zinc-2 dark:border-zinc-7 rounded-lg p-4 w-64 z-10"
        >
          <div class="flex flex-col gap-2 p-0 m-0">
            <div
              v-for="(heading, index) in headings"
              :key="heading.text"
              class="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-2 transition cursor-pointer"
              :class="{
                'font-medium': heading.level === 1,
                'ml-3 text-base': heading.level === 2,
                'ml-6 text-sm': heading.level === 3,
              }"
            >
              <div @click="to(heading.anchor)">
                {{ heading.text }}
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <main>
      <ContentDoc v-slot="{ doc }">
        <article>
          <h1 class="text-4xl font-black mb-4">{{ doc.title }}</h1>
          <ContentRenderer :value="doc" />
        </article>
      </ContentDoc>
    </main>

    <IconLink iconName="uil:arrow-left" text="Back to home" route="/" />
  </div>
</template>

<style scoped>
html {
  scroll-behavior: smooth;
}
</style>
