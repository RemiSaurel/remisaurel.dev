import { news, type NewsCategory } from '~/news/news';

export interface NewsItem {
  date: Date;
  title: string;
  content?: string;
  categories?: NewsCategory[];
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

  const activeNewsCategories = ref<string[]>([]);

  const uniqueNewsCategories = computed(() => {
    const categoriesSet = new Set<string>();
    news.forEach(item => {
      if (item.categories) {
        item.categories.forEach(category => {
          categoriesSet.add(category);
        });
      }
    });
    
    // Define the order as in NewsCategory type
    const categoryOrder: NewsCategory[] = ["paper", "project", "conference", "misc"];
    
    // Filter and sort according to the predefined order
    return categoryOrder.filter(category => categoriesSet.has(category));
  });
  
  // Filter and group news by MM/YY
  const groupedNews = computed<GroupedNewsItem[]>(() => {
    // Sort news by date first (descending)
    let sortedNewsItems = [...news].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Filter by active categories if any are selected
    if (activeNewsCategories.value.length > 0) {
      sortedNewsItems = sortedNewsItems.filter(item => 
        item.categories && 
        item.categories.some(category => 
          activeNewsCategories.value.includes(category)
        )
      );
    }

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

  // Toggle category filter
  function toggleCategory(category: string) {
    const index = activeNewsCategories.value.indexOf(category);
    if (index > -1) {
      activeNewsCategories.value.splice(index, 1);
    } else {
      activeNewsCategories.value.push(category);
    }
  }

  // Check if a category is active
  function isCategoryActive(category: string): boolean {
    return activeNewsCategories.value.includes(category);
  }

  function clearFilters() {
    activeNewsCategories.value = [];
  }

  return {
    groupedNews,
    uniqueNewsCategories,
    activeNewsCategories,
    toggleExpanded,
    isExpanded,
    toggleCategory,
    isCategoryActive,
    clearFilters,
  };
};
