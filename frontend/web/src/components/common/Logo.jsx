import logoFull from '../../assets/brand/logo-full.png'
import logoShield from '../../assets/brand/logo-shield.png'

export function Logo({ variant = 'full', size, className = '', style = {} }) {
  if (variant === 'icon') {
    const iconWidth = typeof size === 'number' ? size : 34
    const iconHeight = Math.round(iconWidth * (408 / 532))
    return (
      <img
        src={logoShield}
        alt="RakshaPath"
        width={iconWidth}
        height={iconHeight}
        className={`rp-logo-icon ${className}`}
        style={{
          width: iconWidth,
          height: iconHeight,
          objectFit: 'contain',
          display: 'block',
          ...style,
        }}
        loading="eager"
        decoding="async"
      />
    )
  }

  // Full logo: shield + wordmark, about 165px wide
  const fullWidth = typeof size === 'number' ? (size > 60 ? size : 165) : 165
  const fullHeight = Math.round(fullWidth * (534 / 852))

  return (
    <img
      src={logoFull}
      alt="RakshaPath"
      width={fullWidth}
      height={fullHeight}
      className={`rp-logo-full ${className}`}
      style={{
        width: fullWidth,
        maxWidth: '100%',
        height: 'auto',
        aspectRatio: '852 / 534',
        objectFit: 'contain',
        display: 'block',
        ...style,
      }}
      loading="eager"
      decoding="async"
    />
  )
}

export default Logo
