// src/components/ui/GenerateButton.tsx
import { GenerationStatus } from '@/hooks/useImageGeneration';

interface GenerateButtonProps {
  status: GenerationStatus;
  onGenerate: () => void;
  hasPrompt: boolean;
}

export function GenerateButton({ status, onGenerate, hasPrompt }: GenerateButtonProps) {
  const getButtonText = () => {
    switch (status) {
      case 'idle':
        return 'Generate Image';
      case 'pending':
        return 'Starting...';
      case 'processing':
        return 'Generating...';
      case 'succeeded':
        return 'Generate Another';
      case 'failed':
        return 'Try Again';
      default:
        return 'Generate Image';
    }
  };

  const isDisabled = !hasPrompt || status === 'pending' || status === 'processing';

  return (
    <button
      onClick={onGenerate}
      disabled={isDisabled}
      className="w-full max-w-2xl mx-auto mt-4 min-h-[44px] px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-primary flex items-center justify-center gap-2"
    >
      {status === 'processing' && (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {getButtonText()}
    </button>
  );
}
