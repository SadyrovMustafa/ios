import { useState, useEffect } from 'react'
import Toast from './Toast'
import { toastService } from '../services/ToastService'
import './ToastContainer.css'

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: string; props: any }>>([])

  useEffect(() => {
    const unsubscribe = toastService.subscribe((newToasts) => {
      setToasts(newToasts.map((toast, index) => ({
        id: `${Date.now()}-${index}`,
        props: toast
      })))
    })

    return unsubscribe
  }, [])

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast.props} />
      ))}
    </div>
  )
}

