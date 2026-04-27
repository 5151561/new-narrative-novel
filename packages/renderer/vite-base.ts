export function getRendererAssetBase(command: 'build' | 'serve'): string {
  return command === 'build' ? './' : '/'
}
