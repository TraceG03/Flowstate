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
- When suggesting tasks or habits, ask if the user wants you to create them
- Provide specific, actionable advice based on their data
- Be encouraging and positive
- Format responses with markdown for readability (bold, bullet points, etc.)

When the user asks you to create a task, habit, or goal, respond with a JSON block that the app can parse:
- For tasks: \`\`\`json:task {"title": "...", "priority": "medium|high|urgent|low", "dueDate": "YYYY-MM-DD or null"}\`\`\`
- For habits: \`\`\`json:habit {"name": "...", "frequency": "daily|weekly|monthly", "description": "..."}\`\`\`
- For goals: \`\`\`json:goal {"title": "...", "description": "...", "targetDate": "YYYY-MM-DD or null"}\`\`\`

Always confirm with the user before creating items.`;

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

  // Check for task creation
  const taskMatch = response.match(/```json:task\s*(\{[\s\S]*?\})\s*```/);
  if (taskMatch) {
    try {
      result.task = JSON.parse(taskMatch[1]);
      result.text = response.replace(taskMatch[0], '').trim();
    } catch (e) {
      console.error('Failed to parse task JSON:', e);
    }
  }

  // Check for habit creation
  const habitMatch = response.match(/```json:habit\s*(\{[\s\S]*?\})\s*```/);
  if (habitMatch) {
    try {
      result.habit = JSON.parse(habitMatch[1]);
      result.text = response.replace(habitMatch[0], '').trim();
    } catch (e) {
      console.error('Failed to parse habit JSON:', e);
    }
  }

  // Check for goal creation
  const goalMatch = response.match(/```json:goal\s*(\{[\s\S]*?\})\s*```/);
  if (goalMatch) {
    try {
      result.goal = JSON.parse(goalMatch[1]);
      result.text = response.replace(goalMatch[0], '').trim();
    } catch (e) {
      console.error('Failed to parse goal JSON:', e);
    }
  }

  return result;
}
