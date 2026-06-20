import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileJson, Download, Sparkles, Play, AlertCircle } from 'lucide-react';
import { ingestCall } from '@/api.js';
import { cn } from '@/lib/utils.js';

const EXAMPLE_TRANSCRIPT = {
  callId: 'c001',
  agentName: 'Priya',
  duration: 240,
  turns: [
    { speaker: 'agent',    text: 'Thank you for calling support, how can I help you today?', t: 0 },
    { speaker: 'customer', text: "I've been waiting three weeks for my refund and I still haven't received anything. This is completely unacceptable.", t: 7 },
    { speaker: 'agent',    text: "I completely understand your frustration and I'm really sorry about the delay.", t: 18 },
    { speaker: 'customer', text: "I want to speak to a manager. I'm going to cancel my account if this isn't resolved today.", t: 25 },
    { speaker: 'agent',    text: 'Absolutely, let me pull up your account right now and get this sorted for you.', t: 48 },
  ],
};

function downloadExample() {
  const blob = new Blob([JSON.stringify(EXAMPLE_TRANSCRIPT, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'example-transcript.json';
  a.click();
  URL.revokeObjectURL(url);
}

export default function TranscriptUpload({ onSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  async function processFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setError('Only .json files are supported.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON — could not parse the file.');
      }

      validateData(data);

      const result = await ingestCall(data);
      onSuccess?.();
      navigate(`/calls/${result.callId}`);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  function validateData(data) {
    if (!data.callId || typeof data.callId !== 'string') {
      throw new Error('Missing or invalid field: callId (string)');
    }
    if (!data.agentName || typeof data.agentName !== 'string') {
      throw new Error('Missing or invalid field: agentName (string)');
    }
    if (data.duration == null || typeof data.duration !== 'number') {
      throw new Error('Missing or invalid field: duration (number, seconds)');
    }
    if (!Array.isArray(data.turns)) {
      throw new Error('Missing or invalid field: turns (array)');
    }
  }

  async function handleTryDemo() {
    setLoading(true);
    setError(null);
    try {
      // Ingest the sample example
      const result = await ingestCall(EXAMPLE_TRANSCRIPT);
      onSuccess?.();
      navigate(`/calls/${result.callId}`);
    } catch (e) {
      // If it exists, navigate anyway
      if (e.message.includes('already exists') || e.message.includes('400')) {
        onSuccess?.();
        navigate(`/calls/${EXAMPLE_TRANSCRIPT.callId}`);
      } else {
        setError(e.message);
      }
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }

  function onInputChange(e) {
    processFile(e.target.files[0]);
    e.target.value = '';
  }

  return (
    <div className="space-y-4 bg-w-card/30 backdrop-blur-md border border-w-border/60 rounded-xl p-5 shadow-2xl">
      {/* Title block */}
      <div className="flex items-center justify-between pb-3 border-b border-w-border/40">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-w-muted flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-w-yellow animate-pulse" />
          Ingest Conversation
        </h3>
        <button
          onClick={handleTryDemo}
          type="button"
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-w-yellow/10 text-w-yellow hover:bg-w-yellow hover:text-w-bg border border-w-yellow/30 hover:border-transparent rounded transition-all duration-200"
        >
          <Play className="w-3 h-3 fill-current" />
          Try Demo Call
        </button>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl px-6 py-9 text-center transition-all duration-200',
          dragging
            ? 'border-w-yellow bg-w-yellow/5 scale-[1.01] shadow-[0_0_15px_rgba(244,247,61,0.07)]'
            : 'border-w-border/80 hover:border-w-yellow/40 hover:bg-white/[0.015]',
          loading ? 'opacity-60 pointer-events-none cursor-wait' : 'cursor-pointer'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onInputChange}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-w-yellow/25 border-t-w-yellow rounded-full animate-spin" />
            <p className="text-w-muted text-sm font-medium">Analyzing conversation structure...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center mb-1 transition-all duration-300 shadow-md',
              dragging ? 'bg-w-yellow/20 text-w-yellow' : 'bg-w-bg-deep text-w-hint border border-w-border/60'
            )}>
              {dragging
                ? <FileJson className="w-6 h-6" />
                : <Upload className="w-6 h-6" />
              }
            </div>
            <p className="text-w-text text-sm font-semibold tracking-tight">
              {dragging ? 'Release to upload' : 'Upload Transcript JSON'}
            </p>
            <p className="text-w-hint text-xs">
              Drag & drop files or <span className="text-w-yellow font-medium hover:underline underline-offset-2">browse computer</span>
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-w-red/20 bg-w-red/5 px-3 py-2.5 text-xs text-w-red">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Schema with mock code editor style */}
      <div className="rounded-lg bg-[#0d0c15] border border-w-border overflow-hidden shadow-inner">
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#12111d] border-b border-w-border/40 text-[10px] text-w-hint font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-w-red/50 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-w-orange/50 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-w-green/50 inline-block" />
            <span className="ml-1 select-none">transcript-schema.json</span>
          </div>
          <span>JSON</span>
        </div>
        <pre className="p-3 text-[11px] leading-relaxed font-mono overflow-x-auto text-[#9e9daf] whitespace-pre select-all">
          <span className="text-w-violet">{"{"}</span>{`
  `}<span className="text-w-red">"callId"</span>:    <span className="text-w-green">"c001"</span>,
  <span className="text-w-red">"agentName"</span>: <span className="text-w-green">"Priya"</span>,
  <span className="text-w-red">"duration"</span>:  <span className="text-w-orange">240</span>,
  <span className="text-w-red">"turns"</span>: <span className="text-w-violet">[</span>
    <span className="text-w-violet">{"{"}</span> <span className="text-w-red">"speaker"</span>: <span className="text-w-green">"agent"</span>, <span className="text-w-red">"text"</span>: <span className="text-w-green">"…"</span>, <span className="text-w-red">"t"</span>: <span className="text-w-orange">0</span> <span className="text-w-violet">{"}"}</span>
  <span className="text-w-violet">]</span>
<span className="text-w-violet">{"}"}</span>
        </pre>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={downloadExample}
          className="flex items-center gap-1.5 text-xs text-w-hint hover:text-w-yellow transition-all duration-150"
        >
          <Download className="w-3.5 h-3.5" />
          Download Sample JSON
        </button>
        <span className="text-[10px] text-w-hint/60 font-mono">UTF-8 Encoded</span>
      </div>
    </div>
  );
}

