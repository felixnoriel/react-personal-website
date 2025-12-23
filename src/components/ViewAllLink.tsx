import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from './ui/button'

interface ViewAllLinkProps {
  route: string
  indexPage?: boolean
}

export function ViewAllLink({ route, indexPage = false }: ViewAllLinkProps) {
  if (!indexPage) {
    return null
  }

  return (
    <div className="flex justify-center mt-8">
      <Link to={`/${route}`}>
        <Button variant="link" className="text-lg">
          see all <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </div>
  )
}
