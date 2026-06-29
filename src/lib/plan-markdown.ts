/**
 * Bidirectional sync between the /plan timeline and its markdown pane.
 *
 * Markdown -> timeline matching is intentionally simple, by design: a plan
 * line is identified by the exact (start time, end time, title) triplet
 * rendered in its `### ` heading. Editing the time or title of a line means
 * it no longer matches its old triplet, so it reads as "the old block was
 * deleted and a new one created" rather than "this block was renamed" —
 * matches the literal spec ("match by title+time, else create; missing ->
 * delete") without guessing at fuzzier intent.
 */

export type PlanMarkdownRow = {
  id: string
  title: string | null
  startTime: number
  endTime: number
  projectName: string
  status: 'planned' | 'active' | 'completed' | 'cancelled'
}

export type TimerMarkdownRow = {
  id: string
  title: string | null
  startTime: number
  endTime: number | null
  durationSeconds: number | null
  projectName: string
}

export type ParsedPlanBlock = {
  key: string
  title: string
  startTime: number
  endTime: number
  projectName: string | null
}

const TITLE_FALLBACK = 'Untitled'

export function formatClockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatMinutes(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60))
  return `${minutes} min`
}

function makeKey(startLabel: string, endLabel: string, title: string): string {
  return `${startLabel}__${endLabel}__${title.trim().toLowerCase()}`
}

/** The matching key for an existing plan row — used to diff against parsed markdown blocks. */
export function planRowKey(row: { title: string | null; startTime: number; endTime: number }): string {
  return makeKey(
    formatClockTime(row.startTime),
    formatClockTime(row.endTime),
    row.title?.trim() || TITLE_FALLBACK
  )
}

/**
 * Render the full markdown document for a day: a "## Plans" section (editable,
 * synced back to Supabase) and a "## Sessions" section (read-only timer/timer
 * blocks, regenerated on every sync and ignored if hand-edited).
 */
export function generatePlanMarkdown(
  date: Date,
  plans: PlanMarkdownRow[],
  timers: TimerMarkdownRow[]
): string {
  const dayHeading = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const lines: string[] = [`# ${dayHeading}`, '', '## Plans', '']

  const sortedPlans = [...plans].sort((a, b) => a.startTime - b.startTime)
  if (sortedPlans.length === 0) {
    lines.push('_No plans yet — drag on the timeline, or add a `### 9:00 AM – 10:00 AM · Title` line here._', '')
  } else {
    for (const plan of sortedPlans) {
      lines.push(
        `### ${formatClockTime(plan.startTime)} – ${formatClockTime(plan.endTime)} · ${plan.title?.trim() || TITLE_FALLBACK}`
      )
      lines.push(`Project: ${plan.projectName}`)
      lines.push(`Status: ${plan.status}`)
      lines.push('')
    }
  }

  lines.push('## Sessions', '')

  const sortedTimers = [...timers].sort((a, b) => a.startTime - b.startTime)
  if (sortedTimers.length === 0) {
    lines.push('_No tracked sessions yet today._')
  } else {
    for (const timer of sortedTimers) {
      const isRunning = timer.endTime === null
      const endLabel = isRunning ? 'Now' : formatClockTime(timer.endTime!)
      lines.push(`🍅 ${formatClockTime(timer.startTime)} – ${endLabel} · ${timer.title?.trim() || timer.projectName}`)
      lines.push(`Project: ${timer.projectName}`)
      lines.push(`Duration: ${isRunning ? 'Running' : formatMinutes(timer.durationSeconds ?? 0)}`)
      lines.push('')
    }
  }

  return lines.join('\n').trimEnd() + '\n'
}

const HEADING_RE =
  /^###\s+(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*[·-]\s*(.+)$/i
const PROJECT_LINE_RE = /^Project:\s*(.+)$/i

function combineTime(referenceDate: Date, hh: string, mm: string, ampm: string): number {
  let hours = parseInt(hh, 10) % 12
  if (/pm/i.test(ampm)) hours += 12
  const combined = new Date(referenceDate)
  combined.setHours(hours, parseInt(mm, 10), 0, 0)
  return combined.getTime()
}

/**
 * Parse the "### HH:MM AM – HH:MM AM · Title" lines under "## Plans" only —
 * the "## Sessions" section (and anything else) is read-only and ignored.
 */
export function parsePlanBlocksFromMarkdown(markdown: string, referenceDate: Date): ParsedPlanBlock[] {
  const lines = markdown.split('\n')
  const blocks: ParsedPlanBlock[] = []

  let inPlans = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (/^##\s+Plans\b/i.test(line)) {
      inPlans = true
      continue
    }
    if (/^##\s+/.test(line)) {
      // Any other "## " section (e.g. "## Sessions") ends the Plans block.
      if (inPlans) break
      continue
    }
    if (!inPlans) continue

    const match = line.match(HEADING_RE)
    if (!match) continue

    const [, sh, sm, sap, eh, em, eap, rawTitle] = match
    const startTime = combineTime(referenceDate, sh, sm, sap)
    const endTime = combineTime(referenceDate, eh, em, eap)
    const title = rawTitle.trim() || TITLE_FALLBACK

    let projectName: string | null = null
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      if (HEADING_RE.test(lines[j]) || /^##\s+/.test(lines[j])) break
      const projectMatch = lines[j].match(PROJECT_LINE_RE)
      if (projectMatch) {
        projectName = projectMatch[1].trim()
        break
      }
    }

    blocks.push({
      key: makeKey(formatClockTime(startTime), formatClockTime(endTime), title),
      title,
      startTime,
      endTime,
      projectName,
    })
  }

  return blocks
}
