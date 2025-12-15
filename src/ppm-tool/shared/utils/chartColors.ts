// Predefined color pairs for tools (background, border)
// Colors strategically assigned to ensure maximum visual distinction
// Based on alphabetical tool order with careful color spacing
export const toolColors: [string, string][] = [
  ['rgba(55, 65, 81, 0.25)', 'rgba(55, 65, 81, 1)'],       // Dark Gray/Black (Asana)
  ['rgba(168, 85, 247, 0.2)', 'rgba(168, 85, 247, 1)'],    // Bright Purple (Adobe Workfront)
  ['rgba(139, 69, 19, 0.25)', 'rgba(139, 69, 19, 1)'],     // Brown (Airtable)
  ['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 1)'],      // Green (Azure DevOps)
  ['rgba(217, 70, 239, 0.2)', 'rgba(217, 70, 239, 1)'],    // Fuchsia/Magenta (ClickUp)
  ['rgba(14, 165, 233, 0.2)', 'rgba(14, 165, 233, 1)'],    // Sky Blue (Hive)
  ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 1)'],      // Bright Red (Jira)
  ['rgba(249, 115, 22, 0.2)', 'rgba(249, 115, 22, 1)'],    // Deep Orange (Monday.com)
  ['rgba(20, 184, 166, 0.2)', 'rgba(20, 184, 166, 1)'],    // Teal (MS Project)
  ['rgba(234, 179, 8, 0.2)', 'rgba(234, 179, 8, 1)'],      // Golden Yellow (MS Planner Premium)
  ['rgba(236, 72, 153, 0.2)', 'rgba(236, 72, 153, 1)'],    // Hot Pink (Planview)
  ['rgba(99, 102, 241, 0.2)', 'rgba(99, 102, 241, 1)'],    // Indigo (Smartsheet)
  // Additional colors for future tools
  ['rgba(180, 83, 9, 0.25)', 'rgba(180, 83, 9, 1)'],       // Amber/Brown-Orange
  ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 1)'],    // Emerald Green
  ['rgba(251, 146, 60, 0.2)', 'rgba(251, 146, 60, 1)'],    // Light Orange/Coral
  ['rgba(6, 182, 212, 0.2)', 'rgba(6, 182, 212, 1)'],      // Cyan
  ['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 1)'],    // Violet
  ['rgba(100, 116, 139, 0.25)', 'rgba(100, 116, 139, 1)'], // Slate Gray
  ['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 1)'],    // Bright Blue
  ['rgba(244, 63, 94, 0.2)', 'rgba(244, 63, 94, 1)'],      // Rose/Crimson
];

export const getToolColor = (index: number): [string, string] => {
  return toolColors[index % toolColors.length];
};