'use client';

import { cn } from '@/lib/utils';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full caption-bottom text-sm">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn('[&_tr]:border-b', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableProps) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr
      className={cn(
        'border-b border-gray-200 transition-colors hover:bg-gray-50',
        className
      )}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps extends TableProps {
  align?: 'left' | 'center' | 'right';
}

export function TableHead({ children, className, align = 'left' }: TableHeadProps) {
  return (
    <th
      className={cn(
        'h-12 px-4 font-medium text-gray-500 bg-gray-50',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
    >
      {children}
    </th>
  );
}

interface TableCellProps extends TableProps {
  align?: 'left' | 'center' | 'right';
}

export function TableCell({ children, className, align = 'left' }: TableCellProps) {
  return (
    <td
      className={cn(
        'px-4 py-3',
        align === 'left' && 'text-left',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
    >
      {children}
    </td>
  );
}
