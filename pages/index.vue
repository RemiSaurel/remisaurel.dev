<script setup lang="ts">
import { news } from '~/news/news';
import { motion } from 'motion-v';
useSeoMeta({
  title: "RemiSaurel",
  ogTitle: "RemiSaurel",
  description: "My little corner of the internet.",
  ogImage: "/home.png",
  twitterCard: "summary_large_image",
});

// To track expanded state for each item with content
const expandedItems = ref<Record<string, boolean>>({});

// Group news by MM/YY
const groupedNews = computed(() => {
  // Sort news by date first (descending)
  const sortedNewsItems = [...news].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Group by month/year
  const grouped = sortedNewsItems.reduce((acc, item) => {
    const date = new Date(item.date);
    const monthYear = `${String(date.getMonth() + 1).padStart(2, "0")}/${date
      .getFullYear()
      .toString()
      .slice(2)}`;

    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(item);
    return acc;
  }, {} as Record<string, typeof news>);

  return Object.entries(grouped).map(([monthYear, items]) => ({
    monthYear,
    items
  }));
});

function toggleExpanded(itemId: string) {
  expandedItems.value[itemId] = !expandedItems.value[itemId];
}

function isExpanded(itemId: string): boolean {
  return !!expandedItems.value[itemId];
}

const MAIN_TRANSITION = { duration: 1, delay: 0.6 }
</script>

<template>
  <div class="flex flex-col gap-1">
    <motion.div :initial="{ opacity: 0 }" :animate="{ opacity: 1}" :transition="{ duration: 1 }"
      class="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
      <div class="flex items-center gap-2">
        <NuxtImg src="/photo.png" class="rounded-full size-24"></NuxtImg>
        <div class="flex flex-col ml-2">
          <div class="text-2xl font-semibold">Rémi Saurel</div>
          <div class="text-zinc-4 text-sm -mt-1 font-light">remi.saurel [at] irit.fr</div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 mt-1 h-fit justify-center">
        <IconLink iconName="i-simple-icons-x" route="https://twitter.com/remisaurel" external>
        </IconLink>
        <IconLink iconName="uil:linkedin" route="https://www.linkedin.com/in/r%C3%A9mi-saurel/" external>
        </IconLink>
        <IconLink iconName="i-lucide-graduation-cap"
          route="https://scholar.google.com/citations?user=r8AM0OIAAAAJ&hl=fr" external>
        </IconLink>
        <IconLink iconName="uil:github-alt" route="https://github.com/remisaurel" external />
      </div>
    </motion.div>
  </div>

  <motion.div :initial="{ opacity: 0 }" :animate="{ opacity: 1}" :transition="{ ...MAIN_TRANSITION }" class="mt-8">
    Hey! I'm a Rémi, a French PhD student located in Toulouse, France. I'm working at the <ProseA
      href="https://www.irit.fr/" target="_blank"> IRIT</ProseA> lab, within the <ProseA
      href="https://www.irit.fr/TALENT/site/" target="_blank"> TALENT team</ProseA> and with <ProseA
      href="https://www.kosmos-education.com/" target="_blank"> Kosmos Education</ProseA>.
    <br>
    My main focus is about <span class="font-semibold">AI</span> and <span class="font-semibold">learning
      analytics</span> to support learning and teaching. I'm working on Learning Analytics Dashboards for teachers to
    help them regulate out-of-class learning activities from their students (K-12).
    <p>I am advised by Franck Silvestre, Jean-Baptiste Raclet, and Emmanuel Lescure. </p>

  </motion.div>

  <motion.div :initial="{ opacity: 0 }" :animate="{ opacity: 1}" :transition="{ ...MAIN_TRANSITION}" class="inline-flex flex-wrap gap-1">
    You can find blog<ProseA href="/posts"> posts</ProseA>, <ProseA href="/teaching"> teaching</ProseA> and some
    <ProseA href="/projects"> projects </ProseA> I've been working on.
  </motion.div>

  <motion.div :initial="{ opacity: 0 }" :animate="{ opacity: 1}" :transition="{ ...MAIN_TRANSITION }">
    <Separator />
  </motion.div>

  <motion.div :initial="{ opacity: 0 }" :animate="{ opacity: 1}" :transition="{ duration: 1, delay: 1.2 }" class="flex flex-col gap-2">
    <div class="text-xl font-semibold">Recent news</div>
    <div class="flex flex-col gap-2">
      <div v-for="group in groupedNews" :key="group.monthYear" class="relative">
        <div class="my-1 text-zinc-400 font-semibold text-lg cursor-default tracking-tight">
          {{ group.monthYear }}
        </div>
        <div class="flex flex-col pl-2 gap-2">
          <div v-for="item in group.items" :key="item.title" class="flex flex-col gap-0.5">
            <div class="flex flex-wrap gap-0.5">
              <div class="font-medium pr-1" :class="{ 'cursor-pointer': item.content }"
                @click="item.content ? toggleExpanded(item.title) : null">
                {{ item.title }}
                <span v-if="item.content" class="text-xs ml-1 text-zinc-600 dark:text-zinc-400">
                  {{ isExpanded(item.title) ? '▼' : '►' }}
                </span>
              </div>

              <div class="flex gap-2">
                <span v-for="link in item.links" :key="link.url" class="text-sm">
                  <ProseA :href="link.url" target="_blank"
                    class="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
                    {{ link.text }}
                  </ProseA>
                </span>
              </div>
            </div>

            <!-- Collapsible content section -->
            <Transition name="slide">
              <div v-if="item.content && isExpanded(item.title)"
                class="text-sm text-zinc-500 dark:text-zinc-400 pl-4 mt-1">
                {{ item.content }}
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
  max-height: 200px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>