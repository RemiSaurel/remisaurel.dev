import { motion } from 'motion-v';

export const useAnimations = () => {
  const MAIN_TRANSITION = { duration: 1, delay: 0.6 };
  const INITIAL_FADE = { opacity: 0 };
  const ANIMATE_FADE = { opacity: 1 };
  
  return {
    MAIN_TRANSITION,
    INITIAL_FADE,
    ANIMATE_FADE
  };
};
