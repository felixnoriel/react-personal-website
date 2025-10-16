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
          see all <i className="fas fa-arrow-right ml-2" />
        </Button>
      </Link>
    </div>
  )
}
