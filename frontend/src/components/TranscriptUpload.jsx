import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileJson, Download, Play } from 'lucide-react';
import { toast } from 'sonner';
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
  const inputRef = useRef(null);
  const navigate = useNavigate();

  function fireErrorToast(e) {
    if (e.isValidation) {
      toast.error(`Invalid field — ${e.field}`, {
        description: e.fix
          ? `${e.detail}\n\nExpected: ${e.fix}`
          : e.detail,
      });
    } else {
      toast.error('Upload Failed', { description: e.message });
    }
  }

  async function processFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      toast.error('Unsupported file type', {
        description: 'Only .json files are accepted. Drag in a valid transcript JSON.',
      });
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Could not parse the file — make sure it is valid JSON.');
      }

      validateData(data);

      const result = await ingestCall(data);
      toast.success('Transcript ingested', {
        description: `${result.momentCount} moment${result.momentCount !== 1 ? 's' : ''} detected for call ${result.callId}.`,
      });
      onSuccess?.();
      navigate(`/calls/${result.callId}`);
    } catch (e) {
      fireErrorToast(e);
      setLoading(false);
    }
  }

  function validateData(data) {
    if (!data.callId) {
      throw new ValidationError('callId', 'Field is missing.', '"callId": "c001"');
    }
    if (typeof data.callId !== 'string') {
      throw new ValidationError('callId', `Expected a string, got ${typeof data.callId}.`, '"callId": "c001"');
    }
    if (!data.agentName) {
      throw new ValidationError('agentName', 'Field is missing.', '"agentName": "Priya"');
    }
    if (typeof data.agentName !== 'string') {
      throw new ValidationError('agentName', `Expected a string, got ${typeof data.agentName}.`, '"agentName": "Priya"');
    }
    if (data.duration == null) {
      throw new ValidationError('duration', 'Field is missing.', '"duration": 240');
    }
    if (typeof data.duration !== 'number' || isNaN(data.duration)) {
      throw new ValidationError(
        'duration',
        `Expected a number (seconds), but received ${typeof data.duration} — ${JSON.stringify(data.duration)}. Remove the quotes around the value.`,
        '"duration": 240'
      );
    }
    if (!Array.isArray(data.turns)) {
      throw new ValidationError('turns', `Expected an array, got ${typeof data.turns}.`, '"turns": [ { "speaker": "agent", "text": "...", "t": 0 } ]');
    }
  }

  class ValidationError extends Error {
    constructor(field, detail, fix) {
      super(`${field}: ${detail}`);
      this.isValidation = true;
      this.field = field;
      this.detail = detail;
      this.fix = fix;
    }
  }

  async function handleTryDemo() {
    setLoading(true);
    try {
      // Ingest the sample example
      const result = await ingestCall(EXAMPLE_TRANSCRIPT);
      onSuccess?.();
      navigate(`/calls/${result.callId}`);
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('400')) {
        onSuccess?.();
        navigate(`/calls/${EXAMPLE_TRANSCRIPT.callId}`);
      } else {
        toast.error('Demo failed', { description: e.message });
        setLoading(false);
      }
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
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-xl px-6 py-10 text-center transition-all duration-200',
          dragging
            ? 'border-w-yellow bg-w-yellow/5 scale-[1.01]'
            : 'border-w-border/60 hover:border-w-yellow/40 hover:bg-white/[0.015]',
          loading ? 'opacity-50 pointer-events-none cursor-wait' : 'cursor-pointer'
        )}
      >
        <input ref={inputRef} type="file" accept=".json,application/json" className="hidden" onChange={onInputChange} />

        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-w-yellow/25 border-t-w-yellow rounded-full animate-spin" />
            <p className="text-w-hint text-xs">Analyzing…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            {dragging
              ? <FileJson className="w-6 h-6 text-w-yellow mb-1" />
              : <Upload className="w-6 h-6 text-w-hint mb-1" />
            }
            <p className="text-w-text text-sm font-semibold">
              {dragging ? 'Release to upload' : 'Drop transcript JSON here'}
            </p>
            <p className="text-w-hint text-xs">
              or <span className="text-w-yellow hover:underline underline-offset-2 cursor-pointer">browse</span>
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-1">
        <button type="button" onClick={handleTryDemo} disabled={loading}
          className="flex items-center gap-1 text-xs text-w-hint hover:text-w-yellow transition-colors disabled:opacity-40">
          <Play className="w-3 h-3 fill-current" />
          Try demo call
        </button>
        <button type="button" onClick={downloadExample}
          className="flex items-center gap-1 text-xs text-w-hint hover:text-w-yellow transition-colors">
          <Download className="w-3 h-3" />
          Download sample
        </button>
      </div>
    </div>
  );
}

