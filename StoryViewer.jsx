'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function StoryViewer() {
  const [story, setStory] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const audioRef = useRef(null);
  
  // Dummy images - these will be used if real images aren't available
  const dummyImages = [
    { 
      color: 'bg-red-500', 
      title: 'Dragon and Robot Meet',
      description: 'Ember the dragon discovers Bolt the robot in a cave'
    },
    { 
      color: 'bg-blue-500', 
      title: 'Flying Adventure',
      description: 'Ember carries Bolt on an adventure through the mountains'
    },
    { 
      color: 'bg-purple-500', 
      title: 'Learning Together',
      description: 'Bolt teaches Ember about stars and science'
    },
    { 
      color: 'bg-green-500', 
      title: 'Finding the Spaceship',
      description: 'They find Bolt\'s spaceship and watch the sunset together'
    },
    { 
      color: 'bg-yellow-500', 
      title: 'Yearly Visits',
      description: 'Every year, Bolt returns to visit his friend Ember'
    }
  ];

  useEffect(() => {
    const fetchStoryText = async () => {
      try {
        const response = await fetch('/output/story.txt');
        const text = await response.text();
        setStory(text);
      } catch (error) {
        console.error('Error loading story text:', error);
        setStory('Once upon a time... (Error loading the story)');
      }
    };

    const loadImages = async () => {
      try {
        // Assume we can fetch up to 10 images - adjust as needed
        const imageUrls = [];
        for (let i = 1; i <= 10; i++) {
          const url = `/output/image_${i}.png`;
          // Check if the image exists
          try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
              imageUrls.push(url);
            } else {
              break; // Stop when we can't find the next image
            }
          } catch (e) {
            break;
          }
        }
        
        // If no real images found, we'll use our dummy images
        setImages(imageUrls);
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };

    const loadAudio = async () => {
      try {
        // Check if audio file exists
        const response = await fetch('/output/story_audio.mp3', { method: 'HEAD' });
        if (response.ok) {
          setAudioUrl('/output/story_audio.mp3');
        } else {
          setAudioFailed(true);
        }
      } catch (error) {
        console.error('Error checking audio:', error);
        setAudioFailed(true);
      }
    };

    const loadAllContent = async () => {
      await fetchStoryText();
      await loadImages();
      await loadAudio();
      setLoading(false);
    };

    loadAllContent();
  }, []);

  // Set up auto-advancing images with our story timing
  useEffect(() => {
    if ((images.length > 0 || dummyImages.length > 0) && !loading && isPlaying) {
      const actualImages = images.length > 0 ? images : dummyImages;
      const storyDuration = 90; // Assume 90 seconds for the story
      const intervalTime = storyDuration * 1000 / actualImages.length;
      
      const interval = setInterval(() => {
        setCurrentImageIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          return nextIndex >= actualImages.length ? 0 : nextIndex;
        });
      }, intervalTime);
      
      return () => clearInterval(interval);
    }
  }, [images, loading, isPlaying]);
  
  // Handle audio play/pause and synchronize with images
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => {
          console.error('Play failed:', e);
          setAudioFailed(true);
          // Start advancing images anyway
          setIsPlaying(true);
        });
      }
      setIsPlaying(!isPlaying);
    } else if (audioFailed) {
      // If audio failed, we still toggle the fake play state
      setIsPlaying(!isPlaying);
    }
  };
  
  // Simulate audio playback if real audio failed
  useEffect(() => {
    if (audioFailed && isPlaying) {
      console.log('Simulating audio playback');
    }
  }, [audioFailed, isPlaying]);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-indigo-900">
        <div className="text-white text-2xl">Loading your bedtime story...</div>
      </div>
    );
  }

  // Use real images if available, otherwise use dummy images
  const displayImages = images.length > 0 ? images : dummyImages;
  const currentImage = displayImages[currentImageIndex];

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={container}
      className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-800 p-4 sm:p-8"
    >
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <motion.h1 
          variants={item}
          className="text-center text-4xl sm:text-5xl text-white font-bold mb-8 mt-4"
        >
          Tonight's Story
        </motion.h1>
        
        {/* Current image display */}
        <motion.div 
          variants={item}
          className="mb-8"
        >
          <div className="w-full h-[250px] sm:h-[350px] relative overflow-hidden rounded-lg shadow-xl">
            {images.length > 0 ? (
              // Real image
              <img
                src={currentImage}
                alt={`Story illustration ${currentImageIndex + 1}`}
                className="rounded-lg shadow-lg object-contain w-full h-full transition-opacity duration-500"
              />
            ) : (
              // Dummy colored box with text
              <div className={`w-full h-full flex flex-col items-center justify-center ${currentImage.color} p-6 text-center`}>
                <h3 className="text-white text-2xl font-bold mb-3">{currentImage.title}</h3>
                <p className="text-white text-lg">{currentImage.description}</p>
              </div>
            )}
            
            {/* Image navigation dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Story text */}
        <motion.div
          variants={item}
          className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 mb-8 shadow-lg"
        >
          <div className="text-white text-lg sm:text-xl leading-relaxed whitespace-pre-line">
            {story.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4">{paragraph}</p>
            ))}
          </div>
        </motion.div>
        
        {/* Audio player */}
        <motion.div
          variants={item}
          className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 shadow-lg"
        >
          <div className="text-white text-center mb-3">Listen to the story:</div>
          
          {!audioFailed ? (
            // Real audio player
            <audio
              ref={audioRef}
              controls
              className="w-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            >
              <source src={audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          ) : (
            // Fake play button when audio isn't available
            <div className="flex justify-center">
              <button 
                onClick={togglePlayPause}
                className="bg-white text-indigo-900 rounded-full p-4 flex items-center justify-center shadow-lg hover:bg-indigo-100 transition-colors"
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
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
} 