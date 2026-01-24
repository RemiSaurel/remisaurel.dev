export const useFirstVisit = () => {
  const hasVisited = useState('hasVisited', () => false);
  
  const isFirstVisit = computed(() => !hasVisited.value);
  
  const markAsVisited = () => {
    hasVisited.value = true;
  };
  
  return {
    isFirstVisit,
    markAsVisited
  };
};
