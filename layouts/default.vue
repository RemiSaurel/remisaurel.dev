<script setup lang="ts">
const toHome = () => {
  return useRouter().push("/");
};

const toPosts = () => {
  return useRouter().push("/posts");
};

const toProjects = () => {
  return useRouter().push("/projects");
};
</script>

<template>
  <div class="max-w-6xl m-auto pb-4">
    <ClientOnly>
      <nav class="flex items-center justify-end gap-3 p-2">
        <button
          @click="toHome"
          class="size-8 rounded-lg border-0 hover:cursor-pointer flex items-center justify-center bg-white dark:bg-zinc-9 hover:bg-gray-100 dark:hover:bg-zinc-8 p-0"
        >
          <Icon
            name="lucide:house"
            class="size-5 dark:text-zinc-2 text-zinc-9"
          />
        </button>
        <button
          @click="toPosts"
          class="size-8 rounded-lg border-0 hover:cursor-pointer flex items-center justify-center bg-white dark:bg-zinc-9 hover:bg-gray-100 dark:hover:bg-zinc-8 p-0"
        >
          <Icon
            name="uil:book-alt"
            class="size-5 dark:text-zinc-2 text-zinc-9"
          />
        </button>
        <button
          @click="toProjects"
          class="size-8 rounded-lg border-0 hover:cursor-pointer flex items-center justify-center bg-white dark:bg-zinc-9 hover:bg-gray-100 dark:hover:bg-zinc-8 p-0"
        >
          <Icon
            name="lucide:laptop"
            class="size-5 dark:text-zinc-2 text-zinc-9"
          />
        </button>

        <ColorModeSwitcher />
      </nav>
    </ClientOnly>

    <div class="px-3 md:px-0 max-w-3xl m-auto mt-12">
      <slot />
    </div>
  </div>
</template>
