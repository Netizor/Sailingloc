import { TextareaHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '../../lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  wrapperClassName?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      wrapperClassName,
      className,
      id,
      disabled,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId()
    const textareaId = id ?? generatedId

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          className={cn(
            'block w-full rounded-lg border text-sm text-gray-900',
            'placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'transition-colors duration-150',
            'px-3 py-2 resize-none',
            error
              ? 'border-red-400 focus:ring-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
              : 'border-gray-300 focus:ring-ocean-500 focus:border-ocean-500 bg-white dark:bg-gray-800 dark:border-gray-600',
            disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500 dark:bg-gray-700 dark:text-gray-500' : '',
            className,
          )}
          {...props}
        />

        {error && (
          <p
            id={`${textareaId}-error`}
            className="text-xs text-red-600 flex items-center gap-1"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="text-xs text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'

export default Textarea
export type { TextareaProps }
