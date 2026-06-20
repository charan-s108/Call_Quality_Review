import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCall, fetchMoments, deleteCall } from '@/api.js';
import CallHeader from './CallHeader.jsx';
import MomentTimeline from './MomentTimeline.jsx';
import TranscriptView from './TranscriptView.jsx';
import SummaryPanel from './SummaryPanel.jsx';
import MomentsSidebar from './MomentsSidebar.jsx';
import { Headphones, Play, Pause, FastForward, RotateCcw, Volume2, Sparkles, Activity } from 'lucide-react';
import { cn } from '@/lib/utils.js';

function scrollToTurn(turnIndex) {
  const el = document.getElementById(`turn-${turnIndex}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  // Highlight animation glow
  el.classList.add('shadow-[0_0_15px_rgba(244,247,61,0.25)]', 'border-w-yellow/50');
  setTimeout(() => { 
    el.classList.remove('shadow-[0_0_15px_rgba(244,247,61,0.25)]', 'border-w-yellow/50');
  }, 1800);
}

// Visual mock waveform representation based on conversational turns.
// Renders agent turns as positive peaks, customer turns as negative peaks, and dead air as silence blocks.
function ConversationWaveform({ 
  turns, 
  duration, 
  isPlaying, 
  currentPlayingTurnIndex, 
  playbackRate, 
  onPlayPause, 
  onRewind, 
  onFastForward, 
  onSpeedCycle, 
  onWaveformBarClick 
}) {
  try {
    if (!turns || !Array.isArray(turns) || turns.length === 0) return null;

    const peaks = [];
    const totalSlots = 80; // Render 80 vertical bars
    const safeDuration = duration && duration > 0 ? duration : 60;
    const step = safeDuration / totalSlots;

    for (let i = 0; i < totalSlots; i++) {
      const time = i * step;
      
      // Robust turn selection
      let currentTurn = turns[0];
      for (const turn of turns) {
        if (turn && typeof turn.t === 'number' && turn.t <= time) {
          currentTurn = turn;
        }
      }

      const turnIndex = turns.indexOf(currentTurn);
      let isDeadAir = false;
      
      if (turnIndex > 0 && turns[turnIndex - 1]) {
        const gap = currentTurn.t - turns[turnIndex - 1].t;
        if (gap > 15 && time > turns[turnIndex - 1].t && time < currentTurn.t) {
          isDeadAir = true;
        }
      }

      let height = 15; // default base height
      let speaker = 'silence';

      if (!isDeadAir && currentTurn) {
        speaker = currentTurn.speaker || 'silence';
        // Generate pseudo-random height but consistent for the turn text length
        const textLen = currentTurn.text ? currentTurn.text.length : 10;
        const seed = textLen * (turnIndex + 1) * (i + 1);
        height = 10 + (seed % 26); // height between 10px and 36px
      } else {
        height = 4; // Silence is flat
      }

      peaks.push({
        speaker,
        height,
        t: time,
        turnIndex: turnIndex >= 0 ? turnIndex : 0
      });
    }

    return (
      <div className="bg-[#0f1018] border-b border-w-border/80 px-6 py-3 flex items-center justify-between gap-6 flex-shrink-0">
        {/* Player controllers */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={onRewind}
            type="button" 
            title="Previous turn"
            className="p-1.5 rounded-lg bg-w-card hover:bg-white/5 border border-w-border/60 text-w-hint hover:text-w-text transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onPlayPause}
            type="button" 
            title={isPlaying ? "Pause" : "Listen (TTS)"}
            className="p-2.5 rounded-full bg-w-yellow text-w-bg hover:bg-w-yellow/90 hover:scale-105 transition-all shadow-md shadow-w-yellow/10"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>
          <button 
            onClick={onFastForward}
            type="button" 
            title="Next turn"
            className="p-1.5 rounded-lg bg-w-card hover:bg-white/5 border border-w-border/60 text-w-hint hover:text-w-text transition-all"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
          
          <div className="w-px h-5 bg-w-border mx-1" />
          
          <Volume2 className="w-3.5 h-3.5 text-w-hint" />
          <button
            onClick={onSpeedCycle}
            type="button"
            title="Cycle speed rate"
            className="text-[10px] text-w-hint hover:text-w-text font-mono font-bold bg-w-card/85 px-2 py-0.5 rounded border border-w-border/40 select-none hover:border-w-yellow/30 transition-all"
          >
            {playbackRate.toFixed(1)}x
          </button>
        </div>

        {/* Waveform track */}
        <div className="flex-1 flex items-center justify-center gap-[2px] h-12 select-none relative group">
          {peaks.map((p, idx) => {
            const isActive = currentPlayingTurnIndex === p.turnIndex;
            let barBg = 'bg-w-hint/25';
            if (p.speaker === 'agent') {
              barBg = isPlaying && isActive ? 'bg-w-yellow animate-pulse' : 'bg-w-yellow/65 group-hover:bg-w-yellow/85';
            } else if (p.speaker === 'customer') {
              barBg = isPlaying && isActive ? 'bg-w-blue animate-pulse' : 'bg-w-blue/50 group-hover:bg-w-blue/70';
            }
            
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onWaveformBarClick(p.turnIndex)}
                style={{ height: `${p.height}px` }}
                title={`Jump to ${formatTime(Math.round(p.t))}`}
                className={cn(
                  'w-[4px] rounded-full transition-all duration-150 cursor-pointer focus:outline-none hover:scale-y-125',
                  isActive && 'scale-y-110 shadow-[0_0_8px_rgba(255,255,255,0.5)] border-t border-b border-w-text',
                  barBg
                )}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center gap-4 text-[9px] uppercase tracking-wider font-bold text-w-hint flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-w-yellow" />
            Agent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-w-blue" />
            Customer
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-w-hint/25" />
            Silence
          </span>
        </div>
      </div>
    );
  } catch (err) {
    console.error("ConversationWaveform rendering error: ", err);
    return null;
  }
}

function formatTime(s) {
  if (s == null || typeof s !== 'number' || isNaN(s) || !isFinite(s)) return '0:00';
  const cleanS = Math.max(0, Math.floor(s));
  const m = Math.floor(cleanS / 60);
  const sec = cleanS % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function CallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [call, setCall] = useState(null);
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMomentFilter, setActiveMomentFilter] = useState('ALL');
  
  // TTS State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingTurnIndex, setCurrentPlayingTurnIndex] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Clean up TTS when unmounting or loading another call
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [id]);

  // Restart active speaking queue if rate shifts mid-play
  useEffect(() => {
    if (isPlaying && currentPlayingTurnIndex !== null) {
      window.speechSynthesis.cancel();
      speakTurn(currentPlayingTurnIndex);
    }
  }, [playbackRate]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [callData, momentsData] = await Promise.all([fetchCall(id), fetchMoments(id)]);
        setCall(callData);
        setMoments(momentsData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // TTS Speach Synthesis recursive runner
  const speakTurn = (index) => {
    if (!call || !Array.isArray(call.annotatedTurns) || call.annotatedTurns.length === 0) {
      setIsPlaying(false);
      setCurrentPlayingTurnIndex(null);
      return;
    }

    // Boundary reached
    if (index >= call.annotatedTurns.length) {
      setIsPlaying(false);
      setCurrentPlayingTurnIndex(null);
      return;
    }

    const turn = call.annotatedTurns[index];
    const utterance = new SpeechSynthesisUtterance(turn.text);
    utterance.rate = playbackRate;

    // Fetch voices and assign voice splits
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang.startsWith('en'));

    if (enVoices.length > 0) {
      // Allocate separate voices for Agent and Customer for channel split feel
      const agentVoice = enVoices[0];
      const customerVoice = enVoices[1] || enVoices[0];
      utterance.voice = turn.speaker === 'agent' ? agentVoice : customerVoice;
    }

    // Pitch adjust for further clarity
    utterance.pitch = turn.speaker === 'agent' ? 1.15 : 0.85;

    utterance.onstart = () => {
      setCurrentPlayingTurnIndex(index);
      scrollToTurn(index);
    };

    utterance.onend = () => {
      speakTurn(index + 1);
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        setIsPlaying(false);
        setCurrentPlayingTurnIndex(null);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const startIdx = currentPlayingTurnIndex !== null ? currentPlayingTurnIndex : 0;
      speakTurn(startIdx);
    }
  };

  const handleRewind = () => {
    window.speechSynthesis.cancel();
    const prevIdx = currentPlayingTurnIndex > 0 ? currentPlayingTurnIndex - 1 : 0;
    setCurrentPlayingTurnIndex(prevIdx);
    if (isPlaying) {
      speakTurn(prevIdx);
    } else {
      scrollToTurn(prevIdx);
    }
  };

  const handleFastForward = () => {
    window.speechSynthesis.cancel();
    if (!call || !call.annotatedTurns) return;
    
    const nextIdx = currentPlayingTurnIndex !== null && currentPlayingTurnIndex < call.annotatedTurns.length - 1
      ? currentPlayingTurnIndex + 1
      : 0;
      
    setCurrentPlayingTurnIndex(nextIdx);
    if (isPlaying) {
      speakTurn(nextIdx);
    } else {
      scrollToTurn(nextIdx);
    }
  };

  const handleSpeedCycle = () => {
    setPlaybackRate(prev => {
      if (prev === 1.0) return 1.5;
      if (prev === 1.5) return 2.0;
      return 1.0;
    });
  };

  const handleWaveformBarClick = (turnIndex) => {
    window.speechSynthesis.cancel();
    setCurrentPlayingTurnIndex(turnIndex);
    if (isPlaying) {
      speakTurn(turnIndex);
    } else {
      scrollToTurn(turnIndex);
    }
  };

  const handleMomentClick = (turnIndex) => {
    handleWaveformBarClick(turnIndex);
  };

  const handleDelete = async () => {
    try {
      await deleteCall(id);
      navigate('/');
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 border-2 border-w-yellow/25 border-t-w-yellow rounded-full animate-spin" />
        <p className="text-w-hint text-xs font-medium">Extracting conversational intelligence...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="m-6 rounded-xl border border-w-red/20 bg-w-red/5 text-w-red p-4 text-sm flex items-center gap-2">
        <span>✕</span>
        <span>{error}</span>
      </div>
    );
  }
  
  if (!call) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] overflow-hidden bg-[#0a0a0f]">
      {/* Dynamic Call Details Header */}
      <CallHeader call={call} onDelete={handleDelete} />
      
      {/* Audio Waveform visualization */}
      <ConversationWaveform 
        turns={call.annotatedTurns} 
        duration={call.duration} 
        isPlaying={isPlaying}
        currentPlayingTurnIndex={currentPlayingTurnIndex}
        playbackRate={playbackRate}
        onPlayPause={handlePlayPause}
        onRewind={handleRewind}
        onFastForward={handleFastForward}
        onSpeedCycle={handleSpeedCycle}
        onWaveformBarClick={handleWaveformBarClick}
      />
      
      {/* Signal Timeline strip */}
      <MomentTimeline moments={moments} duration={call.duration} onMomentClick={handleMomentClick} />

      <div className="flex flex-1 overflow-hidden">
        {/* Transcript Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin min-w-0 bg-[#0d0d14]/40">
          <TranscriptView 
            annotatedTurns={call.annotatedTurns} 
            activeMomentFilter={activeMomentFilter} 
            currentPlayingTurnIndex={currentPlayingTurnIndex}
            isPlaying={isPlaying}
          />
        </div>

        {/* Diagnostic Right panel */}
        <div className="w-[320px] flex-shrink-0 overflow-y-auto scrollbar-thin border-l border-w-border/80 bg-[#0e1017] p-4 space-y-4">
          <SummaryPanel summary={call.summary} />
          
          <MomentsSidebar 
            moments={moments} 
            onMomentClick={handleMomentClick} 
            activeMomentFilter={activeMomentFilter}
            setActiveMomentFilter={setActiveMomentFilter}
          />
        </div>
      </div>
    </div>
  );
}
