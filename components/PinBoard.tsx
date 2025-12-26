
import React, { useState, useRef, useEffect } from 'react';
import { BoardBlueprint, PinItem, PinColor, CardColor } from '../types';
import { useDraggable } from '../hooks/useDraggable'; // Simple custom hook or Framer Motion
import { Trash2, RefreshCw, Edit3, Lock, Unlock, Download, FileText, Plus } from 'lucide-react';
import { generateVisionImage, regenerateCardContent } from '../geminiService';
import html2canvas from 'html2canvas';

interface PinBoardProps {
  blueprint: BoardBlueprint;
  onUpdate: (blueprint: BoardBlueprint) => void;
}

const PIN_COLORS: PinColor[] = ['red', 'blue', 'yellow', 'green'];
const CARD_COLORS: CardColor[] = ['cream', 'white', 'pastel-blue', 'pastel-green', 'pastel-pink', 'pastel-yellow'];

export const PinBoard: React.FC<PinBoardProps> = ({ blueprint, onUpdate }) => {
  const [items, setItems] = useState<PinItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Initial Layout Generation
  useEffect(() => {
    const newItems: PinItem[] = [];
    const layoutStyle = 'messy'; // Can be derived from answers
    
    // Add Identity Statements
    blueprint.identity_statements.forEach((stmt, i) => {
      newItems.push({
        id: `identity-${i}`,
        type: 'identity',
        content: stmt,
        x: layoutStyle === 'messy' ? 50 + i * 20 : 100,
        y: layoutStyle === 'messy' ? 50 + i * 10 : 100,
        rotation: Math.random() * 6 - 3,
        pinColor: 'blue',
        cardColor: 'cream',
        width: 250,
        height: 100
      });
    });

    // Add Category Cards
    blueprint.categories.forEach((cat, idx) => {
      const startX = 100 + (idx % 3) * 350;
      const startY = 300 + Math.floor(idx / 3) * 450;

      // Vision Card
      newItems.push({
        id: `vision-${cat.id || idx}`,
        type: 'vision',
        category: cat.name,
        content: cat.vision_line,
        title: cat.name,
        x: startX,
        y: startY,
        rotation: Math.random() * 4 - 2,
        pinColor: 'red',
        cardColor: 'white',
        width: 200,
        height: 120
      });

      // Plan/Habit Card
      newItems.push({
        id: `habit-${cat.id || idx}`,
        type: 'habit',
        category: cat.name,
        content: cat.habit_card,
        x: startX + 180,
        y: startY + 50,
        rotation: Math.random() * 8 - 4,
        pinColor: 'yellow',
        cardColor: 'pastel-green',
        width: 160,
        height: 160
      });

      // Image Placeholder (Will be filled by generation)
      newItems.push({
        id: `image-${cat.id || idx}`,
        type: 'image',
        category: cat.name,
        content: cat.image_prompt,
        imageUrl: cat.image_url,
        x: startX + 20,
        y: startY + 140,
        rotation: Math.random() * 4 - 2,
        pinColor: 'blue',
        cardColor: 'white',
        width: 280,
        height: 280
      });
    });

    setItems(newItems);
    
    // Auto-generate images on mount if not present
    const generateAll = async () => {
      setIsGeneratingImages(true);
      const updatedItems = [...newItems];
      for (let i = 0; i < updatedItems.length; i++) {
        if (updatedItems[i].type === 'image' && !updatedItems[i].imageUrl) {
          const url = await generateVisionImage(updatedItems[i].content);
          updatedItems[i].imageUrl = url;
          setItems([...updatedItems]);
        }
      }
      setIsGeneratingImages(false);
    };
    
    generateAll();
  }, [blueprint]);

  const handleExport = async () => {
    if (!boardRef.current) return;
    const canvas = await html2canvas(boardRef.current, { scale: 2 });
    const link = document.createElement('a');
    link.download = `${blueprint.board_title.replace(/\s+/g, '_')}_2026.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const updateItem = (id: string, updates: Partial<PinItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRegenerate = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (item.type === 'image') {
      updateItem(id, { imageUrl: undefined });
      const url = await generateVisionImage(item.content);
      updateItem(id, { imageUrl: url });
    } else {
      const newText = await regenerateCardContent(item.content, "Make it more inspiring");
      updateItem(id, { content: newText });
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header / Toolbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-50">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{blueprint.board_title}</h1>
          <p className="text-sm text-gray-500 italic">Vision for 2026</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Download size={18} /> Export PNG
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus size={18} /> Add Note
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Board Area */}
        <main 
          ref={boardRef}
          className="flex-1 pinboard-texture overflow-auto relative p-20 cursor-grab active:cursor-grabbing"
          onClick={() => setSelectedId(null)}
        >
          {items.map(item => (
            <BoardItem 
              key={item.id} 
              item={item} 
              isSelected={selectedId === item.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(item.id);
              }}
              onMove={(x, y) => updateItem(item.id, { x, y })}
            />
          ))}
          {isGeneratingImages && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-50 border border-indigo-100">
              <div className="animate-spin text-indigo-600"><RefreshCw size={24} /></div>
              <span className="font-semibold text-gray-700">Brewing your visual goals...</span>
            </div>
          )}
        </main>

        {/* Sidebar Editor */}
        {selectedId && (
          <aside className="w-80 bg-white border-l border-gray-200 p-6 z-50 shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Edit Item</h2>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            <div className="space-y-6">
              {items.find(i => i.id === selectedId)?.type !== 'image' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Text Content</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg h-32 text-sm"
                    value={items.find(i => i.id === selectedId)?.content || ''}
                    onChange={(e) => updateItem(selectedId, { content: e.target.value })}
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button onClick={() => handleRegenerate(selectedId)} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 flex items-center gap-1">
                      <RefreshCw size={10} /> AI Refine
                    </button>
                  </div>
                </div>
              )}

              {items.find(i => i.id === selectedId)?.type === 'image' && (
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Image Prompt</label>
                   <p className="text-xs text-gray-500 mb-2 italic">"{items.find(i => i.id === selectedId)?.content}"</p>
                   <button 
                    onClick={() => handleRegenerate(selectedId)}
                    className="w-full py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-100"
                   >
                     <RefreshCw size={14} /> Regenerate Image
                   </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Card Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {CARD_COLORS.map(color => (
                    <button 
                      key={color}
                      onClick={() => updateItem(selectedId, { cardColor: color })}
                      className={`h-8 rounded border ${items.find(i => i.id === selectedId)?.cardColor === color ? 'border-black ring-1 ring-black' : 'border-gray-200'}`}
                      style={{ backgroundColor: color.startsWith('pastel') ? `var(--${color})` : color === 'cream' ? '#FFFDD0' : 'white' }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Pin Color</label>
                <div className="flex gap-2">
                  {PIN_COLORS.map(color => (
                    <button 
                      key={color}
                      onClick={() => updateItem(selectedId, { pinColor: color })}
                      className={`w-6 h-6 rounded-full shadow-inner ${items.find(i => i.id === selectedId)?.pinColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <button 
                  onClick={() => {
                    setItems(prev => prev.filter(i => i.id !== selectedId));
                    setSelectedId(null);
                  }}
                  className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-100"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

// Simplified Draggable Component logic
const BoardItem: React.FC<{ 
  item: PinItem; 
  isSelected: boolean; 
  onClick: (e: React.MouseEvent) => void;
  onMove: (x: number, y: number) => void;
}> = ({ item, isSelected, onClick, onMove }) => {
  const [pos, setPos] = useState({ x: item.x, y: item.y });
  const isDragging = useRef(false);
  const startOffset = useRef({ x: 0, y: 0 });

  const getCardColorClass = (color: CardColor) => {
    switch(color) {
      case 'cream': return 'bg-[#fffde7]';
      case 'white': return 'bg-white';
      case 'pastel-blue': return 'bg-blue-50';
      case 'pastel-green': return 'bg-green-50';
      case 'pastel-pink': return 'bg-pink-50';
      case 'pastel-yellow': return 'bg-yellow-50';
      default: return 'bg-white';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    onClick(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = e.clientX - startOffset.current.x;
      const newY = e.clientY - startOffset.current.y;
      setPos({ x: newX, y: newY });
      onMove(newX, newY);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div 
      className={`absolute transition-transform duration-200 select-none group card-rough-edge ${isSelected ? 'ring-2 ring-indigo-500 z-40' : 'hover:z-30'}`}
      style={{ 
        left: pos.x, 
        top: pos.y, 
        width: item.width, 
        minHeight: item.height,
        transform: `rotate(${item.rotation}deg)`,
        boxShadow: isSelected ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' : '0 4px 6px -1px rgb(0 0 0 / 0.1)'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* The Pin */}
      <div 
        className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-md z-10"
        style={{ backgroundColor: item.pinColor }}
      />
      
      {/* Card Content */}
      <div className={`p-4 h-full flex flex-col ${getCardColorClass(item.cardColor)}`}>
        {item.type === 'image' ? (
          item.imageUrl ? (
            <img src={item.imageUrl} alt="Goal" className="w-full h-full object-cover rounded-sm shadow-inner" />
          ) : (
            <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
              <RefreshCw className="animate-spin text-gray-300" />
            </div>
          )
        ) : (
          <div className="flex flex-col h-full">
            {item.title && <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-1">{item.title}</h3>}
            <p className={`font-handwriting leading-tight ${item.type === 'identity' ? 'text-lg font-bold' : 'text-sm'}`}>
              {item.content}
            </p>
            {item.type === 'habit' && (
              <div className="mt-auto pt-2 border-t border-black/5 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase">Weekly Habit</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
