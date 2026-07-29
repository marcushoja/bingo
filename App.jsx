import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, Check, XCircle, Trash2, Plus } from 'lucide-react';

// Start-Set, falls der LocalStorage noch leer ist
const defaultCards = [
  {
    id: "199",
    grid: [
      [null, 10, 21, null, 49, 51, null, null, 84],
      [3, null, null, 38, null, 57, 62, 71, null],
      [7, 18, 26, null, null, null, null, 73, 88]
    ]
  },
  {
    id: "82",
    grid: [
      [6, null, 25, 31, 43, null, null, null, 83],
      [null, 17, 26, null, null, 51, 61, null, 84],
      [9, 19, null, null, null, 53, 68, 75, null]
    ]
  }
];

const emptyGrid = [
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null]
];

export default function App() {
  // Karten aus LocalStorage laden oder Default nehmen
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('bingo-cards');
    if (saved) return JSON.parse(saved);
    return defaultCards;
  });

  const [drawnNumbers, setDrawnNumbers] = useState(new Set());
  const [toast, setToast] = useState({ message: '', type: '', visible: false, id: 0 });
  
  // Modals
  const [showResetModal, setShowResetModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null); // Speichert die Karte, die gelöscht werden soll
  const [showAddModal, setShowAddModal] = useState(false);
  
  // State für die neue Karte, die gerade eingegeben wird
  const [newCard, setNewCard] = useState({ id: '', grid: emptyGrid });

  // Karten bei Änderung im LocalStorage speichern
  useEffect(() => {
    localStorage.setItem('bingo-cards', JSON.stringify(cards));
  }, [cards]);

  // Toast automatisch verstecken
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.visible]);

  const showToast = (message, type) => {
    setToast({ message, type, visible: true, id: Date.now() });
  };

  const toggleNumber = (num) => {
    if (num === null) return;
    const newDrawn = new Set(drawnNumbers);
    
    if (newDrawn.has(num)) {
      newDrawn.delete(num);
    } else {
      newDrawn.add(num);
      
      let count = 0;
      cards.forEach(card => {
        card.grid.forEach(row => {
          row.forEach(cell => {
            if (cell === num) count++;
          });
        });
      });

      if (count === 0) {
        showToast(`Die Zahl ${num} ist auf keiner Karte.`, 'error');
      } else if (count === 1) {
        showToast(`Treffer! Die ${num} ist auf 1 Karte.`, 'success');
      } else {
        showToast(`Super! Die ${num} ist auf ${count} Karten!`, 'success');
      }
    }
    
    setDrawnNumbers(newDrawn);
  };

  const confirmReset = () => {
    setDrawnNumbers(new Set());
    setShowResetModal(false);
  };

  // --- Neue Funktionen für Karten-Verwaltung ---

  const confirmDeleteCard = () => {
    if (cardToDelete) {
      setCards(cards.filter(c => c.id !== cardToDelete.id));
      showToast(`Karte ${cardToDelete.id} gelöscht.`, 'success');
      setCardToDelete(null);
    }
  };

  const handleNewCardGridChange = (rIdx, cIdx, value) => {
    // Völlige Freiheit: Wir konvertieren den String zu einer Zahl, wenn er nicht leer ist
    const numValue = value === "" ? null : parseInt(value, 10);
    
    const updatedGrid = [...newCard.grid];
    updatedGrid[rIdx] = [...updatedGrid[rIdx]];
    updatedGrid[rIdx][cIdx] = numValue;
    
    setNewCard({ ...newCard, grid: updatedGrid });
  };

  const saveNewCard = () => {
    if (!newCard.id.trim()) {
      showToast('Bitte eine Karten-ID eingeben.', 'error');
      return;
    }
    
    // Prüfen ob ID schon existiert
    if (cards.some(c => c.id === newCard.id)) {
      showToast('Diese Karten-ID existiert bereits.', 'error');
      return;
    }

    setCards([...cards, newCard]);
    showToast(`Karte ${newCard.id} hinzugefügt!`, 'success');
    setShowAddModal(false);
    setNewCard({ id: '', grid: JSON.parse(JSON.stringify(emptyGrid)) }); // Deep Copy für leeres Grid
  };

  const cancelAddCard = () => {
    setShowAddModal(false);
    setNewCard({ id: '', grid: JSON.parse(JSON.stringify(emptyGrid)) });
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20 relative overflow-hidden flex flex-col">
      
      {/* Toast Notification */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white font-bold text-sm sm:text-base ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        } ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}
      >
        {toast.type === 'error' ? <XCircle size={20} /> : <Check size={20} />}
        {toast.message}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm p-3 flex justify-between items-center">
        <div className="font-bold text-slate-800 text-lg">Bingo Tracker</div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-slate-600 font-bold bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
            <CheckCircle size={18} className="text-green-600" />
            <span>{drawnNumbers.size}</span>
          </div>
          <button 
            onClick={() => setShowResetModal(true)} 
            className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-2 rounded-lg font-bold hover:bg-red-100 border border-red-200 active:scale-95 transition-all shadow-sm"
          >
            <RotateCcw size={18} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4 w-full flex-1 overflow-y-auto">
        
        {/* Master-Board (1-90) */}
        <div className="bg-white p-3 sm:p-4 border border-slate-200 rounded-xl shadow-sm mb-6">
          <h2 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Zahlenübersicht (1-90)</h2>
          <div className="grid grid-cols-10 gap-1 sm:gap-2">
            {Array.from({ length: 90 }, (_, i) => i + 1).map(num => {
              const isDrawn = drawnNumbers.has(num);
              return (
                <button
                  key={num}
                  onClick={() => toggleNumber(num)}
                  className={`
                    aspect-square flex items-center justify-center rounded font-bold text-xs sm:text-base transition-all
                    ${isDrawn 
                      ? 'bg-green-500 text-white shadow-inner scale-95' 
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-200 shadow-sm'
                    }
                  `}
                >
                  {num}
                </button>
              )
            })}
          </div>
        </div>

        {/* Karten Header mit Add Button */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deine Karten ({cards.length})</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Karte hinzufügen</span>
            <span className="sm:hidden">Neu</span>
          </button>
        </div>

        {/* Karten Raster */}
        {cards.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
            Keine Karten vorhanden. Füge eine neue hinzu!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {cards.map((card, index) => (
              <div key={`${card.id}-${index}`} className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-slate-300 flex flex-col">
                
                {/* Karten Info & Löschen Button */}
                <div className="flex justify-between items-center mb-3 px-1">
                  <div className="font-bold text-slate-700">Karte <span className="text-indigo-600">#{card.id}</span></div>
                  <button 
                    onClick={() => setCardToDelete(card)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                    title="Karte löschen"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Karten-Gitter */}
                <div className="bg-slate-900 p-2 sm:p-3 rounded-lg flex flex-col gap-2 shadow-inner">
                  {card.grid.map((row, rIdx) => {
                    const markedInRow = row.filter(num => num !== null && drawnNumbers.has(num)).length;
                    
                    let counterClass = 'bg-slate-800 text-slate-500';
                    if (markedInRow === 3) counterClass = 'bg-yellow-400 text-yellow-900 shadow-[0_0_8px_rgba(250,204,21,0.5)]';
                    if (markedInRow === 4) counterClass = 'bg-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.6)]';
                    if (markedInRow === 5) counterClass = 'bg-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.8)] scale-105';

                    return (
                      <div key={rIdx} className="flex gap-1.5 sm:gap-2 w-full items-stretch">
                        <div className={`
                          w-5 sm:w-8 flex-shrink-0 flex items-center justify-center rounded font-black text-xs sm:text-sm transition-all duration-300
                          ${counterClass}
                        `}>
                          {markedInRow}
                        </div>

                        <div className="grid grid-cols-9 gap-[3px] sm:gap-1.5 flex-1">
                          {row.map((num, cIdx) => {
                            const isDrawn = num !== null && drawnNumbers.has(num);
                            return (
                              <div
                                key={cIdx}
                                onClick={() => toggleNumber(num)}
                                className={`
                                  aspect-square flex items-center justify-center rounded-[3px] sm:rounded cursor-pointer 
                                  text-xs sm:text-lg font-bold transition-all select-none
                                  ${num === null 
                                    ? 'bg-slate-800' 
                                    : isDrawn
                                      ? 'bg-green-500 text-white shadow-inner scale-[0.92] translate-y-[1px]'
                                      : 'bg-white text-black hover:bg-slate-200 active:scale-95 shadow-[0_2px_0_0_rgba(0,0,0,0.15)]'
                                  }
                                `}
                              >
                                {num !== null && num}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Spiel zurücksetzen?</h3>
            <p className="text-slate-600 mb-6">Alle gezogenen Zahlen werden abgewählt. Die Karten bleiben erhalten.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowResetModal(false)} className="flex-1 bg-slate-200 text-slate-800 font-bold py-3 rounded-lg hover:bg-slate-300 transition-colors active:scale-95">
                Abbrechen
              </button>
              <button onClick={confirmReset} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors active:scale-95">
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Card Modal */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Karte löschen?</h3>
            <p className="text-slate-600 mb-6">Möchtest du die Karte <b>#{cardToDelete.id}</b> wirklich dauerhaft entfernen?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setCardToDelete(null)} className="flex-1 bg-slate-200 text-slate-800 font-bold py-3 rounded-lg hover:bg-slate-300 transition-colors active:scale-95">
                Abbrechen
              </button>
              <button onClick={confirmDeleteCard} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors active:scale-95">
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="text-indigo-600" />
              Neue Karte erstellen
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-1">Karten-ID / Name</label>
              <input 
                type="text" 
                value={newCard.id}
                onChange={(e) => setNewCard({...newCard, id: e.target.value})}
                placeholder="z.B. 123 oder Blau"
                className="w-full sm:w-1/2 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Zahlen eingeben (Leere Felder bleiben Lücken)
              </label>
              
              <div className="bg-slate-100 p-2 sm:p-4 rounded-xl border border-slate-200 flex flex-col gap-2 overflow-x-auto">
                {newCard.grid.map((row, rIdx) => (
                  <div key={`new-r-${rIdx}`} className="flex gap-1 sm:gap-2 min-w-max">
                    {row.map((val, cIdx) => (
                      <input
                        key={`new-c-${cIdx}`}
                        type="number" // Zeigt auf Mobile oft den Nummernblock
                        pattern="\d*" // Hilft auf iOS für das richtige Keyboard
                        min="1"
                        max="90"
                        value={val === null ? '' : val}
                        onChange={(e) => handleNewCardGridChange(rIdx, cIdx, e.target.value)}
                        className="w-10 h-10 sm:w-14 sm:h-14 text-center font-bold text-sm sm:text-lg border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none p-0 m-0 [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button 
                onClick={cancelAddCard} 
                className="px-5 py-3 bg-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-300 transition-colors active:scale-95"
              >
                Abbrechen
              </button>
              <button 
                onClick={saveNewCard} 
                className="px-5 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors active:scale-95"
              >
                Karte Speichern
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}