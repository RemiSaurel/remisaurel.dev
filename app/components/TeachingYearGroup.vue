<script setup lang="ts">
import type { TeachingSubject } from '~/pages/teaching/index.vue';

const props = defineProps<{
    teachingList: TeachingSubject[];
}>();

const groupedTeaching = props.teachingList.reduce((acc, teaching) => {
    if (!acc[teaching.year]) {
        acc[teaching.year] = [];
    }
    acc[teaching.year].push(teaching);
    return acc;
}, {} as Record<string, TeachingSubject[]>);

const sortedYears = Object.keys(groupedTeaching).sort((a, b) => parseInt(b) - parseInt(a));
</script>

<template>
    <div v-for="year in sortedYears" :key="year" class="mb-6">
        <span class="font-semibold text-lg">{{ year }}</span>

        <div class="mt-2 flex flex-col gap-3">
            <div v-for="subject in groupedTeaching[year]" :key="subject.subject"
                class="flex flex-col border border-zinc-2 bg-zinc-1 gap-4 p-4 rounded-lg dark:border-zinc-7 dark:bg-zinc-8">
                <div class="flex justify-between gap-8 items-baseline">
                    <div class="font-500 text-lg">
                        <a v-if="subject.link" :href="subject.link" target="_blank" rel="noopener noreferrer">
                            <span class="underline underline-gray underline-offset-4">
                                {{ subject.subject }}
                            </span>
                            ↗️
                        </a>
                        <span v-else> {{ subject.subject }}</span>
                    </div>
                    <div class="text-right text-ellipsis overflow-clip inline-flex opacity-80">🧑‍💻 {{
                        subject.students }}</div>
                </div>
                <span class="opacity-60">
                    {{ subject.description }}
                </span>
            </div>
        </div>
    </div>
</template>
