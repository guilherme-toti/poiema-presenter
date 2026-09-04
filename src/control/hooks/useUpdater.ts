import { useEffect, useReducer, useRef } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { updaterReducer, INITIAL_UPDATER_STATE } from './updaterReducer'

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

export function useUpdater() {
  const [state, dispatch] = useReducer(updaterReducer, INITIAL_UPDATER_STATE)
  const checkingRef = useRef(false)

  useEffect(() => {
    const runCheck = async () => {
      if (checkingRef.current) return
      checkingRef.current = true
      dispatch({ type: 'CHECK_STARTED' })
      try {
        const update = await check()
        if (!update) {
          dispatch({ type: 'NO_UPDATE' })
          return
        }
        dispatch({ type: 'UPDATE_AVAILABLE', version: update.version })
        await update.downloadAndInstall()
        dispatch({ type: 'DOWNLOAD_COMPLETE' })
      } catch (err) {
        // Erros de rede/API não podem virar ruído para o operador (RN-07) — log only.
        console.error('[updater] check failed:', err)
        dispatch({ type: 'CHECK_FAILED', error: String(err) })
      } finally {
        checkingRef.current = false
      }
    }

    runCheck()
    const interval = setInterval(runCheck, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return { ...state, restart: relaunch }
}
