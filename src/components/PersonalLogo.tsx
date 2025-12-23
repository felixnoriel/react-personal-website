
interface PersonalLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
}

export function PersonalLogo({ size = 'md', animated = true }: PersonalLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-32 h-32',
  }

  return (
    <div className="relative inline-block">
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 rounded-full blur-md opacity-30" />
      )}
      <div
        className={`relative ${sizeClasses[size]} rounded-full flex items-center justify-center shadow-lg bg-white overflow-hidden`}
      >
        <img
          src="https://felixstatic.s3.ap-southeast-2.amazonaws.com/uploads/images/felixnoriellogo.png"
          alt="Felix Noriel Logo"
          width={128}
          height={128}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
