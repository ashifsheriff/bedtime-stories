import React, { useCallback } from 'react';

const BedtimeSlideshow = () => {
  const [loading, setLoading] = React.useState(false);
  const [currentSlide, setCurrentSlide] = React.useState(null);
  const [slides, setSlides] = React.useState([]);
  const [audioLoaded, setAudioLoaded] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [storyTitle, setStoryTitle] = React.useState('');
  const [currentStoryId, setCurrentStoryId] = React.useState(null);
  const [availableStories, setAvailableStories] = React.useState([]);
  const audioRef = React.useRef(null);
  const [currentStoryBaseUrl, setCurrentStoryBaseUrl] = React.useState(null);
  const [storySegments, setStorySegments] = React.useState([]);
  const [imageErrors, setImageErrors] = React.useState({});
  const [isLoadingStory, setIsLoadingStory] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

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

  // Update the image path to use the API endpoint
  const getImageUrl = (imageFile, storyId) => {
    if (!imageFile) return '';
    return `/api/media/${storyId}/${imageFile}`;
  };

  const handleImageError = (slideIndex) => {
    console.error(`Error loading image for slide ${slideIndex + 1}`);
    setImageErrors({ ...imageErrors, [slideIndex]: true });
  };

  return (
    <div className="bedtime-slideshow">
      {/* ... existing code ... */}
      
      {/* Update the image src if it exists in the JSX */}
      {currentSlide !== null && slides.length > 0 && (
        <div className="slide-container">
          {!imageErrors[currentSlide] ? (
            <img
              src={`${currentStoryBaseUrl}/${currentStoryId}/${storySegments[currentSlide]?.image}`}
              alt={`Illustration for slide ${currentSlide + 1}`}
              onError={() => handleImageError(currentSlide)}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="error-message">
              Error loading image. Please try again later.
            </div>
          )}
          <div className="slide-text">{storySegments[currentSlide]?.text}</div>
        </div>
      )}
      
      {/* ... existing code ... */}
      
      {/* Debug information */}
      <div className="debug-info" style={{ fontSize: '12px', color: '#999', margin: '10px', padding: '10px', border: '1px solid #ddd' }}>
        <div>Audio Loaded: {audioLoaded ? 'Yes' : 'No'}</div>
        <div>Current Story ID: {currentStoryId}</div>
        <div>Audio Path: {currentStoryId ? `/api/media/${currentStoryId}/story_audio.mp3` : 'None'}</div>
        <div>Error: {error || 'None'}</div>
      </div>
    </div>
  );
};

export default BedtimeSlideshow; 