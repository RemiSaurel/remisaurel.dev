<script setup lang="ts">
useSeoMeta({
  title: "RemiSaurel",
  ogTitle: "RemiSaurel",
  description: "Yet another blog with projects, ideas, thoughts, and more.",
  ogImage: "/blog.png",
  twitterCard: "summary_large_image",
});
import type { ParsedContent } from "@nuxt/content";

const { data } = await useAsyncData("navigation", () =>
  queryContent("/").find()
);

// Get all unique MM/YY from the projects
const monthYears = ref<string[]>([]);

onMounted(() => {
  if (!data.value) return;
  data.value.forEach((project) => {
    const date = new Date(project.date);
    const monthYear = `${date.getMonth() + 1}/${date
      .getFullYear()
      .toString()
      .slice(2)}`;
    if (!monthYears.value.includes(monthYear)) {
      monthYears.value.push(monthYear);
    }
  });
});

// Create an array of projects grouped by MM/YY
const projects = computed(() => {
  if (!data.value) return [];
  const projects = data.value.map((project) => ({
    ...project,
  }));

  // Sort projects by date
  projects.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  const groupedProjects = projects.reduce((acc, project: ParsedContent) => {
    const date = new Date(project.date);
    const monthYear = `${String(date.getMonth() + 1).padStart(2, "0")}/${date
      .getFullYear()
      .toString()
      .slice(2)}`;
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(project);
    return acc;
  }, {} as Record<string, ParsedContent[]>);

  return Object.entries(groupedProjects).map(([monthYear, projects]) => ({
    monthYear,
    projects,
  }));
});
</script>

<template>
  <div>
    <div class="mb-16">
      <h5 class="text-2xl font-semibold m-0">Blog</h5>
      <p>
        You'll find here some blog posts I've written. <br />
        Posts can be technical-oriented, personal thoughts, or anything else.
      </p>
    </div>
    <div class="flex flex-col gap-12 pl-4">
      <div v-for="group in projects" :key="group.monthYear" class="relative">
        <h2
          class="my-1 text-zinc-400/70 dark:text-zinc-6 absolute -left-4 -top-8 z-0 text-lg cursor-default tracking-tight"
        >
          {{ group.monthYear }}
        </h2>
        <div class="flex flex-col gap-2">
          <div v-for="p in group.projects" :key="p._path">
            <PostLine
              :to="p._path!"
              :title="p.title!"
              :description="p.description!"
            />
          </div>
        </div>
      </div>
      <div class="mt-8">
        <IconLink iconName="uil:arrow-left" route="/"> Back to home </IconLink>
      </div>
    </div>
  </div>
</template>
