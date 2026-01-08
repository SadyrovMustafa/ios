import { ToastProps } from '../components/Toast'

type ToastOptions = Omit<ToastProps, 'onClose'>

class ToastService {
  private toasts: ToastProps[] = []
  private listeners: Array<(toasts: ToastProps[]) => void> = []

  subscribe(listener: (toasts: ToastProps[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  show(options: ToastOptions) {
    const toast: ToastProps = {
      ...options,
      onClose: () => this.remove(toast)
    }
    this.toasts.push(toast)
    this.notify()
    return toast
  }

  remove(toast: ToastProps) {
    this.toasts = this.toasts.filter(t => t !== toast)
    this.notify()
  }

  success(message: string, duration?: number) {
    return this.show({ message, type: 'success', duration })
  }

  error(message: string, duration?: number) {
    return this.show({ message, type: 'error', duration })
  }

  warning(message: string, duration?: number) {
    return this.show({ message, type: 'warning', duration })
  }

  info(message: string, duration?: number) {
    return this.show({ message, type: 'info', duration })
  }

  getToasts() {
    return [...this.toasts]
  }
}

export const toastService = new ToastService()

