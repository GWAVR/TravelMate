import { useState } from 'react';
import { APP_ASSETS, INITIAL_JOURNAL } from '../data/mockData';
import { JournalEntry } from '../types';

interface JournalScreenProps {
  onShowToast: (msg: string) => void;
  onOpenExpenseDetails?: () => void;
}

export function JournalScreen({ onShowToast, onOpenExpenseDetails }: JournalScreenProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>(3);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [likedEntries, setLikedEntries] = useState<{ [key: string]: boolean }>({});
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');

  const handleLike = (id: string) => {
    const isLiked = likedEntries[id];
    setLikedEntries({ ...likedEntries, [id]: !isLiked });
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, likes: e.likes + (isLiked ? -1 : 1) } : e))
    );
    onShowToast(isLiked ? 'Removed like' : 'Liked memory with your travel crew!');
  };

  const handleCreateNote = () => {
    if (!newNoteTitle.trim()) return;
    const newEntry: JournalEntry = {
      id: `j-${Date.now()}`,
      day: 3,
      time: 'Just now',
      title: newNoteTitle,
      location: 'Kyoto, Japan',
      rating: 5.0,
      tags: ['🍁 Autumn Notes', '✨ Memory'],
      notes: newNoteText || 'Recorded memory with travel companions.',
      companions: 'With Alex, Maya, Kenji & Sarah',
      heroImage: APP_ASSETS.snapTorii,
      likes: 1,
    };
    setEntries([newEntry, ...entries]);
    setShowAddNote(false);
    setNewNoteTitle('');
    setNewNoteText('');
    onShowToast('Journal memory saved to Day 3!');
  };

  return (
    <div className="flex flex-col w-full px-4 pb-12 space-y-4">
      {/* Header & New Note */}
      <section className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b]">
            Trip Memories
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#131b2e]">
            Maharashtra Travel Journal
          </h1>
        </div>
        <button
          onClick={() => setShowAddNote(true)}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#006194] text-white text-xs font-semibold shadow-sm active:scale-95 transition-transform"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Note</span>
        </button>
      </section>

      {/* New Note Inline Card Modal */}
      {showAddNote && (
        <div className="p-4 rounded-2xl bg-white shadow-md border border-[#006194]/30 flex flex-col gap-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#006194]">Quick Memory Entry</span>
            <button
              onClick={() => setShowAddNote(false)}
              className="text-[#64748b] hover:text-[#131b2e]"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <input
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Title (e.g. Afternoon Tea in Gion...)"
            className="w-full text-xs font-bold p-2.5 rounded-xl bg-[#f2f3ff] outline-none border border-transparent focus:border-[#006194]/30"
          />
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            rows={2}
            placeholder="Write your reflection, quotes from friends, or sounds..."
            className="w-full text-xs p-2.5 rounded-xl bg-[#f2f3ff] outline-none resize-none border border-transparent focus:border-[#006194]/30"
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setShowAddNote(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-[#64748b]"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateNote}
              className="px-4 py-1.5 rounded-lg bg-[#006194] text-white text-xs font-bold shadow-xs active:scale-95"
              type="button"
            >
              Save Memory
            </button>
          </div>
        </div>
      )}

      {/* Day Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        <button
          onClick={() => setSelectedDay('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 shadow-xs transition-colors ${
            selectedDay === 'all'
              ? 'bg-[#006194] text-white'
              : 'bg-white text-[#475569] hover:text-[#131b2e]'
          }`}
          type="button"
        >
          All Days
        </button>
        <button
          onClick={() => setSelectedDay(1)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 shadow-xs transition-colors ${
            selectedDay === 1
              ? 'bg-[#006194] text-white'
              : 'bg-white text-[#475569] hover:text-[#131b2e]'
          }`}
          type="button"
        >
          Day 1 (Tokyo)
        </button>
        <button
          onClick={() => setSelectedDay(2)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 shadow-xs transition-colors ${
            selectedDay === 2
              ? 'bg-[#006194] text-white'
              : 'bg-white text-[#475569] hover:text-[#131b2e]'
          }`}
          type="button"
        >
          Day 2 (Shinkansen)
        </button>
        <button
          onClick={() => setSelectedDay(3)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 shadow-xs transition-colors ${
            selectedDay === 3
              ? 'bg-[#006194] text-white'
              : 'bg-white text-[#475569] hover:text-[#131b2e]'
          }`}
          type="button"
        >
          Day 3 (Kyoto Today)
        </button>
      </div>

      {/* Live Journal Stats Bento Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-white shadow-xs border border-[#e2e8f0]/60 text-center">
          <span className="material-symbols-outlined text-[#006194] text-[18px]">photo_camera</span>
          <span className="text-sm font-bold text-[#131b2e] block leading-none mt-1">12</span>
          <span className="text-[9px] text-[#64748b]">Photos</span>
        </div>
        <div className="p-2.5 rounded-xl bg-white shadow-xs border border-[#e2e8f0]/60 text-center">
          <span className="material-symbols-outlined text-[#006c49] text-[18px]">notes</span>
          <span className="text-sm font-bold text-[#131b2e] block leading-none mt-1">4</span>
          <span className="text-[9px] text-[#64748b]">Notes</span>
        </div>
        <div className="p-2.5 rounded-xl bg-white shadow-xs border border-[#e2e8f0]/60 text-center">
          <span className="material-symbols-outlined text-[#a36700] text-[18px]">place</span>
          <span className="text-sm font-bold text-[#131b2e] block leading-none mt-1">3</span>
          <span className="text-[9px] text-[#64748b]">Spots</span>
        </div>
        <div className="p-2.5 rounded-xl bg-white shadow-xs border border-[#e2e8f0]/60 text-center">
          <span className="material-symbols-outlined text-[#f43f5e] text-[18px]">favorite</span>
          <span className="text-sm font-bold text-[#131b2e] block leading-none mt-1">4.9</span>
          <span className="text-[9px] text-[#64748b]">Avg Vibe</span>
        </div>
      </div>

      {/* Memory Card 1: Kiyomizu-dera Hero */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col border border-[#e2e8f0]/60">
        <div className="relative h-56 w-full">
          <img
            className="w-full h-full object-cover"
            alt="Twilight Illumination at Kiyomizu-dera"
            src={APP_ASSETS.journalKiyomizudera}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold">
              Day 3 • 17:45 JST
            </span>
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[10px]">
              <span className="material-symbols-outlined text-[14px] text-amber-300" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span className="font-bold">5.0</span>
            </div>
          </div>

          {/* Bottom Title on Image */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-col text-white">
            <h3 className="text-base font-bold leading-tight drop-shadow-sm">
              Twilight Illumination at Kiyomizu-dera
            </h3>
            <span className="text-[11px] text-[#e0f2fe] flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              Higashiyama District, Kyoto
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col gap-3">
          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#f2f3ff] text-[#006194] text-[10px] font-semibold">
              ✨ Magical
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#ffe4e6] text-[#f43f5e] text-[10px] font-semibold">
              🍁 Peak Foliage
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#d1fae5] text-[#006c49] text-[10px] font-semibold">
              👟 14,200 steps
            </span>
          </div>

          <p className="text-xs text-[#131b2e] leading-relaxed italic">
            “The autumn maple canopy glowing vibrant amber-red under the evening lights took our breath away. Standing on the wooden stage looking over Kyoto was worth every single stair climb.”
          </p>

          {/* Interactive Voice Memo Player Bar */}
          <div className="p-3 rounded-xl bg-[#f2f3ff] flex items-center justify-between gap-3 border border-[#e2e8f0]/60">
            <button
              onClick={() => {
                setIsPlayingAudio(!isPlayingAudio);
                onShowToast(isPlayingAudio ? 'Audio memo paused' : 'Playing ambient recording: Evening Chimes & Crowd');
              }}
              className="w-9 h-9 rounded-full bg-[#006194] text-white flex items-center justify-center shrink-0 active:scale-95 shadow-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isPlayingAudio ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#131b2e] truncate">
                  Evening Chimes &amp; Crowd Sounds
                </span>
                <span className="text-[#64748b] text-[10px]">0:48</span>
              </div>
              {/* Simulated Audio Waveform Bar */}
              <div className="flex items-center gap-0.5 h-3 mt-1.5">
                {[40, 70, 20, 90, 60, 85, 30, 95, 50, 80, 45, 100, 65, 35, 75, 45, 80, 25, 60, 40].map(
                  (h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-200 ${
                        isPlayingAudio && i % 2 === 0
                          ? 'bg-[#006194] animate-pulse'
                          : 'bg-[#dae2fd]'
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Footer with Companions and Likes */}
          <div className="flex items-center justify-between pt-1 border-t border-[#e2e8f0]/60">
            <span className="text-[11px] text-[#64748b]">With Maya, Kenji &amp; Sarah</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleLike('j-1')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  likedEntries['j-1']
                    ? 'bg-[#ffe4e6] text-[#f43f5e]'
                    : 'bg-[#f2f3ff] text-[#475569] hover:text-[#f43f5e]'
                }`}
                type="button"
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={likedEntries['j-1'] ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  favorite
                </span>
                <span>{entries.find((e) => e.id === 'j-1')?.likes || 4}</span>
              </button>
              <button
                onClick={() => onShowToast('Memory link copied to clipboard')}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f2f3ff]"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Card 2: Kaiseki Dining with Sub-Photos */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col border border-[#e2e8f0]/60">
        <div className="relative h-48 w-full">
          <img
            className="w-full h-full object-cover"
            alt="Multi-Course Kaiseki Dining in Gion"
            src={APP_ASSETS.kaisekiDinner}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold">
              Day 3 • 19:30 JST
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex flex-col text-white">
            <h3 className="text-base font-bold leading-tight drop-shadow-sm">
              Multi-Course Kaiseki Dining in Gion
            </h3>
            <span className="text-[11px] text-[#e0f2fe] flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              Gion Historic Alley, Kyoto
            </span>
          </div>
        </div>

        {/* 2 Sub-Dishes Grid */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#eaedff]">
          <div className="h-24 rounded-lg overflow-hidden relative">
            <img
              src={APP_ASSETS.dishSashimi}
              alt="Sea Bream Sashimi"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-white text-[9px]">
              Sea Bream Sashimi
            </span>
          </div>
          <div className="h-24 rounded-lg overflow-hidden relative">
            <img
              src={APP_ASSETS.dishSoup}
              alt="Yuzu Dashi Broth"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-white text-[9px]">
              Yuzu Dashi Broth
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-[#131b2e] leading-relaxed italic">
            “Chef Suzuki presented 8 seasonal courses celebrating Kyoto autumn. The yuzu broth and sea bream sashimi were unforgettable.”
          </p>

          {/* Linked Itinerary & Expense Banner */}
          <div
            onClick={onOpenExpenseDetails}
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#e0f2fe] text-[#006194] cursor-pointer hover:bg-[#bae6fd] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span className="text-xs font-bold">Linked to Stop #4 • ₹800/person</span>
            </div>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#e2e8f0]/60">
            <span className="text-[11px] text-[#64748b]">24°C • Pleasant Evening</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleLike('j-2')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  likedEntries['j-2']
                    ? 'bg-[#ffe4e6] text-[#f43f5e]'
                    : 'bg-[#f2f3ff] text-[#475569] hover:text-[#f43f5e]'
                }`}
                type="button"
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={likedEntries['j-2'] ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  favorite
                </span>
                <span>{entries.find((e) => e.id === 'j-2')?.likes || 4}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Earlier Snapshots Carousel */}
      <section className="flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
            Earlier Snapshots
          </h3>
          <span className="text-[10px] text-[#006194] font-semibold">12 Photos</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0 relative group">
            <img src={APP_ASSETS.snapTorii} alt="Torii Path" className="w-full h-full object-cover" />
            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px]">
              Raigad Steps
            </span>
          </div>
          <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0 relative group">
            <img src={APP_ASSETS.snapMatcha} alt="Matcha Latte" className="w-full h-full object-cover" />
            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px]">
              Solkadhi &amp; Poha
            </span>
          </div>
          <div className="w-28 h-28 rounded-xl overflow-hidden shrink-0 relative group">
            <img src={APP_ASSETS.snapShinkansen} alt="Shinkansen" className="w-full h-full object-cover" />
            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px]">
              Deccan Express
            </span>
          </div>
          <div className="w-28 h-28 rounded-xl bg-[#e2e7ff] text-[#006194] flex flex-col items-center justify-center shrink-0 cursor-pointer hover:bg-[#dae2fd]">
            <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
            <span className="text-[10px] font-bold mt-1">Upload Photo</span>
          </div>
        </div>
      </section>

      {/* Scrapbook Export Action */}
      <button
        onClick={() => onShowToast('Compiling Maharashtra Trip Scrapbook into PDF...')}
        className="w-full py-3 rounded-2xl bg-[#006194] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-transform"
        type="button"
      >
        <span className="material-symbols-outlined text-[20px]">menu_book</span>
        <span>Export Trip Scrapbook (PDF &amp; Web)</span>
      </button>
    </div>
  );
}
