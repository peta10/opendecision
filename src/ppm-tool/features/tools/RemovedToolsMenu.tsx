'use client';

import React, { useState, useRef } from 'react';
import { Plus, Eye, Tag } from 'lucide-react';
import { Tool } from '@/ppm-tool/shared/types';
import { useClickOutside } from '@/ppm-tool/shared/hooks/useClickOutside';

interface RemovedToolsMenuProps {
  removedTools: Tool[];
  onRestore: (tool: Tool) => void;
  onRestoreAll?: () => void;
}

export const RemovedToolsMenu: React.FC<RemovedToolsMenuProps> = ({
  removedTools,
  onRestore,
  onRestoreAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsOpen(false));

  if (removedTools.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {removedTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onRestore(tool)}
            className="group flex items-center space-x-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-sm text-gray-700">{tool.name}</span>
            <Plus className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        ))}
      </div>
    </div>
  );
};