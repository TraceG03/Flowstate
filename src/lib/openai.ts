import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export const openai = apiKey 
  ? new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
    })
  : null;

export const isOpenAIConfigured = !!openai;

export interface ProductivityContext {
  tasks: Array<{
    title: string;
    status: string;
    priority: string;
    dueDate?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>;
  habits: Array<{
    name: string;
    streak: number;
    frequency: string;
  }>;
  goals: Array<{
    title: string;
    progress: number;
    achieved: boolean;
  }>;
  events: Array<{
    title: string;
    startDate: string;
    endDate: string;
  }>;
  projects?: Array<{
    name: string;
    startDate: string;
    endDate: string;
    progress: number;
  }>;
  completedToday: number;
  pendingTasks: number;
  urgentTasks: number;
}

const SYSTEM_PROMPT = `You are Flowstate AI, a friendly and helpful productivity assistant integrated into a task management app. You help users:

- Plan their day and optimize their schedule
- Set and achieve goals
- Build healthy habits
- Manage tasks and projects effectively
- Stay motivated and productive

You have access to the user's current productivity data including their tasks, habits, goals, projects, and calendar events. Use this context to provide personalized, actionable advice.

Guidelines:
- Be concise but helpful (keep responses under 300 words)
- Use emojis sparingly for visual appeal
- Provide specific, actionable advice based on their data
- Be encouraging and positive
- Format responses with markdown for readability (bold, bullet points, etc.)

IMPORTANT - Creating Tasks, Habits, Goals, and Projects:
When the user asks you to CREATE, ADD, MAKE, or SCHEDULE items, you MUST include the appropriate JSON block(s) in your response. Do NOT ask for confirmation - just create them immediately.

For MULTIPLE TASKS (when user provides a list), include a separate json:task block for EACH task:
\`\`\`json:task
{"title": "First task title here", "priority": "medium", "dueDate": null}
\`\`\`
\`\`\`json:task
{"title": "Second task title here", "priority": "medium", "dueDate": null}
\`\`\`

For a SINGLE TASK:
\`\`\`json:task
{"title": "The task title", "priority": "medium", "dueDate": null}
\`\`\`
Priority must be one of: "low", "medium", "high", "urgent"
dueDate should be "YYYY-MM-DD" format or null

For SCHEDULED TASKS (tasks with a date range for Gantt chart):
When user mentions scheduling a task between dates, starting/ending dates, or wants to see it on the Gantt chart:
\`\`\`json:task
{"title": "Task title", "priority": "medium", "startDate": "2025-01-20", "endDate": "2025-01-25", "dueDate": null}
\`\`\`
Both startDate and endDate should be "YYYY-MM-DD" format. These tasks will appear on the Gantt chart.

For PROJECTS (larger initiatives with date ranges for Gantt chart):
\`\`\`json:project
{"name": "Project name", "description": "Project description", "startDate": "2025-01-20", "endDate": "2025-02-15", "color": "#6366f1"}
\`\`\`
- startDate and endDate should be "YYYY-MM-DD" format
- color is optional (default: "#6366f1"). Options: "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6"
- Projects appear on the Gantt chart timeline

For MULTIPLE PROJECTS, include a separate json:project block for EACH project:
\`\`\`json:project
{"name": "First Project", "description": "Description", "startDate": "2025-01-20", "endDate": "2025-02-15", "color": "#6366f1"}
\`\`\`
\`\`\`json:project
{"name": "Second Project", "description": "Description", "startDate": "2025-02-01", "endDate": "2025-03-01", "color": "#22c55e"}
\`\`\`

For HABITS, include this exact format:
\`\`\`json:habit
{"name": "The habit name", "frequency": "daily", "description": "Brief description"}
\`\`\`
Frequency must be one of: "daily", "weekly", "monthly"

For GOALS, include this exact format:
\`\`\`json:goal
{"title": "The goal title", "description": "Goal description", "targetDate": null}
\`\`\`
targetDate should be "YYYY-MM-DD" format or null

Always include a brief confirmation message along with the JSON block, like "Done! I've created that for you."

Examples of user requests that should trigger creation:
- "Create a task to buy groceries" → include ONE json:task block
- "Add a habit for morning meditation" → include json:habit block  
- "Make a goal to learn Spanish" → include json:goal block
- "I need to call mom tomorrow" → include json:task block (infer the intent)
- "Remind me to exercise" → include json:task block
- "Create these tasks: -Task 1 -Task 2 -Task 3" → include MULTIPLE json:task blocks (one per task)
- "Create a project called Website Redesign from Jan 20 to Feb 15" → include json:project block
- "Schedule task 'Write docs' from January 20 to 25" → include json:task with startDate and endDate
- "Add a project for Q1 planning starting next week for 2 weeks" → include json:project block (calculate dates)
- "Create these projects: Marketing Campaign (Feb-Mar), Product Launch (Mar-Apr)" → include MULTIPLE json:project blocks
- When user provides a bulleted or numbered list of tasks or projects, create ALL of them with separate JSON blocks`;

export function buildContextMessage(context: ProductivityContext): string {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const urgentTasks = context.tasks
    .filter(t => t.priority === 'urgent' && t.status !== 'done')
    .map(t => t.title)
    .slice(0, 5);

  const scheduledTasks = context.tasks
    .filter(t => t.startDate && t.endDate)
    .map(t => `${t.title} (${t.startDate} - ${t.endDate})`)
    .slice(0, 5);

  const todayEvents = context.events
    .filter(e => {
      const eventDate = new Date(e.startDate).toDateString();
      return eventDate === new Date().toDateString();
    })
    .map(e => `${e.title} (${new Date(e.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`)
    .slice(0, 5);

  const activeHabits = context.habits
    .map(h => `${h.name} (${h.streak} day streak)`)
    .slice(0, 5);

  const activeGoals = context.goals
    .filter(g => !g.achieved)
    .map(g => `${g.title} (${g.progress}% complete)`)
    .slice(0, 5);

  const activeProjects = (context.projects || [])
    .map(p => `${p.name} (${p.startDate} - ${p.endDate}, ${p.progress}% complete)`)
    .slice(0, 5);

  return `
**Current Date:** ${today}

**User's Productivity Summary:**
- Completed today: ${context.completedToday} tasks
- Pending tasks: ${context.pendingTasks}
- Urgent tasks: ${context.urgentTasks}

**Urgent Tasks:** ${urgentTasks.length > 0 ? urgentTasks.join(', ') : 'None'}

**Scheduled Tasks (Gantt):** ${scheduledTasks.length > 0 ? scheduledTasks.join(', ') : 'None'}

**Active Projects:** ${activeProjects.length > 0 ? activeProjects.join(', ') : 'No active projects'}

**Today's Events:** ${todayEvents.length > 0 ? todayEvents.join(', ') : 'No events scheduled'}

**Active Habits:** ${activeHabits.length > 0 ? activeHabits.join(', ') : 'No habits tracked'}

**Active Goals:** ${activeGoals.length > 0 ? activeGoals.join(', ') : 'No active goals'}
`.trim();
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chat(
  messages: ChatMessage[],
  context: ProductivityContext,
  onStream?: (chunk: string) => void
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI is not configured. Please add your API key.');
  }

  const contextMessage = buildContextMessage(context);
  
  const fullMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `Current user context:\n${contextMessage}` },
    ...messages.map(m => ({ 
      role: m.role as 'user' | 'assistant', 
      content: m.content 
    })),
  ];

  if (onStream) {
    // Streaming response
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: fullMessages,
      stream: true,
      max_tokens: 1000,
      temperature: 0.7,
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
      onStream(content);
    }
    return fullResponse;
  } else {
    // Non-streaming response
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: fullMessages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
  }
}

// Parse AI response for actionable items
export function parseAIResponse(response: string): {
  text: string;
  tasks?: Array<{ 
    title: string; 
    priority: string; 
    dueDate: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>;
  habit?: { name: string; frequency: string; description: string };
  goal?: { title: string; description: string; targetDate: string | null };
  projects?: Array<{ name: string; description: string; startDate: string; endDate: string; color: string }>;
} {
  const result: ReturnType<typeof parseAIResponse> = { text: response };
  let cleanedText = response;

  // Find ALL task blocks (supports multiple tasks at once)
  // Matches: ```json:task, ```task, ``` json:task, etc.
  const taskRegex = /```\s*(?:json)?:?\s*task\s*\n?(\{[\s\S]*?\})\s*```/gi;
  const taskMatches = [...response.matchAll(taskRegex)];
  
  if (taskMatches.length > 0) {
    result.tasks = [];
    
    for (const match of taskMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        result.tasks.push({
          title: parsed.title || 'Untitled Task',
          priority: parsed.priority || 'medium',
          dueDate: parsed.dueDate || parsed.due_date || null,
          startDate: parsed.startDate || parsed.start_date || null,
          endDate: parsed.endDate || parsed.end_date || null,
        });
        cleanedText = cleanedText.replace(match[0], '').trim();
      } catch (e) {
        console.error('Failed to parse task JSON:', e, 'Raw:', match[1]);
      }
    }
    
    console.log('Parsed tasks:', result.tasks);
  }

  // Find ALL project blocks (supports multiple projects at once)
  const projectRegex = /```\s*(?:json)?:?\s*project\s*\n?(\{[\s\S]*?\})\s*```/gi;
  const projectMatches = [...response.matchAll(projectRegex)];
  
  if (projectMatches.length > 0) {
    result.projects = [];
    
    for (const match of projectMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        result.projects.push({
          name: parsed.name || 'Untitled Project',
          description: parsed.description || '',
          startDate: parsed.startDate || parsed.start_date || new Date().toISOString().split('T')[0],
          endDate: parsed.endDate || parsed.end_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          color: parsed.color || '#6366f1',
        });
        cleanedText = cleanedText.replace(match[0], '').trim();
      } catch (e) {
        console.error('Failed to parse project JSON:', e, 'Raw:', match[1]);
      }
    }
    
    console.log('Parsed projects:', result.projects);
  }

  // Check for habit creation
  const habitMatch = response.match(/```\s*(?:json)?:?\s*habit\s*\n?(\{[\s\S]*?\})\s*```/i);
  if (habitMatch) {
    try {
      const parsed = JSON.parse(habitMatch[1]);
      result.habit = {
        name: parsed.name || 'Untitled Habit',
        frequency: parsed.frequency || 'daily',
        description: parsed.description || '',
      };
      cleanedText = cleanedText.replace(habitMatch[0], '').trim();
      console.log('Parsed habit:', result.habit);
    } catch (e) {
      console.error('Failed to parse habit JSON:', e, 'Raw:', habitMatch[1]);
    }
  }

  // Check for goal creation
  const goalMatch = response.match(/```\s*(?:json)?:?\s*goal\s*\n?(\{[\s\S]*?\})\s*```/i);
  if (goalMatch) {
    try {
      const parsed = JSON.parse(goalMatch[1]);
      result.goal = {
        title: parsed.title || 'Untitled Goal',
        description: parsed.description || '',
        targetDate: parsed.targetDate || parsed.target_date || null,
      };
      cleanedText = cleanedText.replace(goalMatch[0], '').trim();
      console.log('Parsed goal:', result.goal);
    } catch (e) {
      console.error('Failed to parse goal JSON:', e, 'Raw:', goalMatch[1]);
    }
  }

  result.text = cleanedText;
  return result;
}
