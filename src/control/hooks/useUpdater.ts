import { useEffect, useReducer, useRef } from 'react'
import { check, type Update } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { updaterReducer, INITIAL_UPDATER_STATE } from './updaterReducer'

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

export function useUpdater() {
  const [state, dispatch] = useReducer(updaterReducer, INITIAL_UPDATER_STATE)
  const checkingRef = useRef(false)
  const updateRef = useRef<Update | null>(null)
  const cancelledRef = useRef(false)
  const statusRef = useRef(state.status)

  useEffect(() => {
    statusRef.current = state.status
  }, [state.status])

  useEffect(() => {
    cancelledRef.current = false

    const runCheck = async () => {
      // Já há um update baixado esperando o clique do operador — não há
      // nada para checar e um recheck aqui só piscaria o banner "Reiniciar
      // agora" e rebaixaria o mesmo update à toa (RN-07).
      if (statusRef.current === 'ready') return
      if (checkingRef.current) return
      checkingRef.current = true
      dispatch({ type: 'CHECK_STARTED' })
      try {
        const update = await check()
        if (cancelledRef.current) return
        if (!update) {
          dispatch({ type: 'NO_UPDATE' })
          return
        }
        // Guardamos o handle em ref para `restart()` usar depois — só é
        // consumido (via install()) na ação explícita do usuário (RN-07).
        updateRef.current = update
        dispatch({ type: 'UPDATE_AVAILABLE', version: update.version })
        // Apenas baixa: download() nunca reinicia/encerra o app em nenhuma
        // plataforma. install() (que no Windows encerra o processo) só roda
        // quando o operador clica "Reiniciar agora".
        await update.download()
        if (cancelledRef.current) return
        dispatch({ type: 'DOWNLOAD_COMPLETE' })
      } catch (err) {
        if (cancelledRef.current) return
        // Erros de rede/API não podem virar ruído para o operador (RN-07) — log only.
        console.error('[updater] check failed:', err)
        dispatch({ type: 'CHECK_FAILED', error: String(err) })
      } finally {
        checkingRef.current = false
      }
    }

    runCheck()
    const interval = setInterval(runCheck, CHECK_INTERVAL_MS)
    return () => {
      cancelledRef.current = true
      clearInterval(interval)
    }
  }, [])

  const restart = async () => {
    // Defensivo: UpdateBanner só mostra o botão no estado 'ready', quando
    // updateRef.current sempre existe — mas não custa não quebrar aqui.
    if (!updateRef.current) {
      await relaunch()
      return
    }
    // install() aplica o update (no Windows, encerra e reabre o app sozinho
    // como parte disso); relaunch() é o que efetivamente reinicia no macOS.
    await updateRef.current.install()
    await relaunch()
  }

  return { ...state, restart }
}
