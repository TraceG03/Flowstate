import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Header from './Header';
import { Send, Sparkles, Lightbulb, Calendar, CheckSquare, Target, AlertCircle, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { chat, isOpenAIConfigured, parseAIResponse, type ProductivityContext, type ChatMessage } from '../lib/openai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pending?: {
    type: 'task' | 'habit' | 'goal';
    data: Record<string, unknown>;
  };
}

const suggestions = [
  { icon: CheckSquare, text: 'Help me plan my day', action: 'plan_day' },
  { icon: Target, text: 'Suggest goals for this week', action: 'suggest_goals' },
  { icon: Calendar, text: 'Optimize my schedule', action: 'optimize_schedule' },
  { icon: Lightbulb, text: 'Give productivity tips', action: 'productivity_tips' },
];

export default function AIAssistant() {
  const { state, addTask, addHabit, addGoal, applyTemplate } = useApp();
  const { tasks, habits, goals, events } = state;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: isOpenAIConfigured 
        ? `Hello! I'm your AI productivity assistant powered by GPT-4. I have access to your tasks, habits, goals, and schedule - so I can give you personalized advice!\n\n**What can I help you with today?**\n- 📋 Plan your day\n- 🎯 Set meaningful goals\n- 💪 Build better habits\n- ⏰ Optimize your schedule\n- ✨ Create tasks with natural language\n\nJust ask me anything!`
        : `Hello! I'm your AI productivity assistant. To unlock my full potential with GPT-4, please add your OpenAI API key to the environment variables.\n\nIn the meantime, I can still help with basic suggestions based on your data!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Build context for AI
  const buildContext = (): ProductivityContext => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const completedToday = tasks.filter(t => 
      t.completedAt && format(new Date(t.completedAt), 'yyyy-MM-dd') === todayStr
    ).length;

    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent');

    return {
      tasks: tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
      })),
      habits: habits.map(h => ({
        name: h.name,
        streak: h.streak,
        frequency: h.frequency,
      })),
      goals: goals.map(g => ({
        title: g.title,
        progress: g.progress,
        achieved: g.achieved,
      })),
      events: events.map(e => ({
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
      })),
      completedToday,
      pendingTasks: pendingTasks.length,
      urgentTasks: urgentTasks.length,
    };
  };

  // Fallback response generator (when OpenAI not configured)
  const generateFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent');
    const activeGoals = goals.filter(g => !g.achieved).length;
    const activeHabits = habits.length;

    if (lowerMessage.includes('plan') || lowerMessage.includes('day')) {
      let response = `📋 **Your Day Plan:**\n\n`;
      
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

    if (lowerMessage.includes('goal') || lowerMessage.includes('suggest')) {
      return `🎯 **Suggested Goals Based on Your Activity:**\n\n` +
        `1. **Complete ${Math.max(5, pendingTasks.length)} tasks this week** - Stay productive!\n` +
        `2. **Build a 7-day habit streak** - Consistency is key\n` +
        `3. **Reduce urgent tasks to zero** - Better planning ahead\n` +
        `4. **Review and reflect weekly** - Track your growth\n\n` +
        `*Add your OpenAI API key to unlock personalized AI suggestions!*`;
    }

    if (lowerMessage.includes('schedule') || lowerMessage.includes('optimize')) {
      const todayEvents = events.filter(e => 
        format(new Date(e.startDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      );

      return `📅 **Schedule Overview:**\n\n` +
        `You have ${todayEvents.length} events today and ${pendingTasks.length} pending tasks.\n\n` +
        `**Recommendations:**\n` +
        `- Block 2-hour focus time for deep work\n` +
        `- Group similar tasks together\n` +
        `- Leave buffer time between meetings\n\n` +
        `*Add your OpenAI API key for AI-powered schedule optimization!*`;
    }

    if (lowerMessage.includes('status') || lowerMessage.includes('overview')) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const completedToday = tasks.filter(t => 
        t.completedAt && format(new Date(t.completedAt), 'yyyy-MM-dd') === todayStr
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

    return `I can help you with:\n\n` +
      `- **"Plan my day"** - Get a task schedule\n` +
      `- **"Suggest goals"** - Based on your activity\n` +
      `- **"Optimize schedule"** - Better time management\n` +
      `- **"Status overview"** - See where you stand\n\n` +
      `*For smarter AI responses, add your OpenAI API key!*`;
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
    setStreamingContent('');

    if (isOpenAIConfigured) {
      try {
        // Build chat history for context
        const chatHistory: ChatMessage[] = messages
          .slice(-10) // Last 10 messages for context
          .map(m => ({
            role: m.role,
            content: m.content,
          }));
        
        chatHistory.push({ role: 'user', content: input });

        // Stream the response
        let fullResponse = '';
        await chat(
          chatHistory,
          buildContext(),
          (chunk) => {
            fullResponse += chunk;
            setStreamingContent(fullResponse);
          }
        );

        // Parse for actionable items
        const parsed = parseAIResponse(fullResponse);
        console.log('Parsed AI response:', parsed);

        // Automatically create items if AI included them
        let createdItem = '';
        
        if (parsed.task) {
          try {
            await addTask({
              title: parsed.task.title,
              description: '',
              status: 'todo',
              priority: (parsed.task.priority as 'urgent' | 'high' | 'medium' | 'low') || 'medium',
              tags: [],
              dueDate: parsed.task.dueDate || null,
              startDate: null,
              endDate: null,
              projectId: null,
              completedAt: null,
              assignee: null,
              color: '#6366f1',
            });
            createdItem = `\n\n✅ **Task created:** "${parsed.task.title}"`;
            console.log('Task created successfully:', parsed.task.title);
          } catch (e) {
            console.error('Failed to create task:', e);
            createdItem = `\n\n⚠️ Failed to create task. Please try again.`;
          }
        }
        
        if (parsed.habit) {
          try {
            await addHabit({
              name: parsed.habit.name,
              description: parsed.habit.description || '',
              frequency: (parsed.habit.frequency as 'daily' | 'weekly' | 'monthly') || 'daily',
              targetCount: 1,
              color: '#10b981',
            });
            createdItem = `\n\n✅ **Habit created:** "${parsed.habit.name}"`;
            console.log('Habit created successfully:', parsed.habit.name);
          } catch (e) {
            console.error('Failed to create habit:', e);
            createdItem = `\n\n⚠️ Failed to create habit. Please try again.`;
          }
        }
        
        if (parsed.goal) {
          try {
            await addGoal({
              title: parsed.goal.title,
              description: parsed.goal.description || '',
              targetDate: parsed.goal.targetDate || null,
              milestones: [],
            });
            createdItem = `\n\n✅ **Goal created:** "${parsed.goal.title}"`;
            console.log('Goal created successfully:', parsed.goal.title);
          } catch (e) {
            console.error('Failed to create goal:', e);
            createdItem = `\n\n⚠️ Failed to create goal. Please try again.`;
          }
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: parsed.text + createdItem,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('AI Error:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Sorry, I encountered an error. ${error instanceof Error ? error.message : 'Please try again.'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } else {
      // Fallback to simulated responses
      await new Promise(resolve => setTimeout(resolve, 800));
      const response = generateFallbackResponse(input);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    }

    setIsTyping(false);
    setStreamingContent('');
  };

  const handleCreateItem = async (message: Message) => {
    if (!message.pending) return;

    const { type, data } = message.pending;

    try {
      if (type === 'task' && data.title) {
        await addTask({
          title: data.title as string,
          description: '',
          status: 'todo',
          priority: (data.priority as 'urgent' | 'high' | 'medium' | 'low') || 'medium',
          tags: [],
          dueDate: (data.dueDate as string) || null,
          startDate: null,
          endDate: null,
          projectId: null,
          completedAt: null,
          assignee: null,
          color: '#6366f1',
        });

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Created task: **${data.title}**`,
          timestamp: new Date(),
        }]);
      } else if (type === 'habit' && data.name) {
        await addHabit({
          name: data.name as string,
          description: (data.description as string) || '',
          frequency: (data.frequency as 'daily' | 'weekly' | 'monthly') || 'daily',
          targetCount: 1,
          color: '#10b981',
        });

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Created habit: **${data.name}**`,
          timestamp: new Date(),
        }]);
      } else if (type === 'goal' && data.title) {
        await addGoal({
          title: data.title as string,
          description: (data.description as string) || '',
          targetDate: (data.targetDate as string) || null,
          milestones: [],
        });

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ Created goal: **${data.title}**`,
          timestamp: new Date(),
        }]);
      }

      // Remove the pending action from the message
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, pending: undefined } : m
      ));
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleSuggestionClick = (action: string) => {
    const prompts: Record<string, string> = {
      plan_day: 'Help me plan my day based on my current tasks and schedule',
      suggest_goals: 'Suggest meaningful goals I should set this week based on my activity',
      optimize_schedule: 'Analyze my schedule and suggest ways to be more productive',
      productivity_tips: 'Give me personalized productivity tips based on my patterns',
    };
    setInput(prompts[action] || '');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Header title="AI Assistant" />
      <div className="ai-assistant">
        <div className="ai-chat-container">
          {/* Sidebar with context */}
          <div className="ai-sidebar">
            <div className="ai-status-card">
              <div className="ai-status-header">
                <Zap size={20} color="var(--accent-primary)" />
                <span>AI Status</span>
              </div>
              {isOpenAIConfigured ? (
                <div className="ai-status-badge success">
                  <span className="status-dot"></span>
                  GPT-4o Mini Connected
                </div>
              ) : (
                <div className="ai-status-badge warning">
                  <AlertCircle size={14} />
                  API Key Required
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="card-title">Quick Actions</h3>
              <div className="ai-suggestions">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="ai-suggestion-btn"
                    onClick={() => handleSuggestionClick(suggestion.action)}
                  >
                    <suggestion.icon size={16} />
                    <span>{suggestion.text}</span>
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
                      applyTemplate(template.id);
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

          {/* Main chat area */}
          <div className="ai-chat-main">
            <div className="ai-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`ai-message ${message.role === 'user' ? 'user' : 'assistant'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="ai-avatar">
                      <Sparkles size={18} />
                    </div>
                  )}
                  <div className="ai-message-content">
                    <div className="ai-message-text" dangerouslySetInnerHTML={{ 
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }} />
                    {message.pending && (
                      <div className="ai-action-card">
                        <p>Would you like me to create this {message.pending.type}?</p>
                        <div className="ai-action-buttons">
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleCreateItem(message)}
                          >
                            Create {message.pending.type}
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setMessages(prev => 
                              prev.map(m => m.id === message.id ? { ...m, pending: undefined } : m)
                            )}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <span className="ai-message-time">
                      {format(message.timestamp, 'h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Streaming response */}
              {isTyping && streamingContent && (
                <div className="ai-message assistant">
                  <div className="ai-avatar">
                    <Sparkles size={18} />
                  </div>
                  <div className="ai-message-content">
                    <div className="ai-message-text" dangerouslySetInnerHTML={{ 
                      __html: streamingContent
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }} />
                  </div>
                </div>
              )}
              
              {/* Typing indicator */}
              {isTyping && !streamingContent && (
                <div className="ai-message assistant">
                  <div className="ai-avatar">
                    <Sparkles size={18} />
                  </div>
                  <div className="ai-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="ai-input-container">
              <div className="ai-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={isOpenAIConfigured 
                    ? "Ask me anything about your productivity..." 
                    : "Add OpenAI API key for full AI features..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="ai-input"
                />
                <button 
                  className="ai-send-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="ai-input-hint">
                {isOpenAIConfigured 
                  ? 'Try: "Create a task to review project proposal by Friday"' 
                  : 'API key required for task creation via AI'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
