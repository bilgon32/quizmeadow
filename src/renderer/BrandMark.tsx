import optical from './brand/quizmeadow.svg'
import mono from './brand/quizmeadow-mono.svg'
export function BrandMark({large = false}: {large?: boolean}) {
 return <span className={`brand-mark ${large ? 'brand-mark-large' : ''}`} aria-hidden="true"><img src={large ? optical : mono} alt="" draggable={false}/></span>
}
