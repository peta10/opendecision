export const highlightElement = (elementId: string, beforeHighlight?: () => void) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Execute callback before highlighting
  beforeHighlight?.();

  // Scroll to element
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Add highlight class
  element.classList.add('highlight-pulse');
  
  // Remove highlight after animation
  setTimeout(() => {
    element.classList.remove('highlight-pulse');
  }, 2000);
};