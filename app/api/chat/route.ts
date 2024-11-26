import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';
import { courseCardTool } from '@/lib/tools';

interface RetrievedChunk {
  content: string;
  metadata: {
    type: string;
    [key: string]: any;
  };
}

export const POST = async (request: Request) => {
  const { messages } = await request.json();

  // Simulated chunks (in real app, this would come from your Python backend)
  async function fetchRelevantChunks(query: string): Promise<RetrievedChunk[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return [
      {
        content: "Introduction to Digital Marketing covers SEO basics, social media strategy, and content marketing fundamentals. Perfect for beginners wanting to start their marketing career.",
        metadata: {
          type: "course",
          course_id: "MKT101",
          title: "Introduction to Digital Marketing",
          instructor: "Sarah Johnson",
          level: "beginner"
        }
      },
      {
        content: "The current weather in London shows heavy rain with temperatures around 12°C. Expected to clear up by evening.",
        metadata: {
          type: "weather",
          location: "London",
          timestamp: "2024-03-20T14:30:00Z",
          condition: "rain"
        }
      },
      {
        content: "Our new AI Development Workshop series starts next week. Topics include machine learning basics, neural networks, and practical PyTorch applications.",
        metadata: {
          type: "event",
          event_id: "EV456",
          date: "2024-03-28",
          location: "Virtual",
          capacity: 50
        }
      },
      {
        content: "Python Programming Masterclass - Advanced concepts including async programming, design patterns, and system architecture.",
        metadata: {
          type: "course",
          course_id: "CS302",
          title: "Python Programming Masterclass",
          instructor: "Mike Chen",
          level: "advanced"
        }
      },
      {
        content: "The nearest coffee shop 'Bean Scene' is currently open and has a 4.5/5 rating. Located 0.3 miles from your location.",
        metadata: {
          type: "location",
          place_id: "LOC789",
          distance: 0.3,
          rating: 4.5,
          status: "open"
        }
      }
    ];
  }

  const lastUserMessage = messages[messages.length - 1].content;
  const chunks = await fetchRelevantChunks(lastUserMessage);
  
  // Group chunks by type
  const contextByType = chunks.reduce((acc, chunk) => {
    const type = chunk.metadata.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(chunk);
    return acc;
  }, {} as Record<string, RetrievedChunk[]>);

  // Format context based on chunk types
  const systemContext = Object.entries(contextByType)
    .map(([type, typeChunks]) => {
      switch (type) {
        case 'course':
          return `Available Courses:\n${typeChunks
            .map(chunk => `- ${chunk.metadata.title} (${chunk.metadata.level})\n  ${chunk.content}`)
            .join('\n')}`;
        case 'weather':
          return `Weather Information:\n${typeChunks
            .map(chunk => chunk.content)
            .join('\n')}`;
        case 'event':
          return `Upcoming Events:\n${typeChunks
            .map(chunk => `- Event: ${chunk.content}\n  Date: ${chunk.metadata.date}`)
            .join('\n')}`;
        case 'location':
          return `Nearby Places:\n${typeChunks
            .map(chunk => chunk.content)
            .join('\n')}`;
        default:
          return `Additional Information:\n${typeChunks
            .map(chunk => chunk.content)
            .join('\n')}`;
      }
    })
    .join('\n\n');

  const result = streamText({
    model: openai('gpt-4-turbo'),
    system: `You are a helpful assistant. Use the available information and appropriate tools to help users.
    
    Available Context:
    ${systemContext}
    
    Instructions:
    - For courses, use the courseCard tool to display course information
    - For weather queries, use the getWeatherInformation tool
    - For location-based queries, first use askForConfirmation before using getLocation
    - For events, provide detailed information including dates and registration details
    - Always use the most relevant tool based on the content type
    `,
    messages,
    tools: {
      // server-side tool with execute function:
      getWeatherInformation: {
        description: 'show the weather in a given city to the user',
        parameters: z.object({ city: z.string() }),
        execute: async ({}: { city: string }) => {
          return {
            value: 24,
            unit: 'celsius',
            weeklyForecast: [
              { day: 'Monday', value: 24 },
              { day: 'Tuesday', value: 25 },
              { day: 'Wednesday', value: 26 },
              { day: 'Thursday', value: 27 },
              { day: 'Friday', value: 28 },
              { day: 'Saturday', value: 29 },
              { day: 'Sunday', value: 30 },
            ],
          };
        },
      },
      // client-side tool that starts user interaction:
      askForConfirmation: {
        description: 'Ask the user for confirmation.',
        parameters: z.object({
          message: z.string().describe('The message to ask for confirmation.'),
        }),
      },
      // client-side tool that is automatically executed on the client:
      getLocation: {
        description:
          'Get the user location. Always ask for confirmation before using this tool.',
        parameters: z.object({}),
      },
      
      getCoursesCatalog: {
        description: 'Get the list of available courses to show to the user',
        parameters: z.object({}),
        execute: async () => {
          // This could be replaced with a real database query
          return {
            courses: [
              {
                id: 1,
                title: 'Introduction to Web Development',
                instructor: 'Dr. Sarah Johnson',
                duration: '8 weeks',
                price: 299
              },
              {
                id: 2,
                title: 'Advanced React Patterns',
                instructor: 'Mike Chen',
                duration: '6 weeks',
                price: 399
              },
              {
                id: 3,
                title: 'UI/UX Design Fundamentals',
                instructor: 'Emma Rodriguez',
                duration: '4 weeks',
                price: 249
              },
              {
                id: 4,
                title: 'Data Science Basics',
                instructor: 'Dr. James Smith',
                duration: '10 weeks',
                price: 499
              }
            ]
          };
        },
      },
      
      courseCard: {
        description: 'Display a course card with detailed information',
        parameters: z.object({
          course_id: z.string(),
          title: z.string(),
          instructor: z.string(),
          level: z.string(),
          description: z.string()
        }),
        execute: async (params) => {
          return params; // Pass through the course information
        },
      },
    },
  });

  return result.toDataStreamResponse();
}