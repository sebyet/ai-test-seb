import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface CourseCardProps {
  title: string
  description: string
  price: string
  duration: string
}

export function CourseCard({ title, description, price, duration }: CourseCardProps) {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Duration: {duration}</p>
        <p>Price: {price}</p>
      </CardContent>
      <CardFooter>
        <Button>Enroll Now</Button>
      </CardFooter>
    </Card>
  )
}

