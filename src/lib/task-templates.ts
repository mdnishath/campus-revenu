import type { TaskType } from "@/types";

export interface TaskTemplate {
  label: string;
  icon: string;
  requiresLink: boolean;
  proofLabel: string;
  targetLabel: string; // label for the target URL field
  targetPlaceholder: string;
  instructions: string[];
  etaLabel: string;
}

// Each task type has its own template: different instructions, proof rules,
// and whether a live link is required alongside the screenshot.
export const TASK_TEMPLATES: Record<TaskType, TaskTemplate> = {
  reviews: {
    label: "Review",
    icon: "⭐",
    requiresLink: true,
    proofLabel: "Live review link + screenshot",
    targetLabel: "Business / review page URL",
    targetPlaceholder: "https://g.page/... or Google review link",
    etaLabel: "~5 min",
    instructions: [
      "Open the review page from the task link.",
      "Write an honest, genuine review (min. 15 words). No fake claims.",
      "Submit the live link to your published review and a screenshot showing your name.",
    ],
  },
  social: {
    label: "Social media",
    icon: "💬",
    requiresLink: true,
    proofLabel: "Live post link + screenshot",
    targetLabel: "Post / profile URL",
    targetPlaceholder: "https://instagram.com/p/...",
    etaLabel: "~3 min",
    instructions: [
      "Open the post or profile from the task link.",
      "Complete the action (comment, follow, or like) as described.",
      "Submit the live link to your action and a screenshot as proof.",
    ],
  },
  data: {
    label: "Data entry / microtask",
    icon: "📊",
    requiresLink: false,
    proofLabel: "Screenshot of completed work",
    targetLabel: "Spreadsheet / document URL (optional)",
    targetPlaceholder: "https://docs.google.com/...",
    etaLabel: "~10 min",
    instructions: [
      "Open the document from the task link (if provided).",
      "Complete the work exactly as described.",
      "Submit a screenshot showing the completed work.",
    ],
  },
};

export const TASK_TYPES: TaskType[] = ["reviews", "social", "data"];
