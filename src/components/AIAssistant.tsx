import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import { Send, Sparkles, Lightbulb, Calendar, CheckSquare, Target, Wand2 } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestions = [
  { icon: CheckSquare, text: 'Help me plan my day', action: 'plan_day' },
  { icon: Target, text: 'Suggest goals for this week', action: 'suggest_goals' },
  { icon: Calendar, text: 'Optimize my schedule', action: 'optimize_schedule' },
  { icon: Lightbulb, text: 'Give productivity tips', action: 'productivity_tips' },
];

export default function AIAssistant() {
  const { state, addTask, addHabit, addGoal } = useApp();
  const { tasks, habits, goals, events } = state;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AI productivity assistant. I can help you plan your day, suggest goals, create tasks, and optimize your schedule. What would you like to accomplish today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent');
    const activeHabits = habits.length;
    const activeGoals = goals.filter(g => !g.achieved).length;

    // Day planning
    if (lowerMessage.includes('plan') && (lowerMessage.includes('day') || lowerMessage.includes('today'))) {
      let response = `📋 **Here's your personalized day plan:**\n\n`;
      
      if (urgentTasks.length > 0) {
        response += `🔴 **Urgent Tasks (do first):**\n`;
        urgentTasks.slice(0, 3).forEach(t => {
          response += `- ${t.title}\n`;
        });
        response += `\n`;
      }

      const highPriority = pendingTasks.filter(t => t.priority === 'high').slice(0, 3);
      if (highPriority.length > 0) {
        response += `🟠 **High Priority:**\n`;
        highPriority.forEach(t => {
          response += `- ${t.title}\n`;
        });
        response += `\n`;
      }

      response += `💡 **Tips for today:**\n`;
      response += `- Start with your most challenging task\n`;
      response += `- Take a 5-minute break every 25 minutes\n`;
      response += `- Review your progress at end of day\n`;

      return response;
    }

    // Goal suggestions
    if (lowerMessage.includes('goal') || lowerMessage.includes('suggest')) {
      return `🎯 **Suggested Goals Based on Your Activity:**\n\n` +
        `1. **Complete ${Math.max(5, pendingTasks.length)} tasks this week** - Stay productive!\n` +
        `2. **Build a 7-day habit streak** - Consistency is key\n` +
        `3. **Reduce urgent tasks to zero** - Better planning ahead\n` +
        `4. **Review and reflect weekly** - Track your growth\n\n` +
        `Would you like me to create any of these goals for you?`;
    }

    // Schedule optimization
    if (lowerMessage.includes('schedule') || lowerMessage.includes('optimize')) {
      const todayEvents = events.filter(e => 
        format(new Date(e.startDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      );

      return `📅 **Schedule Optimization Tips:**\n\n` +
        `You have ${todayEvents.length} events today and ${pendingTasks.length} pending tasks.\n\n` +
        `**Recommendations:**\n` +
        `- Block 2-hour focus time for deep work\n` +
        `- Group similar tasks together\n` +
        `- Leave buffer time between meetings\n` +
        `- Schedule energy-intensive tasks for your peak hours\n\n` +
        `Would you like me to help you create time blocks?`;
    }

    // Productivity tips
    if (lowerMessage.includes('productivity') || lowerMessage.includes('tips')) {
      return `💪 **Productivity Tips:**\n\n` +
        `1. **Use the 2-minute rule** - If it takes less than 2 minutes, do it now\n` +
        `2. **Time blocking** - Schedule specific times for specific tasks\n` +
        `3. **Eat the frog** - Do the hardest task first\n` +
        `4. **Limit work-in-progress** - Focus on finishing, not starting\n` +
        `5. **Review weekly** - Reflect on what worked and what didn't\n\n` +
        `You currently have ${habits.length} habits tracked. Consistent habits compound over time!`;
    }

    // Create task
    if (lowerMessage.includes('create task') || lowerMessage.includes('add task') || lowerMessage.includes('new task')) {
      return `✨ I can help you create a task! Please tell me:\n\n` +
        `- What's the task title?\n` +
        `- What priority? (urgent, high, medium, low)\n` +
        `- When is it due?\n\n` +
        `Or just click the "Add New" button to use the task form directly.`;
    }

    // Create habit
    if (lowerMessage.includes('habit') || lowerMessage.includes('routine')) {
      return `🔥 **Building habits is powerful!**\n\n` +
        `You're currently tracking ${activeHabits} habits.\n\n` +
        `**Suggested habits to consider:**\n` +
        `- Morning meditation (5-10 minutes)\n` +
        `- Daily exercise\n` +
        `- Reading for 30 minutes\n` +
        `- Journaling before bed\n` +
        `- Drinking 8 glasses of water\n\n` +
        `Head to the Habit Builder to create and track new habits!`;
    }

    // Status/overview
    if (lowerMessage.includes('status') || lowerMessage.includes('overview') || lowerMessage.includes('how am i doing')) {
      const completedToday = tasks.filter(t => 
        t.completedAt && format(new Date(t.completedAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      ).length;

      return `📊 **Your Current Status:**\n\n` +
        `✅ Completed today: ${completedToday} tasks\n` +
        `📝 Pending tasks: ${pendingTasks.length}\n` +
        `🔴 Urgent items: ${urgentTasks.length}\n` +
        `🎯 Active goals: ${activeGoals}\n` +
        `🔥 Active habits: ${activeHabits}\n\n` +
        (urgentTasks.length > 0 
          ? `⚠️ You have urgent tasks that need attention!`
          : `Great job staying on top of things! 🌟`);
    }

    // Default response
    return `I understand you're asking about "${userMessage}". Here are some things I can help with:\n\n` +
      `- **Plan your day** - Get a personalized task schedule\n` +
      `- **Suggest goals** - Based on your current activity\n` +
      `- **Optimize schedule** - Better time management\n` +
      `- **Productivity tips** - Proven strategies\n` +
      `- **Status overview** - See where you stand\n\n` +
      `What would you like to explore?`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = generateResponse(input);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleSuggestionClick = (action: string) => {
    const prompts: Record<string, string> = {
      plan_day: 'Help me plan my day',
      suggest_goals: 'Suggest goals for this week',
      optimize_schedule: 'Help me optimize my schedule',
      productivity_tips: 'Give me productivity tips',
    };
    setInput(prompts[action] || '');
    setTimeout(() => handleSend(), 100);
  };

  return (
    <>
      <Header title="AI Assistant" />
      <div className="content">
        <div className="grid grid-3" style={{ gap: 24 }}>
          {/* Chat Interface */}
          <div style={{ gridColumn: 'span 2' }}>
            <div className="ai-chat">
              <div className="ai-chat-messages">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`ai-message ${message.role}`}
                  >
                    {message.role === 'assistant' && (
                      <Sparkles
                        size={16}
                        color="var(--accent-primary)"
                        style={{ marginBottom: 8 }}
                      />
                    )}
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {message.content.split('**').map((part, i) => 
                        i % 2 === 0 ? part : <strong key={i}>{part}</strong>
                      )}
                    </div>
                    <div
                      className="text-sm text-muted"
                      style={{ marginTop: 8 }}
                    >
                      {format(message.timestamp, 'h:mm a')}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="ai-message assistant">
                    <div className="flex items-center gap-2">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="text-muted">AI is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="ai-chat-input">
                <input
                  type="text"
                  className="input"
                  placeholder="Ask me anything about your tasks, schedule, or productivity..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button className="btn btn-primary" onClick={handleSend}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="card">
              <h3 className="card-title mb-4">
                <Wand2 size={20} className="mr-2" style={{ display: 'inline' }} />
                Quick Prompts
              </h3>
              <div className="flex flex-col gap-3">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => handleSuggestionClick(suggestion.action)}
                  >
                    <suggestion.icon size={18} />
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>

            <div className="card mt-4">
              <h3 className="card-title mb-4">Templates</h3>
              <div className="flex flex-col gap-3">
                {state.templates.map(template => (
                  <button
                    key={template.id}
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start', flexDirection: 'column', alignItems: 'flex-start' }}
                    onClick={() => {
                      state.applyTemplate?.(template.id);
                      setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `✅ Applied "${template.name}" template! ${template.tasks.length} tasks have been created.`,
                        timestamp: new Date(),
                      }]);
                    }}
                  >
                    <span className="font-semibold">{template.name}</span>
                    <span className="text-sm text-muted">{template.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .typing-indicator {
          display: flex;
          gap: 4px;
        }
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: var(--accent-primary);
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
