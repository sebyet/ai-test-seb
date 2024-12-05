'use client';

import { ToolInvocation } from 'ai';
import { Message, useChat } from 'ai/react';
import { CourseCard } from './CourseCard';

export default function Chat() {
  const { messages, isLoading, input, handleInputChange, handleSubmit, addToolResult } =
    useChat({
      api: '/api/chat',
      maxSteps: 5,
    });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch gap-4">
      {messages?.map((m: Message) => (
        <div key={m.id} className="whitespace-pre-wrap flex flex-col gap-1">
          {isLoading && <div>Loading...</div>}
          {m.toolInvocations?.map((toolInvocation: ToolInvocation) => {
            const toolCallId = toolInvocation.toolCallId;
            switch (toolInvocation.toolName) {
              case 'getCoursesAndSuggestions':
                if (toolInvocation.state === 'result') {
                  return <div className="flex flex-col gap-4">
                    <div className="flex flex-row gap-4">{toolInvocation.result.generatedCourses.object.courses.map((course: any) => (
                    <CourseCard key={course.id} {...course} />
                  ))}</div>
                  <div>{toolInvocation.result.generatedSuggestionsText.text}</div>
                  </div>;
                }
                return null;
              default:
                return null;
            }
          })}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}