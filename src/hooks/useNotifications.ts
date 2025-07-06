import { toast } from 'sonner'

export const useNotifications = () => {
  return {
    success: (message: string, options?: any) => 
      toast.success(message, options),
    
    error: (message: string, options?: any) => 
      toast.error(message, options),
    
    warning: (message: string, options?: any) => 
      toast.warning(message, options),
    
    info: (message: string, options?: any) => 
      toast.info(message, options),
    
    loading: (message: string, options?: any) => 
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