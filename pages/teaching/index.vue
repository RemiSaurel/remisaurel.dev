<script setup lang="ts">
interface TeachingSubject {
    year: string;
    subject: string;
    description: string;
    students: string;
    link?: string;
}

const TEACHING: TeachingSubject[] = [
    {
        year: "2025",
        subject: "Kotlin / Web development",
        description: "Introduction to Kotlin and web development on an existing project (elaastic) using Spring Boot.",
        students: "BUT3 Info (3rd year students)",
        link: "https://github.com/MyPedagogicalRessources/BUT3-Kotlin"
    },
];

const groupedTeaching = TEACHING.reduce((acc, teaching) => {
    if (!acc[teaching.year]) {
        acc[teaching.year] = [];
    }
    acc[teaching.year].push(teaching);
    return acc;
}, {} as Record<string, TeachingSubject[]>);

const sortedYears = Object.keys(groupedTeaching).sort((a, b) => parseInt(b) - parseInt(a));
</script>

<template>
    <div>
        <div class="mb-12">
            <h5 class="text-2xl font-semibold m-0">Teaching</h5>
            <p>A list of the teaching I've done</p>
        </div>
        <div>
            <div v-for="year in sortedYears" :key="year" class="mb-6">
                <span class="text-xl font-semibold">{{ year }}</span>
                <div class="mt-2 flex flex-col gap-4">
                    <div v-for="subject in groupedTeaching[year]" :key="subject.subject"
                        class="flex flex-col border border-gray-2 bg-gray-1  gap-3 p-4 rounded-lg dark:bg-zinc-8 transition-all duration-500">
                        <div class="flex justify-between gap-8 items-baseline">
                            <div class="font-500 text-lg">
                                <a v-if="subject.link" :href="subject.link">
                                    <span class="underline underline-gray underline-offset-4"> {{ subject.subject
                                        }}</span>
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
        </div>

    </div>
</template>