import React, { FormEvent, ReactNode } from 'react';
import { formDataToObject, ExtractFormData } from '../form-utils';

export interface TypeBridgeFormProps<T extends (data: any) => any> {
  action: T;
  children: ReactNode;
  className?: string;
  onSubmit?: (data: ExtractFormData<T>) => void;
  onSuccess?: (result: Awaited<ReturnType<T>>) => void;
  onError?: (error: Error) => void;
}

/**
 * TypeBridge Form component that automatically converts FormData to typed objects
 * and calls server functions with clean, typed data.
 */
export function Form<T extends (data: any) => any>({
  action,
  children,
  className,
  onSubmit,
  onSuccess,
  onError,
  ...props
}: TypeBridgeFormProps<T> & Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'action'>) {
  
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    try {
      const formData = new FormData(event.currentTarget);
      const data = formDataToObject(formData) as ExtractFormData<T>;
      
      // Call optional onSubmit callback
      onSubmit?.(data);
      
      // Call the server function
      const result = await action(data);
      
      // Call optional onSuccess callback
      onSuccess?.(result);
      
    } catch (error) {
      // Call optional onError callback
      onError?.(error as Error);
    }
  };

  return (
    <form 
      {...props}
      className={className}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  );
}

export default Form;