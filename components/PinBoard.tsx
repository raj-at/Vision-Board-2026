
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BoardBlueprint, PinItem, PinColor, CardColor } from '../types';
import { Trash2, RefreshCw, Plus, Lock, Unlock, Copy, Download, FileText, ImageIcon, ChevronDown, RotateCcw } from 'lucide-react';
import { generateVisionImage, regenerateCardContent } from '../geminiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PinBoardProps {
  blueprint: BoardBlueprint;
  onReset?: () => void;
}

const PIN_COLORS: PinColor[] = ['red', 'blue', 'yellow', 'green'];
const CARD_COLORS: CardColor[] = ['cream', 'white', 'pastel-blue', 'pastel-green', 'pastel-pink', 'pastel-yellow'];

export const PinBoard: React.FC<PinBoardProps> = ({ blueprint, onReset }) => {
  const [items, setItems] = useState<PinItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Initialize Board Items based on blueprint
  useEffect(() => {
    if (items.length > 0) return;

    const newItems: PinItem[] = [];
    
    // 1. Identity row at the top
    blueprint.identity_statements.forEach((stmt, i) => {
      newItems.push({
        id: `identity-${i}-${Date.now()}`,
        type: 'identity',
        content: stmt,
        x: 150 + i * 400,
        y: 100,
        rotation: 0,
        pinColor: 'blue',
        cardColor: 'cream',
        width: 350,
        height: 120
      });
    });

    // 2. Categories in a Clean Grid
    blueprint.categories.forEach((cat, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const startX = 150 + col * 450;
      const startY = 320 + row * 680;

      // Vision Card
      newItems.push({
        id: `vision-${idx}-${Date.now()}`,
        type: 'vision',
        category: cat.name,
        content: cat.vision_line,
        title: cat.name,
        x: startX,
        y: startY,
        rotation: 0,
        pinColor: 'red',
        cardColor: 'white',
        width: 380,
        height: 140
      });

      // AI Generated Visual
      newItems.push({
        id: `image-${idx}-${Date.now()}`,
        type: 'image',
        category: cat.name,
        content: cat.image_prompt,
        imageUrl: cat.image_url,
        x: startX,
        y: startY + 160,
        rotation: 0,
        pinColor: 'blue',
        cardColor: 'white',
        width: 380,
        height: 380
      });

      // Daily Habit Card
      newItems.push({
        id: `habit-${idx}-${Date.now()}`,
        type: 'habit',
        category: cat.name,
        content: cat.habit_card,
        x: startX,
        y: startY + 560,
        rotation: 0,
        pinColor: 'green',
        cardColor: 'pastel-green',
        width: 380,
        height: 80
      });
    });

    setItems(newItems);
    
    const runImageGeneration = async () => {
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
    
    runImageGeneration();
  }, [blueprint]);

  const updateItem = useCallback((id: string, updates: Partial<PinItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const duplicateItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newItem = { 
      ...item, 
      id: `${item.id}-dup-${Date.now()}`, 
      x: item.x + 30, 
      y: item.y + 30, 
      isLocked: false 
    };
    setItems(prev => [...prev, newItem]);
    setSelectedId(newItem.id);
  };

  const handleRegenerate = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (item.type === 'image') {
      updateItem(id, { imageUrl: undefined });
      const url = await generateVisionImage(item.content);
      updateItem(id, { imageUrl: url });
    } else {
      const newText = await regenerateCardContent(item.content, "Inject more motivation");
      updateItem(id, { content: newText });
    }
  };

  const exportAsImage = async () => {
    if (!boardRef.current) return;
    setShowExportMenu(false);
    const canvas = await html2canvas(boardRef.current, { scale: 2, useCORS: true, backgroundColor: '#2d5a27' });
    const link = document.createElement('a');
    link.download = `VisionBoard-2026.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportAsPDF = async () => {
    if (!boardRef.current) return;
    setShowExportMenu(false);

    const canvas = await html2canvas(boardRef.current, { scale: 1.5, useCORS: true, backgroundColor: '#2d5a27' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Overview Page
    const boardAspect = canvas.width / canvas.height;
    const pageAspect = pageWidth / pageHeight;
    let dW, dH;
    if (boardAspect > pageAspect) { dW = pageWidth; dH = pageWidth / boardAspect; }
    else { dH = pageHeight; dW = pageHeight * boardAspect; }
    
    pdf.setFontSize(14);
    pdf.text(`${blueprint.board_title}`, 10, 15);
    pdf.addImage(imgData, 'PNG', 0, 20, dW, dH - 20);

    // Detail Quad Pages
    const cols = 2, rows = 2;
    const sW = canvas.width / cols, sH = canvas.height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        pdf.addPage();
        const tCanvas = document.createElement('canvas');
        tCanvas.width = sW; tCanvas.height = sH;
        const ctx = tCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, c * sW, r * sH, sW, sH, 0, 0, sW, sH);
          pdf.addImage(tCanvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight);
        }
      }
    }
    pdf.save(`VisionBoard-2026-HQ.pdf`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-50 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{blueprint.board_title}</h1>
            <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Vision Workspace</p>
          </div>
          {onReset && (
            <button 
              onClick={onReset} 
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" 
              title="Reset Workspace"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
        
        <div className="flex gap-3">
          <button 
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold"
            onClick={() => {
              const newItem: PinItem = {
                id: `note-${Date.now()}`,
                type: 'quote',
                content: 'Double click to edit mantra...',
                x: 200, y: 200, rotation: 0, pinColor: 'yellow', cardColor: 'pastel-yellow', width: 220, height: 140
              };
              setItems(prev => [...prev, newItem]);
              setSelectedId(newItem.id);
            }}
          >
            <Plus size={18} /> Add Insight
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-md"
            >
              <Download size={18} /> Export <ChevronDown size={14} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                <button onClick={exportAsImage} className="w-full px-5 py-4 text-left text-sm hover:bg-gray-50 flex items-center gap-3 font-semibold">
                  <ImageIcon size={18} className="text-blue-500" /> Save as Image (PNG)
                </button>
                <button onClick={exportAsPDF} className="w-full px-5 py-4 text-left text-sm hover:bg-gray-50 flex items-center gap-3 font-semibold border-t border-gray-100">
                  <FileText size={18} className="text-rose-500" /> Save as Multi-page PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <main 
          ref={boardRef}
          className="flex-1 pinboard-texture overflow-auto relative p-20 cursor-grab active:cursor-grabbing"
          onClick={() => setSelectedId(null)}
        >
          <div className="min-w-[3000px] min-h-[3000px] relative">
            {items.map(item => (
              <BoardItem 
                key={item.id} 
                item={item} 
                isSelected={selectedId === item.id}
                onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
                onMove={(x, y) => !item.isLocked && updateItem(item.id, { x, y })}
              />
            ))}
          </div>
          {isGeneratingImages && (
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-5 z-50 border border-indigo-200">
              <div className="animate-spin text-indigo-600"><RefreshCw size={28} /></div>
              <span className="font-bold text-gray-900">Synthesizing 2026 Visuals...</span>
            </div>
          )}
        </main>

        {selectedId && (
          <aside className="w-80 bg-white border-l border-gray-200 p-7 z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-black text-gray-900">Edit Node</h2>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 p-2 rounded-xl hover:bg-gray-100">×</button>
            </div>

            <div className="space-y-8">
              <div className="flex gap-2">
                <button 
                  onClick={() => updateItem(selectedId, { isLocked: !items.find(i => i.id === selectedId)?.isLocked })}
                  className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${items.find(i => i.id === selectedId)?.isLocked ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                >
                  {items.find(i => i.id === selectedId)?.isLocked ? <><Lock size={16} /> Locked</> : <><Unlock size={16} /> Movable</>}
                </button>
                <button 
                  onClick={() => duplicateItem(selectedId)}
                  className="flex-1 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <Copy size={16} /> Duplicate
                </button>
              </div>

              {items.find(i => i.id === selectedId)?.type !== 'image' && (
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">Vision Text</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl h-36 text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                    value={items.find(i => i.id === selectedId)?.content || ''}
                    onChange={(e) => updateItem(selectedId, { content: e.target.value })}
                  />
                  <button onClick={() => handleRegenerate(selectedId)} className="mt-3 w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase">
                    <RefreshCw size={14} /> AI Optimization
                  </button>
                </div>
              )}

              {items.find(i => i.id === selectedId)?.type === 'image' && (
                <div>
                   <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">Image Logic</label>
                   <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded-xl italic leading-relaxed border border-gray-100">"{items.find(i => i.id === selectedId)?.content}"</p>
                   <button 
                    onClick={() => handleRegenerate(selectedId)}
                    className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
                   >
                     <RefreshCw size={16} /> Regenerate artwork
                   </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-3">Color Palette</label>
                <div className="grid grid-cols-3 gap-3">
                  {CARD_COLORS.map(color => (
                    <button 
                      key={color}
                      onClick={() => updateItem(selectedId, { cardColor: color })}
                      className={`h-11 rounded-xl border-2 transition-all ${items.find(i => i.id === selectedId)?.cardColor === color ? 'border-indigo-600' : 'border-gray-100'}`}
                      style={{ backgroundColor: color === 'cream' ? '#fffde7' : color === 'white' ? 'white' : color === 'pastel-blue' ? '#eff6ff' : color === 'pastel-green' ? '#f0fdf4' : color === 'pastel-pink' ? '#fdf2f8' : '#fefce8' }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-3">Marker Pin</label>
                <div className="flex gap-4">
                  {PIN_COLORS.map(color => (
                    <button 
                      key={color}
                      onClick={() => updateItem(selectedId, { pinColor: color })}
                      className={`w-10 h-10 rounded-full shadow-lg ${items.find(i => i.id === selectedId)?.pinColor === color ? 'ring-4 ring-indigo-200' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100">
                <button 
                  onClick={() => {
                    if (confirm("Remove this item from your vision?")) {
                      setItems(prev => prev.filter(i => i.id !== selectedId));
                      setSelectedId(null);
                    }
                  }}
                  className="w-full py-4 bg-red-50 text-red-600 rounded-2xl text-sm font-black flex items-center justify-center gap-3 hover:bg-red-100 transition-all"
                >
                  <Trash2 size={18} /> Delete Node
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
    if (item.isLocked) { onClick(e); return; }
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
    const handleMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onMove]);

  return (
    <div 
      className={`absolute select-none group card-rough-edge ${isSelected ? 'ring-4 ring-indigo-500 z-40' : 'hover:z-30'}`}
      style={{ 
        left: pos.x, 
        top: pos.y, 
        width: item.width, 
        minHeight: item.height,
        transform: `rotate(${item.rotation}deg)`,
        boxShadow: isSelected ? '0 30px 60px -12px rgba(50,50,93,0.35)' : '0 10px 20px -10px rgba(0,0,0,0.3)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        className={`absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full shadow-2xl z-10 ${item.isLocked ? '' : 'cursor-grab'} border border-white/30`}
        style={{ backgroundColor: item.pinColor }}
      >
         <div className="absolute top-1 left-1 w-2 h-2 bg-white/50 rounded-full"></div>
      </div>
      
      <div className={`p-6 h-full flex flex-col ${getCardColorClass(item.cardColor)}`}>
        {item.type === 'image' ? (
          item.imageUrl ? (
            <img src={item.imageUrl} alt="Vision" className="w-full h-full object-cover rounded-lg shadow-inner brightness-[0.98]" draggable={false} />
          ) : (
            <div className="w-full h-full bg-gray-50/80 min-h-[200px] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl">
              <RefreshCw className="animate-spin text-indigo-300" size={40} />
              <span className="text-[10px] font-black text-gray-400 uppercase">Imaging 2026...</span>
            </div>
          )
        ) : (
          <div className="flex flex-col h-full pointer-events-none">
            {item.title && <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-3">{item.title}</h3>}
            <p className={`font-handwriting leading-[1.3] text-gray-800 ${item.type === 'identity' ? 'text-2xl font-black' : 'text-lg font-bold'}`}>
              {item.content}
            </p>
            {item.type === 'habit' && (
              <div className="mt-auto pt-4 border-t border-black/5 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-200" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">2026 Core Habit</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
