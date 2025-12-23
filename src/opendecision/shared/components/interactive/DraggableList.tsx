'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  TouchSensor,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMobileDetection } from '@/opendecision/shared/hooks/useMobileDetection';

interface DraggableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
  getItemId: (item: T) => string;
}

export function DraggableList<T>({
  items,
  onReorder,
  renderItem,
  getItemId,
}: DraggableListProps<T>) {
  const isMobile = useMobileDetection();

  // Always create sensors but configure them based on mobile state
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 99999 : 8, // Effectively disable on mobile
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: isMobile ? 99999 : 200, // Effectively disable on mobile
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: isMobile ? undefined : sortableKeyboardCoordinates,
    })
  );

  // Guard against undefined items
  if (!items || !Array.isArray(items)) {
    return null;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => getItemId(item) === active.id);
      const newIndex = items.findIndex(item => getItemId(item) === over.id);
      
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={items.map(getItemId)}
        strategy={verticalListSortingStrategy}
        id="draggable-list"
      >
        {items.map(item => (
          <React.Fragment key={getItemId(item)}>
            {renderItem(item)}
          </React.Fragment>
        ))}
      </SortableContext>
    </DndContext>
  );
}