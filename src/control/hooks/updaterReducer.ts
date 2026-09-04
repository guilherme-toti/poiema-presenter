export type UpdaterStatus = 'idle' | 'checking' | 'downloading' | 'ready' | 'error'

export interface UpdaterState {
  status: UpdaterStatus
  version: string | null
  error: string | null
}

export type UpdaterAction =
  | { type: 'CHECK_STARTED' }
  | { type: 'UPDATE_AVAILABLE'; version: string }
  | { type: 'NO_UPDATE' }
  | { type: 'DOWNLOAD_COMPLETE' }
  | { type: 'CHECK_FAILED'; error: string }

export const INITIAL_UPDATER_STATE: UpdaterState = {
  status: 'idle',
  version: null,
  error: null,
}

export function updaterReducer(state: UpdaterState, action: UpdaterAction): UpdaterState {
  switch (action.type) {
    case 'CHECK_STARTED':
      return { ...state, status: 'checking', error: null }
    case 'UPDATE_AVAILABLE':
      return { status: 'downloading', version: action.version, error: null }
    case 'NO_UPDATE':
      return { status: 'idle', version: null, error: null }
    case 'DOWNLOAD_COMPLETE':
      return { ...state, status: 'ready' }
    case 'CHECK_FAILED':
      return { ...state, status: 'error', error: action.error }
    default:
      return state
  }
}
