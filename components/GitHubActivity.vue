<script setup lang="ts">
import { defineProps, computed } from "vue";
import type { GitHubActivity } from "~/pages/activity/index.vue";

const props = defineProps<{
  activity: GitHubActivity;
}>();

const getHtmlUrl = (url: string) => {
  return url.replace("api.", "").replace("repos/", "");
};

const iconName = computed(() => {
  switch (props.activity.type) {
    case "PullRequestEvent":
      return "octicon:git-pull-request";
    case "PushEvent":
      return "octicon:git-commit";
    case "CreateEvent":
      return "octicon:repo";
    case "IssuesEvent":
      return "octicon:issue-opened";
    case "IssueCommentEvent":
      return "octicon:comment-discussion";
    default:
      return "";
  }
});

const relativeTimeSinceNow = () => {
  const date = new Date(props.activity.created_at);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (weeks > 0) {
    return rtf.format(-weeks, "week");
  } else if (days > 0) {
    return rtf.format(-days, "day");
  } else if (hours > 0) {
    return rtf.format(-hours, "hour");
  } else if (minutes > 0) {
    return rtf.format(-minutes, "minute");
  } else {
    return rtf.format(-seconds, "second");
  }
};
</script>

<template>
  <div
    class="flex justify-between items-center bg-neutral-1 dark:bg-neutral-8 rounded-xl p-3"
  >
    <div class="flex flex-wrap items-center gap-2 px-2">
      <Icon
        :name="iconName"
        v-if="iconName"
        class="size-8 relative bg-neutral-5 mr-2 sm:mr-8"
      />
      <span class="">{{ activity.type }} on</span>
      <a
        :href="getHtmlUrl(activity.repo.url)"
        class="underline underline-offset-6 underline-dashed underline-neutral-4"
        >{{ activity.repo.name }}</a
      >
    </div>

    <p class="opacity-40 text-right">{{ relativeTimeSinceNow() }}</p>
  </div>
</template>
