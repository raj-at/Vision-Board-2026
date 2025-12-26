
import React, { useState, useRef, useEffect } from 'react';
import { BoardBlueprint, PinItem, PinColor, CardColor } from '../types';
import { Trash2, RefreshCw, Download, Plus, ChevronDown, FileText, Image as ImageIcon, File } from 'lucide-react';
import { generateVisionImage, regenerateCardContent } from '../geminiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Initial Layout Generation
  useEffect(() => {
    const newItems: PinItem[] = [];
    const layoutStyle = 'messy';
    
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

    blueprint.categories.forEach((cat, idx) => {
      const startX = 100 + (idx % 3) * 350;
      const startY = 300 + Math.floor(idx / 3) * 450;

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const captureCanvas = async () => {
    if (!boardRef.current) return null;
    setIsExporting(true);
    setSelectedId(null); // Deselect before capture
    
    // Give a small delay for re-rendering without the selection ring
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(boardRef.current, { 
      scale: 2,
      useCORS: true,
      backgroundColor: '#2d5a27', // Matching pinboard-texture
      scrollX: 0,
      scrollY: 0,
      width: boardRef.current.scrollWidth,
      height: boardRef.current.scrollHeight,
    });
    
    setIsExporting(false);
    return canvas;
  };

  const handleExportImage = async (format: 'png' | 'jpeg') => {
    const canvas = await captureCanvas();
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `${blueprint.board_title.replace(/\s+/g, '_')}_2026.${format}`;
    link.href = canvas.toDataURL(`image/${format}`, 1.0);
    link.click();
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    const canvas = await captureCanvas();
    if (!canvas) return;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${blueprint.board_title.replace(/\s+/g, '_')}_2026.pdf`);
    setShowExportMenu(false);
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
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-50 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{blueprint.board_title}</h1>
          <p className="text-sm text-gray-500 italic">Vision for 2026</p>
        </div>
        <div className="flex gap-2">
          <div className="relative" ref={exportMenuRef}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
              disabled={isExporting}
            >
              <Download size={18} /> {isExporting ? 'Preparing...' : 'Export'} <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-[60] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={() => handleExportImage('png')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 transition-colors text-left"
                >
                  <ImageIcon size={16} className="text-indigo-500" /> Save as PNG
                </button>
                <button 
                  onClick={() => handleExportImage('jpeg')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 transition-colors text-left"
                >
                  <ImageIcon size={16} className="text-emerald-500" /> Save as JPG
                </button>
                <div className="border-t border-gray-50 my-1"></div>
                <button 
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 transition-colors text-left"
                >
                  <FileText size={16} className="text-rose-500" /> Export to PDF
                </button>
              </div>
            )}
          </div>
          <button 
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors active:scale-95"
            onClick={() => {
              const newItem: PinItem = {
                id: `note-${Date.now()}`,
                type: 'quote',
                content: 'New Inspiration...',
                x: 150,
                y: 150,
                rotation: Math.random() * 10 - 5,
                pinColor: 'yellow',
                cardColor: 'pastel-yellow',
                width: 180,
                height: 120
              };
              setItems(prev => [...prev, newItem]);
            }}
          >
            <Plus size={18} /> Add Note
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
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

        {selectedId && (
          <aside className="w-80 bg-white border-l border-gray-200 p-6 z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Card Editor</h2>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">×</button>
            </div>

            <div className="space-y-6">
              {items.find(i => i.id === selectedId)?.type !== 'image' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Message</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg h-32 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={items.find(i => i.id === selectedId)?.content || ''}
                    onChange={(e) => updateItem(selectedId, { content: e.target.value })}
                  />
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button onClick={() => handleRegenerate(selectedId)} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1 font-bold">
                      <RefreshCw size={10} /> AI Polish
                    </button>
                  </div>
                </div>
              )}

              {items.find(i => i.id === selectedId)?.type === 'image' && (
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Image Concept</label>
                   <p className="text-xs text-gray-500 mb-3 italic">"{items.find(i => i.id === selectedId)?.content}"</p>
                   <button 
                    onClick={() => handleRegenerate(selectedId)}
                    className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                   >
                     <RefreshCw size={14} /> Redesign Visual
                   </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Card Paper</label>
                <div className="grid grid-cols-3 gap-2">
                  {CARD_COLORS.map(color => (
                    <button 
                      key={color}
                      onClick={() => updateItem(selectedId, { cardColor: color })}
                      className={`h-10 rounded-lg border transition-all ${items.find(i => i.id === selectedId)?.cardColor === color ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'}`}
                      style={{ backgroundColor: color === 'cream' ? '#fffde7' : color === 'white' ? 'white' : color === 'pastel-blue' ? '#eff6ff' : color === 'pastel-green' ? '#f0fdf4' : color === 'pastel-pink' ? '#fdf2f8' : '#fefce8' }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Pushpin Color</label>
                <div className="flex gap-2">
                  {PIN_COLORS.map(color => (
                    <button 
                      key={color}
                      onClick={() => updateItem(selectedId, { pinColor: color })}
                      className={`w-8 h-8 rounded-full shadow-inner transition-all active:scale-90 ${items.find(i => i.id === selectedId)?.pinColor === color ? 'ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <button 
                  onClick={() => {
                    setItems(prev => prev.filter(i => i.id !== selectedId));
                    setSelectedId(null);
                  }}
                  className="w-full py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} /> Discard Item
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

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
      className={`absolute select-none group card-rough-edge ${isSelected ? 'ring-2 ring-indigo-500 z-40' : 'hover:z-30'}`}
      style={{ 
        left: pos.x, 
        top: pos.y, 
        width: item.width, 
        minHeight: item.height,
        transform: `rotate(${item.rotation}deg)`,
        boxShadow: isSelected ? '0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.15)' : '0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-lg z-10 cursor-move border border-white/20"
        style={{ backgroundColor: item.pinColor }}
      >
         <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
      </div>
      
      <div className={`p-5 h-full flex flex-col ${getCardColorClass(item.cardColor)}`}>
        {item.type === 'image' ? (
          item.imageUrl ? (
            <img src={item.imageUrl} alt="Vision Goal" className="w-full h-full object-cover rounded shadow-inner" draggable={false} />
          ) : (
            <div className="w-full h-full bg-gray-50/50 min-h-[150px] flex items-center justify-center">
              <RefreshCw className="animate-spin text-gray-300" size={32} />
            </div>
          )
        ) : (
          <div className="flex flex-col h-full pointer-events-none">
            {item.title && <h3 className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider mb-2">{item.title}</h3>}
            <p className={`font-handwriting leading-tight text-gray-800 ${item.type === 'identity' ? 'text-xl font-bold' : 'text-base'}`}>
              {item.content}
            </p>
            {item.type === 'habit' && (
              <div className="mt-auto pt-3 border-t border-black/5 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">2026 Blueprint Habit</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
