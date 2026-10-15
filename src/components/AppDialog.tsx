import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import './AppDialog.css'

type DialogRequest = {
  kind: 'alert' | 'confirm'
  title: string
  message: string
  resolve: (value: boolean) => void
}

type AppDialogContextValue = {
  showAlert: (message: string, title?: string) => Promise<void>
  showConfirm: (message: string, title?: string) => Promise<boolean>
}

const AppDialogContext = createContext<AppDialogContextValue | null>(null)

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<DialogRequest[]>([])

  const enqueue = useCallback((kind: DialogRequest['kind'], message: string, title?: string) =>
    new Promise<boolean>(resolve => {
      setRequests(current => [...current, {
        kind,
        title: title || (kind === 'confirm' ? 'Please confirm' : 'Notice'),
        message,
        resolve,
      }])
    }), [])

  const showAlert = useCallback(async (message: string, title?: string) => {
    await enqueue('alert', message, title)
  }, [enqueue])

  const showConfirm = useCallback((message: string, title?: string) =>
    enqueue('confirm', message, title), [enqueue])

  const active = requests[0]
  const finish = (confirmed: boolean) => {
    if (!active) return
    active.resolve(confirmed)
    setRequests(current => current.slice(1))
  }

  return (
    <AppDialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {active && (
        <div className="app-dialog-backdrop" onMouseDown={event => {
          if (event.target === event.currentTarget) finish(false)
        }}>
          <section
            className="app-dialog"
            role={active.kind === 'confirm' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="app-dialog-title"
            aria-describedby="app-dialog-message"
          >
            <div className="app-dialog-mark" aria-hidden="true">
              {active.kind === 'confirm' ? '?' : 'i'}
            </div>
            <h2 id="app-dialog-title">{active.title}</h2>
            <p id="app-dialog-message">{active.message}</p>
            <div className="app-dialog-actions">
              {active.kind === 'confirm' && (
                <button className="app-dialog-button app-dialog-button--secondary" type="button" onClick={() => finish(false)}>
                  Cancel
                </button>
              )}
              <button className="app-dialog-button app-dialog-button--primary" type="button" autoFocus onClick={() => finish(true)}>
                {active.kind === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppDialogContext.Provider>
  )
}

export function useAppDialog() {
  const context = useContext(AppDialogContext)
  if (!context) throw new Error('useAppDialog must be used inside AppDialogProvider.')
  return context
}
