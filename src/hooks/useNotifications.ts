import { toast, type ExternalToast } from 'sonner'

export const useNotifications = () => {
  return {
    success: (message: string, options?: ExternalToast) => 
      toast.success(message, options),
    
    error: (message: string, options?: ExternalToast) => 
      toast.error(message, options),
    
    warning: (message: string, options?: ExternalToast) => 
      toast.warning(message, options),
    
    info: (message: string, options?: ExternalToast) => 
      toast.info(message, options),
    
    loading: (message: string, options?: ExternalToast) => 
      toast.loading(message, options),
    
    dismiss: (toastId?: string | number) => 
      toast.dismiss(toastId),
    
    promise: <T>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((error: Error) => string)
      }
    ) => toast.promise(promise, { loading, success, error })
  }
} 