import { Badge } from './ui/badge'

interface TagProps {
  title: string
  className?: string
}

export function Tag({ title, className }: TagProps) {
  return (
    <Badge variant="secondary" className={className}>
      <span dangerouslySetInnerHTML={{ __html: title }} />
    </Badge>
  )
}
