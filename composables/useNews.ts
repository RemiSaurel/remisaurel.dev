import { news } from '~/news/news';

export interface NewsItem {
  date: Date;
  title: string;
  content?: string;
  links?: {
    text: string;
    url: string;
  }[];
}

export interface GroupedNewsItem {
  monthYear: string;
  items: NewsItem[];
}

export const useNews = () => {
  // To track expanded state for each item with content
  const expandedItems = ref<Record<string, boolean>>({});
  
  // Group news by MM/YY
  const groupedNews = computed<GroupedNewsItem[]>(() => {
    // Sort news by date first (descending)
    const sortedNewsItems = [...news].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Group by month/year
    const grouped = sortedNewsItems.reduce((acc, item) => {
      const date = new Date(item.date);
      const monthYear = `${String(date.getMonth() + 1).padStart(2, "0")}/${date
        .getFullYear()
        .toString()
        .slice(2)}`;

      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(item);
      return acc;
    }, {} as Record<string, NewsItem[]>);

    return Object.entries(grouped).map(([monthYear, items]) => ({
      monthYear,
      items
    }));
  });

  // Toggle expanded state for a specific item
  function toggleExpanded(itemId: string) {
    expandedItems.value[itemId] = !expandedItems.value[itemId];
  }

  // Check if an item is expanded
  function isExpanded(itemId: string): boolean {
    return !!expandedItems.value[itemId];
  }

  return {
    groupedNews,
    toggleExpanded,
    isExpanded
  };
};
