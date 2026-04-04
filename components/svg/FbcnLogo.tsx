interface FbcnLogoProps {
  fill?: string
  className?: string
}

export function FbcnLogo({ fill = "currentColor", className }: FbcnLogoProps) {
  return (
    <svg width="590" height="590" viewBox="0 0 590 590" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g clipPath="url(#clip0_logo)">
        <path d="M285.136 153.194L166.21 192.464L171.034 213.505L285.136 192.119V256.248L181.993 272.258L188.573 307.434H120.203L87.4924 154.348L285.136 83.1866V153.194Z" fill={fill} />
        <path d="M285.136 386.241H204.78L207.424 399.834L285.136 448.939V516.333L145.288 424.811L124.415 327.163H285.136V386.241Z" fill={fill} />
        <path d="M295 0L4 108.726L89.9289 464.722L295 590L500.061 464.722L586 108.726L295 0ZM479.899 448.939L295 569.946L110.092 448.939L41.7018 128.888L295 37.7018L548.289 128.888L479.899 448.939Z" fill={fill} />
        <path d="M465.575 327.163L444.702 424.811L379.351 467.583L359.296 404.677L341.037 492.658L304.864 516.333V327.163H372.051L405.896 399.361L411.311 327.163H465.575Z" fill={fill} />
        <path d="M486.804 227.819H439.671L480.648 256.603L469.788 307.424H304.864V83.1767L364.88 104.79L336.825 150.472L385.052 142.58L341.205 216.238L379.163 213.86L346.433 286.186L435.025 195.197L403.686 193.313L450.996 135.793L502.508 154.339L486.804 227.819Z" fill={fill} />
      </g>
      <defs>
        <clipPath id="clip0_logo">
          <rect width="590" height="590" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
