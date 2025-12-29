import React from 'react';
import { Typography } from '../ui/Typography';

interface DashboardCardProps {
  title: string;
  colSpan?: 3 | 4 | 6 | 12;
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  colSpan = 6,
  children,
  onRemove,
  className = '',
}) => {
  // Map colSpan to Tailwind class
  const colSpanClass = {
    3: 'col-span-12 md:col-span-3',
    4: 'col-span-12 md:col-span-4',
    6: 'col-span-12 md:col-span-6',
    12: 'col-span-12',
  }[colSpan];

  return (
    <div className={`bg-white border border-border ${colSpanClass} flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-gray-100 px-4 py-3 border-b border-border flex items-center justify-between group cursor-grab active:cursor-grabbing">
        <Typography variant="small" className="uppercase font-bold tracking-widest text-gray-600">
          {title}
        </Typography>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Drag handle */}
          <div className="flex gap-[2px]" title="Drag to reorder">
            <div className="w-[2px] h-[12px] bg-gray-400" />
            <div className="w-[2px] h-[12px] bg-gray-400" />
            <div className="w-[2px] h-[12px] bg-gray-400" />
          </div>
          {/* Remove button */}
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-error transition-colors font-mono text-xs"
              title="Remove card"
            >
              [×]
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 bg-white relative">
        {children}

        {/* Resize Handle (Visual) */}
        <div
          className="absolute bottom-0 right-0 w-2 h-2 bg-ink cursor-nwse-resize opacity-0 hover:opacity-100 transition-opacity"
          title="Resize"
        />
      </div>
    </div>
  );
};
