import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  labelClassName?: string;
  dark?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, labelClassName, className = '', dark, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className={`block text-sm font-medium mb-1 ${labelClassName || (dark ? 'text-gray-300' : 'text-gray-700')}`}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`block w-full rounded-lg border ${
            error ? 'border-red-500 focus:ring-red-500' : dark ? 'border-gray-700 focus:ring-accent bg-gray-800 text-gray-300' : 'border-gray-300 focus:ring-accent'
          } px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
