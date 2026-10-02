declare module '*design-vendor/motion.mjs' {
 export function createMotion(root: HTMLElement): {enterOnce(node: HTMLElement): boolean; signalChange(node: HTMLElement): void; toggleDisclosure(node: HTMLDetailsElement): void; finish(): void; destroy(): void}
}
