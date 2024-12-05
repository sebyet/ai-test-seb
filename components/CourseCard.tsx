import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface CourseCardProps {
  name: string
  description: string
  price: string
  duration: string
  course_id: string
}

export function CourseCard({ name, description, price, duration, course_id }: CourseCardProps) {
  return (
  
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Duration: {duration}</p>
          <p>Price: {price}</p>
      </CardContent>
        <CardFooter>
        <a href={`https://www.haufe-akademie.com/courses/${course_id}`}>
          <Button>Enroll Now</Button>
        </a>
        </CardFooter>
      </Card>
  )
}

