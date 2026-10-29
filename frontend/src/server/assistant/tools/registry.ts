import {
  getBranchComparisonTool,
  getPnlSummaryTool,
  getTopProductsTool,
} from './finance';
import {
  getExpenseBreakdownTool,
  getOpenRecommendationsTool,
} from './expenses';
import { getForecastsTool, getStockStatusTool } from './stock';
import { ToolDefinition } from './types';

/** All read-only business data tools the assistant may call. */
export const assistantTools: ToolDefinition[] = [
  getPnlSummaryTool,
  getTopProductsTool,
  getBranchComparisonTool,
  getStockStatusTool,
  getForecastsTool,
  getExpenseBreakdownTool,
  getOpenRecommendationsTool,
];

export function findTool(name: string): ToolDefinition | undefined {
  return assistantTools.find((tool) => tool.declaration.name === name);
}
