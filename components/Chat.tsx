'use client';

import { ToolInvocation } from 'ai';
import { Message, useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, addToolResult } =
    useChat({
      api: '/api/chat',
      maxSteps: 5,

      // run client-side tools that are automatically executed:
      async onToolCall({ toolCall }) {
        if (toolCall.toolName === 'getLocation') {
          const cities = [
            'New York',
            'Los Angeles',
            'Chicago',
            'San Francisco',
          ];
          return cities[Math.floor(Math.random() * cities.length)];
        }
        if (toolCall.toolName === 'getCoursesCatalog') {
          // Fake course data
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
        }
      },
    });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch gap-4">
      {messages?.map((m: Message) => (
        <div key={m.id} className="whitespace-pre-wrap flex flex-col gap-1">
          <strong>{`${m.role}: `}</strong>
          {m.content}
          {m.toolInvocations?.map((toolInvocation: ToolInvocation) => {
            const toolCallId = toolInvocation.toolCallId;

            // render confirmation tool (client-side tool with user interaction)
            if (toolInvocation.toolName === 'askForConfirmation') {
              return (
                <div
                  key={toolCallId}
                  className="text-gray-500 flex flex-col gap-2"
                >
                  {toolInvocation.args.message}
                  <div className="flex gap-2">
                    {'result' in toolInvocation ? (
                      <b>{toolInvocation.result}</b>
                    ) : (
                      <>
                        <button
                          className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                          onClick={() =>
                            addToolResult({
                              toolCallId,
                              result: 'Yes, confirmed.',
                            })
                          }
                        >
                          Yes
                        </button>
                        <button
                          className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
                          onClick={() =>
                            addToolResult({
                              toolCallId,
                              result: 'No, denied',
                            })
                          }
                        >
                          No
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            }

            // other tools:
            return 'result' in toolInvocation ? (
              toolInvocation.toolName === 'getWeatherInformation' ? (
                <div
                  key={toolCallId}
                  className="flex flex-col gap-2 p-4 bg-blue-400 rounded-lg"
                >
                  <div className="flex flex-row justify-between items-center">
                    <div className="text-4xl text-blue-50 font-medium">
                      {toolInvocation.result.value}°
                      {toolInvocation.result.unit === 'celsius' ? 'C' : 'F'}
                    </div>

                    <div className="h-9 w-9 bg-amber-400 rounded-full flex-shrink-0" />
                  </div>
                  <div className="flex flex-row gap-2 text-blue-50 justify-between">
                    {toolInvocation.result.weeklyForecast.map(
                      (forecast: any) => (
                        <div
                          key={forecast.day}
                          className="flex flex-col items-center"
                        >
                          <div className="text-xs">{forecast.day}</div>
                          <div>{forecast.value}°</div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : toolInvocation.toolName === 'getLocation' ? (
                <div
                  key={toolCallId}
                  className="text-gray-500 bg-gray-100 rounded-lg p-4"
                >
                  User is in {toolInvocation.result}.
                </div>
              ) : toolInvocation.toolName === 'getCoursesCatalog' ? (
                <div
                  key={toolCallId}
                  className="flex flex-col gap-2 p-4 bg-indigo-100 rounded-lg"
                >
                  <div className="text-xl font-semibold mb-2">Available Courses</div>
                  <div className="grid grid-cols-2 gap-4">
                    {toolInvocation.result.courses.map((course: any) => (
                      <div
                        key={course.id}
                        className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="font-medium text-indigo-600">{course.title}</div>
                        <div className="text-sm text-gray-600">{course.instructor}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Duration: {course.duration}
                        </div>
                        <div className="mt-2 text-sm font-medium text-indigo-500">
                          ${course.price}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : toolInvocation.toolName === 'courseCard' ? (
                <div
                  key={toolCallId}
                  className="p-4 bg-white rounded-lg shadow-md border border-gray-200"
                >
                  <div className="flex flex-col gap-2">
                    <div className="text-xl font-semibold text-indigo-600">
                      {toolInvocation.result.title}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {toolInvocation.result.instructor}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium text-white bg-indigo-500 rounded-full">
                        {toolInvocation.result.level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                      {toolInvocation.result.description}
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">
                        Course ID: {toolInvocation.result.course_id}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={toolCallId} className="text-gray-500">
                  Tool call {`${toolInvocation.toolName}: `}
                  {toolInvocation.result}
                </div>
              )
            ) : (
              <div key={toolCallId} className="text-gray-500">
                Calling {toolInvocation.toolName}...
              </div>
            );
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