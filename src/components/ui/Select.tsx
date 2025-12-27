'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  options?: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, label, error, value, onChange, options, placeholder = 'Select...', disabled, children }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalOptions, setInternalOptions] = useState<SelectOption[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse children (option elements) into options array if not provided
    useEffect(() => {
      if (options) {
        setInternalOptions(options);
      } else if (children) {
        const parsedOptions: SelectOption[] = [];
        React.Children.forEach(children, (child) => {
          if (React.isValidElement<{ value?: string; children?: React.ReactNode }>(child) && child.type === 'option') {
            parsedOptions.push({
              value: String(child.props.value ?? ''),
              label: String(child.props.children ?? ''),
            });
          }
        });
        setInternalOptions(parsedOptions);
      }
    }, [children, options]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape key
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const selectedOption = internalOptions.find(opt => opt.value === value);

    const handleSelect = (optionValue: string) => {
      onChange?.({ target: { value: optionValue } });
      setIsOpen(false);
    };

    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-[#586c96] focus:border-transparent focus:bg-white',
              'hover:bg-white transition-all',
              disabled && 'cursor-not-allowed opacity-50',
              error && 'border-red-500 focus:ring-red-500',
              isOpen && 'bg-white ring-2 ring-[#586c96] border-transparent',
              className
            )}
            disabled={disabled}
          >
            <span className={cn(
              'truncate',
              selectedOption ? 'text-gray-900' : 'text-gray-500'
            )}>
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown className={cn(
              'h-4 w-4 text-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )} />
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
              <div className="max-h-60 overflow-auto py-1">
                {internalOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors',
                      option.value === value
                        ? 'bg-[#f0f3f8] text-[#586c96] font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <span>{option.label}</span>
                    {option.value === value && (
                      <Check className="h-4 w-4 text-[#586c96]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
