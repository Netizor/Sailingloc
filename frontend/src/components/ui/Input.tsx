import React, { InputHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconClick?: () => void
  wrapperClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      wrapperClassName,
      className,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
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

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={cn(
              'block w-full rounded-lg border text-sm text-gray-900',
              'placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'transition-colors duration-150',
              leftIcon ? 'pl-9' : 'pl-3',
              rightIcon ? 'pr-9' : 'pr-3',
              'py-2',
              error
                ? 'border-red-400 focus:ring-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
                : 'border-gray-300 focus:ring-ocean-500 focus:border-ocean-500 bg-white dark:bg-gray-800 dark:border-gray-600',
              disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500 dark:bg-gray-700 dark:text-gray-500' : '',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span
              className={cn(
                'absolute right-3 flex items-center text-gray-400 dark:text-gray-500',
                onRightIconClick
                  ? 'cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                  : 'pointer-events-none'
              )}
              onClick={onRightIconClick}
              role={onRightIconClick ? 'button' : undefined}
              tabIndex={onRightIconClick ? 0 : undefined}
              onKeyDown={
                onRightIconClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') onRightIconClick()
                    }
                  : undefined
              }
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-red-600 flex items-center gap-1"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-xs text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
export type { InputProps }
