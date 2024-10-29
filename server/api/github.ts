export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const data = await $fetch(
    "https://api.github.com/users/remisaurel/events?per_page=20",
    {
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        "User-Agent": "remisaurel",
      },
    }
  );

  return data;
});
