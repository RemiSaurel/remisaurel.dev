<script setup lang="ts">
defineProps<{ route: string; icon: string, label: string }>();

const router = useRouter()
const to = (route: string) => {
    router.push(route);
};
</script>

<template>
    <div @click="to(route)"
        class="rounded-lg border-0 text-sm hover:cursor-pointer flex items-center justify-center bg-white dark:bg-zinc-9 hover:bg-gray-100 dark:hover:bg-zinc-8 p-1 px-2">
        <Icon :name="icon" class="size-5 dark:text-zinc-2 text-zinc-9" />
        <span class="sr-only pl-1.5">{{ label }}</span>
    </div>
</template>