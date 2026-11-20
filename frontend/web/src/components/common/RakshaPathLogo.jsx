import { Logo } from './Logo'

export { Logo }
export function RakshaPathEmblem({ size = 34, className = '', style = {} }) {
  return <Logo variant="icon" size={size} className={className} style={style} />
}

export function RakshaPathLogo({ variant = 'horizontal', size = 180, className = '', style = {} }) {
  if (variant === 'icon') {
    return <Logo variant="icon" size={typeof size === 'number' && size < 60 ? size : 34} className={className} style={style} />
  }
  return <Logo variant="full" size={size} className={className} style={style} />
}

export default Logo
