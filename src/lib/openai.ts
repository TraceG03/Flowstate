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
  completedToday: number;
  pendingTasks: number;
  urgentTasks: number;
}

const SYSTEM_PROMPT = `You are Flowstate AI, a friendly and helpful productivity assistant integrated into a task management app. You help users:

- Plan their day and optimize their schedule
- Set and achieve goals
- Build healthy habits
- Manage tasks effectively
- Stay motivated and productive

You have access to the user's current productivity data including their tasks, habits, goals, and calendar events. Use this context to provide personalized, actionable advice.

Guidelines:
- Be concise but helpful (keep responses under 300 words)
- Use emojis sparingly for visual appeal
- Provide specific, actionable advice based on their data
- Be encouraging and positive
- Format responses with markdown for readability (bold, bullet points, etc.)

IMPORTANT - Creating Tasks, Habits, and Goals:
When the user asks you to CREATE, ADD, or MAKE a task, habit, or goal, you MUST include the appropriate JSON block in your response. Do NOT ask for confirmation - just create it immediately.

For TASKS, include this exact format:
\`\`\`json:task
{"title": "The task title", "priority": "medium", "dueDate": null}
\`\`\`
Priority must be one of: "low", "medium", "high", "urgent"
dueDate should be "YYYY-MM-DD" format or null

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

Always include a brief confirmation message along with the JSON block, like "Done! I've created that task for you."

Examples of user requests that should trigger creation:
- "Create a task to buy groceries" → include json:task block
- "Add a habit for morning meditation" → include json:habit block  
- "Make a goal to learn Spanish" → include json:goal block
- "I need to call mom tomorrow" → include json:task block (infer the intent)
- "Remind me to exercise" → include json:task block`;

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

  return `
**Current Date:** ${today}

**User's Productivity Summary:**
- Completed today: ${context.completedToday} tasks
- Pending tasks: ${context.pendingTasks}
- Urgent tasks: ${context.urgentTasks}

**Urgent Tasks:** ${urgentTasks.length > 0 ? urgentTasks.join(', ') : 'None'}

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
  task?: { title: string; priority: string; dueDate: string | null };
  habit?: { name: string; frequency: string; description: string };
  goal?: { title: string; description: string; targetDate: string | null };
} {
  const result: ReturnType<typeof parseAIResponse> = { text: response };

  // More flexible regex patterns that handle variations in formatting
  // Matches: ```json:task, ```task, ``` json:task, etc.
  const taskMatch = response.match(/```\s*(?:json)?:?\s*task\s*\n?(\{[\s\S]*?\})\s*```/i);
  if (taskMatch) {
    try {
      const parsed = JSON.parse(taskMatch[1]);
      result.task = {
        title: parsed.title || 'Untitled Task',
        priority: parsed.priority || 'medium',
        dueDate: parsed.dueDate || parsed.due_date || null,
      };
      result.text = response.replace(taskMatch[0], '').trim();
      console.log('Parsed task:', result.task);
    } catch (e) {
      console.error('Failed to parse task JSON:', e, 'Raw:', taskMatch[1]);
    }
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
      result.text = response.replace(habitMatch[0], '').trim();
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
      result.text = response.replace(goalMatch[0], '').trim();
      console.log('Parsed goal:', result.goal);
    } catch (e) {
      console.error('Failed to parse goal JSON:', e, 'Raw:', goalMatch[1]);
    }
  }

  return result;
}
