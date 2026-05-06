import { scoutTool } from "./scout"
import { deepDiverTool } from "./deep-diver"
import { lumaTool, eventbriteTool } from "./events"

export { scoutTool, deepDiverTool, lumaTool, eventbriteTool }

/** The full tool registry handed to the scraper agent. */
export const scraperTools = {
  scout: scoutTool,
  deepDive: deepDiverTool,
  luma: lumaTool,
  eventbrite: eventbriteTool,
}
