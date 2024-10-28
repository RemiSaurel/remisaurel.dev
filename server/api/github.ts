export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  console.log(config);

  const data = await $fetch(
    "https://api.github.com/users/remisaurel/events?per_page=20",
    {
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
      },
    }
  );

  return data;
});
