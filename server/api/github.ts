export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();

  const data = await $fetch(
    "https://api.github.com/users/remisaurel/events?per_page=20",
    {
      headers: {
        Authorization: `Bearer ${runtimeConfig.githubToken}`,
      },
    }
  );

  return data;
});
