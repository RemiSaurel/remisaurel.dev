export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  console.log("config", config);

  const data = await $fetch(
    "https://api.github.com/users/remisaurel/events?per_page=20",
    {
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        UserAgent: "remisaurel",
      },
    }
  );

  return data;
});
