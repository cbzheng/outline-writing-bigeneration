import React from 'react';
import { Block, Comment } from '../types';
import { GripVertical, MessageSquarePlus, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { DraggableProvided } from '@hello-pangea/dnd';

interface BlockItemProps {
  block: Block;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onRemove: (id: string) => void;
  onAddComment: (id: string) => void;
  onEditComment: (blockId: string, commentId: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  dragProvided?: DraggableProvided;
}

export const BlockItem: React.FC<BlockItemProps> = ({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onAddComment,
  onEditComment,
  onIndent,
  onOutdent,
  dragProvided
}) => {
  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-slate-100 border-l-4 border-blue-500';
      case 1: return 'bg-white border-l-4 border-slate-300 ml-4';
      case 2: return 'bg-white border-l-2 border-slate-200 ml-8';
      default: return 'bg-white';
    }
  };

  return (
    <div
      className={`group relative flex flex-col gap-2 p-3 mb-2 rounded-md transition-all duration-200 border ${isSelected ? 'border-blue-400 ring-1 ring-blue-400 shadow-md z-10' : 'border-slate-200 hover:border-slate-300'
        } ${getLevelColor(block.level)}`}
      onClick={() => onSelect(block.id)}
      ref={dragProvided?.innerRef}
      {...dragProvided?.draggableProps}
      style={{
        ...dragProvided?.draggableProps.style,
        // Preserve original style if needed, but dnd handles positioning
      }}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <div
          className="mt-1 text-slate-400 cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
          {...dragProvided?.dragHandleProps}
        >
          <GripVertical size={16} />
        </div>

        <div className="flex-1">
          <input
            type="text"
            value={block.title}
            onChange={(e) => onUpdate(block.id, { title: e.target.value })}
            className={`w-full bg-transparent outline-none ${block.level === 0 ? 'font-bold text-slate-800' :
              block.level === 1 ? 'font-semibold text-slate-700' : 'text-slate-600'
              }`}
            placeholder="Outline point..."
            title="Edit outline title"
          />

          {/* Comments Badges */}
          {block.comments.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {block.comments.map(c => (
                <button
                  key={c.id}
                  onClick={(e) => { e.stopPropagation(); onEditComment(block.id, c.id); }}
                  title={c.text} // View by hovering
                  className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium flex items-center gap-1 hover:brightness-95 active:scale-95 transition-all
                            ${c.type === 'must' ? 'bg-red-100 text-red-700' :
                      c.type === 'maybe' ? 'bg-amber-100 text-amber-700' :
                        c.type === 'creative' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  {c.type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onOutdent(block.id); }} className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30" disabled={block.level <= 0} title="Outdent Level">
            <ChevronLeft size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onIndent(block.id); }} className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30" disabled={block.level >= 2} title="Indent Level">
            <ChevronRight size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onAddComment(block.id); }} className="p-1 hover:bg-blue-100 rounded text-blue-500" title="Add Instruction/Comment">
            <MessageSquarePlus size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(block.id); }} className="p-1 hover:bg-red-100 rounded text-red-500" title="Remove Block & Sub-blocks">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
