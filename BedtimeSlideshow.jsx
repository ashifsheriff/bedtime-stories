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
  const [currentStoryBaseUrl, setCurrentStoryBaseUrl] = useState('/output'); // Default base URL
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  // Refs
  const audioRef = useRef(null);
  const timeUpdateInterval = useRef(null);

  // Load available stories from stories.json first, or fallback to API
  useEffect(() => {
    const fetchAvailableStories = async () => {
      try {
        console.log('Fetching available stories...');
        // First try to load from stories.json
        try {
          const storiesJsonResponse = await fetch('/output/stories.json');
          if (storiesJsonResponse.ok) {
            const storiesData = await storiesJsonResponse.json();
            console.log('Loaded stories from stories.json:', storiesData);
            
            if (storiesData.stories && storiesData.stories.length > 0) {
              // Convert simple array of folder names to story objects
              const formattedStories = storiesData.stories.map(folderId => {
                // Convert folder ID to a readable title
                const title = folderId
                  .replace(/-/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                  
                return {
                  id: folderId,
                  title: title,
                  valid: true,
                  isPublic: true,
                  baseUrl: '/output'
                };
              });
              
              setAvailableStories(formattedStories);
              // Load the first story
              loadStory(formattedStories[0].id);
              return;
            }
          }
        } catch (storiesJsonError) {
          console.warn('Could not load from stories.json, falling back to API:', storiesJsonError);
        }
        
        // Fallback to new lightweight API endpoint
        try {
          const apiResponse = await fetch('/api/story-list');
          if (!apiResponse.ok) {
            throw new Error(`Failed to fetch available stories: ${apiResponse.status}`);
          }
          const data = await apiResponse.json();
          
          console.log('Stories API response:', data);
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          if (data.stories && data.stories.length > 0) {
            console.log(`Found ${data.stories.length} stories:`, data.stories.map(s => s.title));
            setAvailableStories(data.stories);
            // Initial load of the first story
            loadStory(data.stories[0].id);
            return;
          }
        } catch (storyListError) {
          console.warn('Could not load from story-list API, falling back to stories API:', storyListError);
        }
        
        // Last resort - try the original API endpoint
        const apiResponse = await fetch('/api/stories');
        if (!apiResponse.ok) {
          throw new Error(`Failed to fetch available stories: ${apiResponse.status}`);
        }
        const data = await apiResponse.json();
        
        console.log('Stories API response:', data);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (data.stories && data.stories.length > 0) {
          console.log(`Found ${data.stories.length} stories:`, data.stories.map(s => s.title));
          setAvailableStories(data.stories);
          // Initial load of the first story
          loadStory(data.stories[0].id);
        } else {
          console.warn('No story folders found');
          setError("No story folders found. Please add stories to the /public/output/ directory.");
        }
      } catch (error) {
        console.error('Error fetching stories:', error);
        setError(`Failed to load stories: ${error.message}`);
        setLoading(false);
      }
    };

    fetchAvailableStories();
  }, []);

  // Check if audio file exists at a given URL
  const checkAudioExists = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error(`Error checking audio at ${url}:`, error);
      return false;
    }
  };

  // Set up audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // When audio metadata is loaded, set duration and allow playback
    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded');
      setDuration(audio.duration);
      setAudioLoaded(true);
      setLoading(false);
    };
    
    // When audio playback ends
    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-advance to next slide if not on the last slide
      if (currentSlide < storySegments.length - 1) {
        setCurrentSlide(currentSlide + 1);
        setProgress(storySegments[currentSlide + 1].start);
        audio.currentTime = storySegments[currentSlide + 1].start;
      } else {
        // We've reached the end of the story
        setProgress(0);
        audio.currentTime = 0;
      }
    };
    
    // Update progress during playback
    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
      
      // Find the appropriate slide for this time
      const segmentIndex = storySegments.findIndex(
        segment => audio.currentTime >= segment.start && audio.currentTime < segment.end
      );
      
      if (segmentIndex !== -1 && segmentIndex !== currentSlide) {
        setCurrentSlide(segmentIndex);
      }
    };
    
    // Handle audio errors
    const handleError = (e) => {
      console.error('Audio error:', e);
      setError('Unable to load audio file. Please check that the file exists and is a valid audio format.');
      setLoading(false);
    };
    
    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);
    
    // Set up interval for more frequent progress updates
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }
    
    timeUpdateInterval.current = setInterval(() => {
      if (audio && isPlaying) {
        setProgress(audio.currentTime);
      }
    }, 50);
    
    return () => {
      // Clean up event listeners
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      
      // Clear interval
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, [currentSlide, isPlaying, storySegments]);

  // Load a specific story
  const loadStory = async (storyId) => {
    setIsLoadingStory(true);
    setError(null);
    setImageErrors({});
    setStorySegments([]);
    setCurrentSlide(0);
    setProgress(0);
    setAudioLoaded(false);
    
    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    
    try {
      // Find the story in our available stories to get its baseUrl
      const story = availableStories.find(s => s.id === storyId);
      
      // Use our new API endpoint instead of direct file access
      const baseUrl = '/api/media';
      setCurrentStoryBaseUrl(baseUrl);
      
      console.log(`Loading story: ${storyId} from API endpoint: ${baseUrl}`);
      
      // Fetch story segments from our API
      const segmentsUrl = `${baseUrl}/${storyId}/story_segments.json`;
      console.log(`Fetching story segments from: ${segmentsUrl}`);
      
      const response = await fetch(segmentsUrl);
      if (!response.ok) {
        throw new Error(`Failed to load story segments: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Set story title from JSON or fallback to folder name
      if (data.title) {
        setStoryTitle(data.title);
      } else {
        setStoryTitle(story ? story.title : storyId);
      }
      
      // Set segments
      setStorySegments(data.segments || data);
      
      // Set audio directly through our API
      const audioUrl = `${baseUrl}/${storyId}/story_audio.mp3`;
      console.log(`Setting audio URL: ${audioUrl}`);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        // We'll wait for the audio's onloadedmetadata event to set audioLoaded to true
      } else {
        console.error('Audio ref is null');
        setError('Audio player could not be initialized');
      }
      
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
    if (availableStories.length === 0) return;
    
    // If there's only one story, reload the same story
    if (availableStories.length === 1) {
      loadStory(availableStories[0].id);
      return;
    }
    
    // Otherwise, go to the next story in the list
    const nextIndex = (currentStoryIndex + 1) % availableStories.length;
    setCurrentStoryIndex(nextIndex);
    loadStory(availableStories[nextIndex].id);
  };

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
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-indigo-900 to-purple-800">
        <div className="text-center">
          <svg className="animate-spin h-16 w-16 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-white text-2xl">Loading your bedtime stories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-b from-indigo-900 to-purple-800 p-8">
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
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-indigo-900 to-purple-800">
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
        preload="auto"
        crossOrigin="anonymous"
        className="hidden" 
      />

      <div className="flex flex-col h-full max-w-5xl mx-auto px-4 py-8">
        {/* Debug Info - Remove in production */}
        <div className="absolute top-0 right-0 bg-black/50 text-white text-xs p-2 m-2 rounded-lg z-50">
          Audio Loaded: {audioLoaded ? 'Yes' : 'No'} | 
          Story: {currentStoryId} |
          Base URL: {currentStoryBaseUrl}
        </div>
        
        {/* Story Title & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl text-white font-bold">
              {storyTitle}
            </h1>
            <p className="text-white/70 text-sm">
              Story {currentStoryIndex + 1} of {availableStories.length}
            </p>
          </div>
          
          {/* Always show the Next Story button when there are stories */}
          {availableStories.length >= 1 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToNextStory}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium py-3 px-6 rounded-full flex items-center shadow-lg"
              disabled={isLoadingStory}
            >
              {isLoadingStory ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              )}
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
                      src={`${currentStoryBaseUrl}/${currentStoryId}/${currentSegment?.image}`}
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