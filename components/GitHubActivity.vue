<script setup lang="ts">
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
  <div class="flex justify-between items-center bg-gray-1 dark:bg-zinc-8 rounded-xl p-3 overflow-clip">
    <div class="flex  items-center gap-4 px-2">
      <ClientOnly>
        <Icon :name="iconName" v-if="iconName" class="size-8 min-w-6 relative bg-gray-5 mr-2" />
      </ClientOnly>
      <span class="hidden sm:block mr-2 text-gray-4">{{ activity.type }}</span>
      <a :href="getHtmlUrl(activity.repo.url)"
        class="underline underline-offset-6 underline-dashed underline-gray-4 text-ellipsis ">{{ activity.repo.name
        }}</a>
    </div>

    <p class="opacity-40 text-right">{{ relativeTimeSinceNow() }}</p>
  </div>
</template>
