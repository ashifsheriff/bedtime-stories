"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [stories, setStories] = useState([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [segments, setSegments] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

  useEffect(() => {
    fetch("/output/stories.json")
      .then((res) => res.json())
      .then((data) => {
        setStories(data);
        setCurrentStoryIndex(0);
      });
  }, []);

  useEffect(() => {
    if (stories.length === 0) return;
    const story = stories[currentStoryIndex];
    fetch(`/output/${story}/story_segments.json`)
      .then((res) => res.json())
      .then((data) => {
        setSegments(data);
        setCurrentSegmentIndex(0);
      });
  }, [stories, currentStoryIndex]);

  const currentStory = stories[currentStoryIndex];
  const currentSegment = segments[currentSegmentIndex];

  const handleNextSegment = () => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
    }
  };

  const handleNextStory = () => {
    setCurrentStoryIndex((prev) => (prev + 1) % stories.length);
    setCurrentSegmentIndex(0);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-12">
      <div className="max-w-4xl w-full flex flex-col items-center space-y-6">
        <h1 className="text-3xl font-bold text-center">
          {currentStory?.replace(/-/g, " ")}
        </h1>

        {currentSegment && (
          <>
            <img
              src={`/output/${currentStory}/${currentSegment.image}`}
              alt="Story Image"
              className="rounded-xl w-full max-w-xl object-cover"
            />
            <p className="text-lg text-center">{currentSegment.text}</p>
            <audio
              src={`/output/${currentStory}/${currentSegment.audio}`}
              controls
              autoPlay
              onEnded={handleNextSegment}
            />
          </>
        )}

        <button
          onClick={handleNextStory}
          className="mt-8 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
        >
          Next Story
        </button>
      </div>

      {/* 👇 Hidden preload block to force Vercel to include static files */}
      <div style={{ display: "none" }}>
        <img src="/output/the-curious-cloud/image_1.png" alt="Preload" />
        <audio src="/output/the-curious-cloud/story_audio.mp3" />

        <img src="/output/lilys-magical-lullaby/image_1.png" alt="Preload" />
        <audio src="/output/lilys-magical-lullaby/story_audio.mp3" />

        <img src="/output/the-sleepy-sea-dragon/image_1.png" alt="Preload" />
        <audio src="/output/the-sleepy-sea-dragon/story_audio.mp3" />
      </div>
    </main>
  );
}
