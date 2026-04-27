import { describe, expect, it } from 'vitest'

import { getRendererAssetBase } from './vite-base'

describe('getRendererAssetBase', () => {
  it('uses relative asset paths for production builds so Electron file loading resolves renderer assets', () => {
    expect(getRendererAssetBase('build')).toBe('./')
  })

  it('keeps the dev server rooted at slash for live development', () => {
    expect(getRendererAssetBase('serve')).toBe('/')
  })
})
