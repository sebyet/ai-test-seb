import { CourseCard, CourseCardProps } from '../components/CourseCard'

// Add fake course database
const courses = [
  {
    id: 1,
    title: "Web Development Fundamentals",
    description: "Learn HTML, CSS, and JavaScript basics to start your web development journey",
    price: "$99",
    duration: "8 weeks"
  },
  {
    id: 2,
    title: "Advanced React Development",
    description: "Master React.js with advanced patterns, hooks, and state management",
    price: "$149",
    duration: "10 weeks"
  },
  {
    id: 3,
    title: "AI and Machine Learning Basics",
    description: "Introduction to AI concepts, machine learning algorithms, and practical applications",
    price: "$199",
    duration: "12 weeks"
  }
];

export const courseCardTool = {
  name: 'courseCard',
  description: 'Show available courses to the user. Can filter by topic or price range.',
  parameters: {
    type: 'object',
    properties: {
      topic: { type: 'string', description: 'Topic to filter courses (optional)' },
      maxPrice: { type: 'number', description: 'Maximum price filter (optional)' }
    },
  },
  execute: ({ topic, maxPrice }: { topic?: string; maxPrice?: number }) => {
    let filteredCourses = [...courses];
    
    if (topic) {
      filteredCourses = filteredCourses.filter(course => 
        course.title.toLowerCase().includes(topic.toLowerCase()) ||
        course.description.toLowerCase().includes(topic.toLowerCase())
      );
    }
    
    if (maxPrice) {
      filteredCourses = filteredCourses.filter(course => 
        parseInt(course.price.replace('$', '')) <= maxPrice
      );
    }
    
    return filteredCourses;
  },
  render: (courses: CourseCardProps[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {courses.map((course, index) => (
        <CourseCard key={index} {...course} />
      ))}
    </div>
  ),
}

