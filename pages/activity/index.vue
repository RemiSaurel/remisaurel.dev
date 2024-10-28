<script setup lang="ts">
export type GitHubActivityType =
  | "PushEvent"
  | "CreateEvent"
  | "PullRequestEvent"
  | "IssuesEvent"
  | "IssueCommentEvent";

export type GitHubActivity = {
  type: GitHubActivityType;
  date: string;
  repo: {
    name: string;
    url: string;
  };
  created_at: string;
  payload: {
    ref_type: string;
  };
};

const { data } = await useFetch<GitHubActivity[]>("/api/github", {
  lazy: true,
});

// Filter only on the GitHubActivityType events
const filteredData = computed(() => {
  if (!data.value) return [];
  return data.value.filter((activity) => {
    return (
      activity.type === "PushEvent" ||
      (activity.type === "CreateEvent" &&
        activity.payload.ref_type === "repository") ||
      activity.type === "PullRequestEvent" ||
      activity.type === "IssuesEvent" ||
      activity.type === "IssueCommentEvent"
    );
  });
});
</script>

<template>
  <div>
    <div class="mb-12">
      <h5 class="text-2xl font-semibold m-0">Activity</h5>
      <p>My recent activity on GitHub.</p>
    </div>
    <div class="flex flex-col gap-2">
      <GitHubActivity
        v-for="activity in filteredData"
        :key="activity.date"
        :activity="activity"
      />
    </div>
  </div>
</template>
