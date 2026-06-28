'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import PrePromptGallery from './PrePromptGallery';

interface Design {
  id: string;
  prompt: string;
  imageUrl: string;
  cloudinaryId: string;
  aspectRatio: string;
  aiProvider: string;
  createdAt: string;
}

interface JobStatus {
  jobId: string;
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  result?: {
    designId: string;
    imageUrl: string;
    cloudinaryId: string;
    aiProvider: string;
  };
  error?: string;
}

export default function DesignStudio() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedDesign, setGeneratedDesign] = useState<Design | null>(null);
  const [recentDesigns, setRecentDesigns] = useState<Design[]>([]);
  const [showGallery, setShowGallery] = useState(true);

  // Fetch recent designs on mount
  useEffect(() => {
    fetchRecentDesigns();
  }, []);

  // Poll job status when generating
  useEffect(() => {
    if (!currentJobId || !isGenerating) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/designs/job/${currentJobId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }

        const status: JobStatus = await response.json();
        setJobStatus(status);

        if (status.state === 'completed' && status.result) {
          // Job completed successfully
          setIsGenerating(false);
          setGeneratedDesign({
            id: status.result.designId,
            prompt,
            imageUrl: status.result.imageUrl,
            cloudinaryId: status.result.cloudinaryId,
            aspectRatio,
            aiProvider: status.result.aiProvider,
            createdAt: new Date().toISOString(),
          });
          setCurrentJobId(null);
          setJobStatus(null);
          setError(null);
          fetchRecentDesigns(); // Refresh recent designs
          clearInterval(pollInterval);
        } else if (status.state === 'failed') {
          // Job failed
          setIsGenerating(false);
          setError(status.error || 'Design generation failed. Please try again.');
          setCurrentJobId(null);
          setJobStatus(null);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Error polling job status:', err);
        setError('Failed to check generation status. Please refresh the page.');
        setIsGenerating(false);
        setCurrentJobId(null);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup on unmount or when job completes
    return () => clearInterval(pollInterval);
  }, [currentJobId, isGenerating, prompt, aspectRatio]);

  const fetchRecentDesigns = async () => {
    try {
      const response = await fetch('/api/designs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentDesigns(data.designs || []);
      }
    } catch (err) {
      console.error('Failed to fetch recent designs:', err);
    }
  };

  const handleGenerateDesign = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (prompt.trim().length < 3) {
      setError('Prompt must be at least 3 characters long');
      return;
    }

    if (prompt.length > 1000) {
      setError('Prompt must be less than 1000 characters');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedDesign(null);
    setJobStatus(null);

    try {
      const response = await fetch('/api/designs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start design generation');
      }

      const data = await response.json();
      setCurrentJobId(data.jobId);
    } catch (err) {
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : 'Failed to generate design');
    }
  };

  const handleSelectPrompt = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
    setShowGallery(false);
    setError(null);
    // Scroll to prompt input
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    setError(null);
    setGeneratedDesign(null);
    handleGenerateDesign();
  };

  const handleReset = () => {
    setPrompt('');
    setAspectRatio('1:1');
    setError(null);
    setGeneratedDesign(null);
    setIsGenerating(false);
    setCurrentJobId(null);
    setJobStatus(null);
    setShowGallery(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">AI Design Studio</h1>
        <p className="text-lg text-gray-600">
          Create unique T-shirt designs with AI. Describe your vision and watch it come to life.
        </p>
      </div>

      {/* Prompt Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your design
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A majestic lion in the savanna at sunset, vibrant colors, detailed illustration"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            disabled={isGenerating}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {prompt.length}/1000 characters
            </span>
            {!showGallery && (
              <button
                onClick={() => setShowGallery(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Browse example prompts
              </button>
            )}
          </div>
        </div>

        {/* Aspect Ratio Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aspect Ratio
          </label>
          <div className="flex flex-wrap gap-2">
            {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                disabled={isGenerating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  aspectRatio === ratio
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateDesign}
          disabled={isGenerating || !prompt.trim()}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isGenerating || !prompt.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Design'}
        </button>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">
                Creating your design...
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {jobStatus?.state === 'waiting' && 'Your design is queued and will start processing soon'}
                {jobStatus?.state === 'active' && 'AI is generating your design, this may take up to 30 seconds'}
                {!jobStatus && 'Starting generation...'}
              </p>
              {jobStatus?.progress !== undefined && jobStatus.progress > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${jobStatus.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{jobStatus.progress}% complete</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isGenerating && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg
              className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900">Generation Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Design Display */}
      {generatedDesign && !isGenerating && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start space-x-3 mb-4">
            <svg
              className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">Design Created Successfully!</h3>
              <p className="text-sm text-green-700 mt-1">
                Your design is ready. You can now use it to create a product.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-4">
            <div className="relative aspect-square max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={generatedDesign.imageUrl}
                alt={generatedDesign.prompt}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 448px"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Prompt:</span> {generatedDesign.prompt}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Aspect Ratio:</span> {generatedDesign.aspectRatio}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">AI Provider:</span>{' '}
                {generatedDesign.aiProvider === 'stability' ? 'Stability AI' : 'DALL-E 3'}
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Another Design
              </button>
              <button
                onClick={() => {
                  if (generatedDesign) {
                    router.push(`/configure?designUrl=${encodeURIComponent(generatedDesign.imageUrl)}&designId=${generatedDesign.id}`);
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Use This Design
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Prompt Gallery */}
      {showGallery && !isGenerating && !generatedDesign && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Get Inspired</h2>
            <button
              onClick={() => setShowGallery(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Hide gallery
            </button>
          </div>
          <PrePromptGallery onSelectPrompt={handleSelectPrompt} />
        </div>
      )}

      {/* Recent Designs */}
      {recentDesigns.length > 0 && !isGenerating && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Recent Designs</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recentDesigns.slice(0, 10).map((design) => (
              <div
                key={design.id}
                className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                onClick={() => {
                  setGeneratedDesign(design);
                  setPrompt(design.prompt);
                  setAspectRatio(design.aspectRatio);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={design.imageUrl}
                    alt={design.prompt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                      View Design
                    </span>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-600 line-clamp-2">{design.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
