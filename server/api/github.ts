export default defineEventHandler(async (event) => {
  const data = await $fetch(
    "https://api.github.com/users/remisaurel/events?per_page=20",
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    }
  );

  return data;
});
