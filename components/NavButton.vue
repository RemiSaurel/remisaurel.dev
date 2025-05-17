<script setup lang="ts">
defineProps<{ route: string; icon: string }>();

const router = useRouter()
const to = (route: string) => {
    router.push(route);
};
</script>

<template>
    <button @click="to(route)"
        class="size-8 rounded-lg border-0 hover:cursor-pointer flex items-center justify-center bg-white dark:bg-zinc-9 hover:bg-gray-100 dark:hover:bg-zinc-8 p-0">
        <Icon :name="icon" class="size-5 dark:text-zinc-2 text-zinc-9" />
    </button>
</template>