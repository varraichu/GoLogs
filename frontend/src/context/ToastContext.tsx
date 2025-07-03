import { createContext } from 'preact'
import { useContext, useState, useMemo} from 'preact/hooks'
import ArrayDataProvider = require('ojs/ojarraydataprovider')

type Message = {
  id: string
  severity: string
  summary: string
  detail: string
  autoTimeout: string | number
  sound: string
}

type ToastContextType = {
  messages: Message[]
  addNewToast: (severity: string, summary: string, detail: string) => void
  removeToast: (id: string) => void
  messageDataProvider: any
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

import { ComponentChildren } from 'preact'

export const ToastProvider = ({ children }: { children: ComponentChildren }) => {
  const [messages, setMessages] = useState<Message[]>([])

  const addNewToast = (severity: string, summary: string, detail: string) => {
    const newMsg: Message = {
      id: `id-${Date.now()}`,
      severity,
      summary,
      detail,
      autoTimeout: 5000,
      sound: '',
    }
    setMessages((prev) => [...prev, newMsg])
  }

  const removeToast = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id))
  }

  const messageDataProvider = useMemo(
    () => new ArrayDataProvider(messages, { keyAttributes: 'id' }),
    [messages]
  )

  return (
    <ToastContext.Provider value={{ messages, addNewToast, removeToast ,messageDataProvider}}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}