import dark from '../../assets/logo/quizmeadow-standard-dark.svg'
import light from '../../assets/logo/quizmeadow-standard-light.svg'
import displayDark from '../../assets/logo/quizmeadow-display-dark.svg'
import displayLight from '../../assets/logo/quizmeadow-display-light.svg'
export function BrandMark({large = false}: {large?: boolean}) {
 return <span className={`brand-mark ${large ? 'brand-mark-large' : ''}`} aria-hidden="true"><img className="logo-dark" src={large ? displayDark : dark} alt="" draggable={false}/><img className="logo-light" src={large ? displayLight : light} alt="" draggable={false}/></span>
}
