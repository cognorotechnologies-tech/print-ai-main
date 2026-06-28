'use client';

import { useState, useEffect } from 'react';
interface PrePrompt {
  id: string;
  title: string;
  prompt: string;
  category: string;
  previewUrl: string;
  sortOrder: number;
}

interface PrePromptGalleryProps {
  onSelectPrompt: (prompt: string) => void;
}

export default function PrePromptGallery({ onSelectPrompt }: PrePromptGalleryProps) {
  const [prePrompts, setPrePrompts] = useState<PrePrompt[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrePrompts();
  }, [selectedCategory]);

  const fetchPrePrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = selectedCategory
        ? `/api/designs/pre-prompts?category=${encodeURIComponent(selectedCategory)}`
        : '/api/designs/pre-prompts';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pre-prompts');
      }
      
      const data = await response.json();
      setPrePrompts(data.prePrompts);
      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    onSelectPrompt(prompt);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error loading gallery</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchPrePrompts}
          className="mt-3 text-sm font-medium text-red-600 hover:text-red-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {prePrompts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No prompts found in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {prePrompts.map((prePrompt) => (
            <div
              key={prePrompt.id}
              className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
              onClick={() => handleSelectPrompt(prePrompt.prompt)}
            >
              {/* Preview Image */}
              <div className="relative aspect-square bg-gray-100">
                {prePrompt.previewUrl ? (
                  <img
                    src={prePrompt.previewUrl}
                    alt={prePrompt.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🎨
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                  <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Use this prompt
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">
                    {prePrompt.title}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                    {prePrompt.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {prePrompt.prompt}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
