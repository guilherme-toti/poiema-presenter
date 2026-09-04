import { describe, it, expect } from 'vitest'
import { updaterReducer, INITIAL_UPDATER_STATE } from './updaterReducer'

describe('updaterReducer', () => {
  it('starts idle', () => {
    expect(INITIAL_UPDATER_STATE.status).toBe('idle')
  })

  it('moves to checking on CHECK_STARTED', () => {
    const state = updaterReducer(INITIAL_UPDATER_STATE, { type: 'CHECK_STARTED' })
    expect(state.status).toBe('checking')
  })

  it('moves to downloading with the version on UPDATE_AVAILABLE', () => {
    const checking = updaterReducer(INITIAL_UPDATER_STATE, { type: 'CHECK_STARTED' })
    const state = updaterReducer(checking, { type: 'UPDATE_AVAILABLE', version: '0.2.0' })
    expect(state).toEqual({ status: 'downloading', version: '0.2.0', error: null })
  })

  it('moves back to idle on NO_UPDATE', () => {
    const checking = updaterReducer(INITIAL_UPDATER_STATE, { type: 'CHECK_STARTED' })
    const state = updaterReducer(checking, { type: 'NO_UPDATE' })
    expect(state.status).toBe('idle')
  })

  it('moves to ready on DOWNLOAD_COMPLETE, keeping the version', () => {
    const downloading = updaterReducer(
      updaterReducer(INITIAL_UPDATER_STATE, { type: 'CHECK_STARTED' }),
      { type: 'UPDATE_AVAILABLE', version: '0.2.0' },
    )
    const state = updaterReducer(downloading, { type: 'DOWNLOAD_COMPLETE' })
    expect(state).toEqual({ status: 'ready', version: '0.2.0', error: null })
  })

  it('ignores CHECK_STARTED while ready, keeping the banner up', () => {
    const downloading = updaterReducer(
      updaterReducer(INITIAL_UPDATER_STATE, { type: 'CHECK_STARTED' }),
      { type: 'UPDATE_AVAILABLE', version: '0.2.0' },
    )
    const ready = updaterReducer(downloading, { type: 'DOWNLOAD_COMPLETE' })
    const state = updaterReducer(ready, { type: 'CHECK_STARTED' })
    expect(state).toEqual(ready)
    expect(state).toEqual({ status: 'ready', version: '0.2.0', error: null })
  })

  it('moves to error on CHECK_FAILED, keeping the message', () => {
    const state = updaterReducer(INITIAL_UPDATER_STATE, {
      type: 'CHECK_FAILED',
      error: 'network unreachable',
    })
    expect(state).toEqual({ status: 'error', version: null, error: 'network unreachable' })
  })
})
