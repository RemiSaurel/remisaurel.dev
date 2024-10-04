<script setup lang="ts">
defineProps<{
  type: "info" | "warning" | "danger" | "note" | "important";
}>();

const color = {
  info: "border-blue-500",
  warning: "border-yellow-500",
  danger: "border-red-500",
  note: "border-green-500",
  important: "border-purple-500",
};

const icon = {
  info: {
    name: "uil:info-circle",
    color: "text-blue-500",
  },
  warning: {
    name: "uil:exclamation-triangle",
    color: "text-yellow-600",
  },
  danger: {
    name: "uil:exclamation-octagon",
    color: "text-red-600",
  },
  note: {
    name: "uil:pen",
    color: "text-green-600",
  },
  important: {
    name: "uil:star",
    color: "text-purple-600",
  },
};

const formatTitle = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};
</script>
<template>
  <div class="border-l-solid border-3 m-0 my-6" :class="color[type]">
    <div class="flex gap-2 pl-4 pb-2 items-center">
      <Icon :name="icon[type].name" :class="icon[type].color" />
      <span class="font-semibold" :class="icon[type].color">{{
        formatTitle(type)
      }}</span>
    </div>
    <blockquote class="m-0 px-4 opacity-70 font-300">
      <ContentSlot :use="$slots.default" unwrap="p" />
    </blockquote>
  </div>
</template>
