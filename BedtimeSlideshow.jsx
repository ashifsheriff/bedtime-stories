'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BedtimeSlideshow() {
  // State for story management
  const [availableStories, setAvailableStories] = useState([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  
  // State for current story content
  const [storySegments, setStorySegments] = useState([]);
  const [storyTitle, setStoryTitle] = useState("Bedtime Story");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  
  // Refs
  const audioRef = useRef(null);
  const timeUpdateInterval = useRef(null);

  // Load available stories
  useEffect(() => {
    const fetchAvailableStories = async () => {
      try {
        const response = await fetch('/api/stories');
        if (!response.ok) {
          throw new Error(`Failed to fetch available stories: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (data.stories && data.stories.length > 0) {
          setAvailableStories(data.stories);
          // Initial load of the first story
          loadStory(data.stories[0].id);
        } else {
          setError("No story folders found. Please add stories to the /public/output/ directory.");
        }
      } catch (error) {
        console.error('Error fetching stories:', error);
        setError(`Failed to load stories: ${error.message}`);
      }
    };

    fetchAvailableStories();
  }, []);

  // Load a specific story
  const loadStory = async (storyId) => {
    setIsLoadingStory(true);
    setError(null);
    setImageErrors({});
    setStorySegments([]);
    setCurrentSlide(0);
    setProgress(0);
    
    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    
    try {
      const response = await fetch(`/output/${storyId}/story_segments.json`);
      if (!response.ok) {
        throw new Error(`Failed to load story segments: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Set story title from JSON or fallback to folder name
      if (data.title) {
        setStoryTitle(data.title);
      } else {
        // Find the story in our available stories and use its title
        const story = availableStories.find(s => s.id === storyId);
        setStoryTitle(story ? story.title : storyId);
      }
      
      // Set segments
      setStorySegments(data.segments || data);
      
      setIsLoadingStory(false);
      setLoading(false);
      
    } catch (error) {
      console.error(`Error loading story ${storyId}:`, error);
      setError(`Failed to load story "${storyId}": ${error.message}`);
      setIsLoadingStory(false);
      setLoading(false);
    }
  };

  // Go to the next story
  const goToNextStory = () => {
    if (availableStories.length <= 1) return;
    
    const nextIndex = (currentStoryIndex + 1) % availableStories.length;
    setCurrentStoryIndex(nextIndex);
    loadStory(availableStories[nextIndex].id);
  };

  // Set up audio event handlers
  useEffect(() => {
    if (!audioRef.current || error) return;

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentSlide(0);
      setProgress(0);
    };

    const handleError = () => {
      setError("Unable to load audio file. Please check that the file exists and is a valid audio format.");
    };

    // When audio loads, set duration
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [error, audioRef.current]);

  // Update current slide based on audio time
  useEffect(() => {
    if (!isPlaying || storySegments.length === 0 || error) {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
        timeUpdateInterval.current = null;
      }
      return;
    }

    // Check audio time every 100ms and update current slide
    timeUpdateInterval.current = setInterval(() => {
      if (!audioRef.current) return;
      
      const currentTime = audioRef.current.currentTime;
      setProgress(currentTime);

      // Find which segment we're currently in
      const segmentIndex = storySegments.findIndex(
        segment => currentTime >= segment.start && currentTime < segment.end
      );

      if (segmentIndex !== -1 && segmentIndex !== currentSlide) {
        setCurrentSlide(segmentIndex);
      }
    }, 100);

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, [isPlaying, storySegments, currentSlide, error]);

  // Handle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current || error) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error("Audio playback error:", error);
        setError("Failed to play audio. Please check that the audio file exists and is accessible.");
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Handle progress bar click
  const handleProgressBarClick = (e) => {
    if (!audioRef.current || !duration || error) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    
    const newTime = position * duration;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);

    // Find the appropriate slide for this time
    const segmentIndex = storySegments.findIndex(
      segment => newTime >= segment.start && newTime < segment.end
    );
    
    if (segmentIndex !== -1) {
      setCurrentSlide(segmentIndex);
    }
  };

  // Handle image error
  const handleImageError = (index) => {
    setImageErrors(prev => ({
      ...prev,
      [index]: true
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-indigo-900">
        <div className="text-white text-2xl">Loading your bedtime story...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-indigo-900 p-8">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-2xl">
          <h2 className="text-white text-2xl mb-4 text-center">Unable to Load Story</h2>
          <p className="text-white text-lg">{error}</p>
          <p className="text-white text-lg mt-4">
            Please check that story files exist in:
            <br />
            <code className="bg-indigo-800/50 px-2 py-1 rounded mt-2 block overflow-x-auto">
              /public/output/{availableStories[currentStoryIndex]?.id || '[story-folder]'}/
            </code>
          </p>
          
          {availableStories.length > 1 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={goToNextStory}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full"
              >
                Try Next Story
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (storySegments.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-indigo-900">
        <div className="text-white text-2xl text-center p-8">
          No story segments found. Please check that your story_segments.json file exists and is properly formatted.
        </div>
      </div>
    );
  }

  const currentSegment = storySegments[currentSlide];
  const currentStoryId = availableStories[currentStoryIndex]?.id || '';

  return (
    <div className="h-screen w-full bg-gradient-to-b from-indigo-900 to-purple-800 overflow-hidden">
      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={`/output/${currentStoryId}/story_audio.mp3`}
        className="hidden" 
      />

      <div className="flex flex-col h-full max-w-5xl mx-auto px-4 py-8">
        {/* Story Title & Controls */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-center text-3xl md:text-4xl text-white font-bold">
            {storyTitle}
          </h1>
          
          {availableStories.length > 1 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToNextStory}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium py-2 px-4 rounded-full flex items-center"
              disabled={isLoadingStory}
            >
              {isLoadingStory ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Next Story
            </motion.button>
          )}
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {isLoadingStory ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex flex-col items-center justify-center"
            >
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-16 w-16 text-white mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-white text-xl">Loading story...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex flex-col items-center justify-center"
            >
              {/* Image with fade transition */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentStoryId}-slide-${currentSlide}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-lg h-64 md:h-80 mb-8 rounded-xl overflow-hidden shadow-2xl bg-indigo-800/30"
                >
                  {!imageErrors[currentSlide] ? (
                    <img
                      src={`/output/${currentStoryId}/${currentSegment?.image}`}
                      alt={`Illustration for slide ${currentSlide + 1}`}
                      onError={() => handleImageError(currentSlide)}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-16 w-16 text-red-300 mb-4" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-white text-center">
                        Image not found: {currentSegment?.image}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Text with fade transition */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentStoryId}-text-${currentSlide}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white/20 backdrop-blur-sm p-6 rounded-xl max-w-2xl shadow-lg"
                >
                  <p className="text-white text-xl md:text-2xl leading-relaxed text-center">
                    {currentSegment?.text || "Error: Missing text for this slide"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio Controls */}
        <div className="mt-auto pt-6">
          {/* Progress Bar */}
          <div 
            className="h-3 bg-indigo-300/30 rounded-full cursor-pointer mb-4 relative"
            onClick={handleProgressBarClick}
          >
            <div 
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${(progress / duration) * 100}%` }}
            />
          </div>

          {/* Play/Pause Button */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlayPause}
              className="bg-white text-indigo-900 rounded-full p-4 flex items-center justify-center shadow-lg hover:bg-indigo-100 transition-colors"
              aria-label={isPlaying ? "Pause story" : "Play story"}
              disabled={!!error || isLoadingStory}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
} 