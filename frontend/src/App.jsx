import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import CallList from './components/CallList.jsx';
import CallDetail from './components/CallDetail.jsx';
import ObserveAILogo from './assets/ObserveAILogo.jsx';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-w-bg text-w-text font-inter">
      <header className="h-[52px] bg-w-bg-deep border-b border-w-border px-6 flex items-center gap-4 sticky top-0 z-50 flex-shrink-0">
        {/* Icon in brand yellow, wordmark in white */}
        <ObserveAILogo className="h-5 w-auto text-w-yellow" />
        <div className="w-px h-5 bg-w-border flex-shrink-0" />
        <span className="text-[13px] font-semibold text-w-muted tracking-tight">
          Call Quality Review
        </span>
      </header>
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<CallList />} />
          <Route path="/calls/:id" element={<CallDetail />} />
        </Routes>
      </main>

      <Toaster
        theme="dark"
        position="top-right"
        richColors
        expand
        toastOptions={{
          duration: 7000,
          style: {
            background: '#16161f',
            border: '1px solid #2a2a3a',
            color: '#f0f0f8',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
}
