<script setup lang="ts">
const to = (route: string) => {
  return useRouter().push(route);
};
</script>

<template>
  <div class="max-w-6xl m-auto pb-4">
    <nav class="flex items-center justify-end gap-3 p-2">
      <button
        @click="to('/')"
        class="size-8 rounded-lg border-0 hover:cursor-pointer flex items-center justify-center bg-white dark:bg-zinc-9 hover:bg-gray-100 dark:hover:bg-zinc-8 p-0"
      >
        <Icon name="lucide:house" class="size-5 dark:text-zinc-2 text-zinc-9" />
      </button>
      <button
        @click="to('/posts')"
        class="size-8 rounded-lg border-0 hover:cursor-pointer flex items-center justify-center bg-white dark:bg-zinc-9 hover:bg-gray-100 dark:hover:bg-zinc-8 p-0"
      >
        <Icon name="uil:book-alt" class="size-5 dark:text-zinc-2 text-zinc-9" />
      </button>
      <button
        @click="to('/projects')"
        class="size-8 rounded-lg border-0 hover:cursor-pointer flex items-center justify-center bg-white dark:bg-zinc-9 hover:bg-gray-100 dark:hover:bg-zinc-8 p-0"
      >
        <Icon
          name="lucide:laptop"
          class="size-5 dark:text-zinc-2 text-zinc-9"
        />
      </button>
      <button
        @click="to('/activity')"
        class="size-8 rounded-lg border-0 hover:cursor-pointer flex items-center justify-center bg-white dark:bg-zinc-9 hover:bg-gray-100 dark:hover:bg-zinc-8 p-0"
      >
        <Icon
          name="lucide:workflow"
          class="size-5 dark:text-zinc-2 text-zinc-9"
        />
      </button>

      <ColorModeSwitcher />
    </nav>

    <div class="px-3 md:px-0 max-w-3xl m-auto mt-12">
      <slot />
    </div>
  </div>
</template>
