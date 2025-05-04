"use client";

import React from 'react';

interface PatternGalleryProps {
  galleryItems: string[];
  onSelectPattern: (dataUrl: string) => void;
}

export default function PatternGallery({ galleryItems, onSelectPattern }: PatternGalleryProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 md:h-28 bg-gray-900 bg-opacity-95 flex overflow-x-auto p-2 md:p-2.5 gap-2 md:gap-2.5 border-t-2 border-white z-20">
      {galleryItems.map((dataUrl, index) => (
        <div 
          key={index}
          className="border-2 border-white cursor-pointer transition-transform hover:scale-105 hover:border-red-500 flex-none w-20 h-20 md:w-24 md:h-24 bg-cover"
          style={{ backgroundImage: `url("${dataUrl}")` }}
          onClick={() => onSelectPattern(dataUrl)}
          role="button"
          aria-label={`Pattern ${index + 1}`}
          title={`Pattern ${index + 1} - Click to load`}
        />
      ))}
      
      {galleryItems.length === 0 && (
        <div className="text-white italic opacity-70 flex items-center justify-center w-full text-xs md:text-sm">
          Generate patterns to save them to your gallery
        </div>
      )}
    </div>
  );
} 