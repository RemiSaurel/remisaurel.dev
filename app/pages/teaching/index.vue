<script setup lang="ts">
export interface TeachingSubject {
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
    {
        year: "2021",
        subject: "Tutoring",
        description: "Tutoring sessions for students in the 1st year of DUT on various subjects.",
        students: "DUT1 Info (1st year students)",
    }
];
</script>

<template>
    <div>
        <div class="mb-12">
            <h5 class="text-2xl font-semibold m-0">Teaching</h5>
            <p>A list of the teaching I've done</p>
        </div>
        <TeachingYearGroup :teachingList="TEACHING" />
    </div>
</template>