<script setup lang="ts">
import { motion } from 'motion-v';
import { useAnimations } from '~/composables/useAnimations';

const { INITIAL_FADE, ANIMATE_FADE, MAIN_TRANSITION } = useAnimations();
</script>

<template>
  <motion.div 
    :initial="INITIAL_FADE" 
    :animate="ANIMATE_FADE" 
    :transition="MAIN_TRANSITION" 
  >
    👋 Hi! I'm Rémi, a French PhD student in Toulouse at the 
    <ProseA href="https://www.irit.fr/" target="_blank">IRIT</ProseA> lab, in the 
    <ProseA href="https://www.irit.fr/TALENT/site/" target="_blank">TALENT team</ProseA>, 
    collaborating with 
    <ProseA href="https://www.kosmos-education.com/" target="_blank">Kosmos Education</ProseA> and advised by Franck Silvestre, Jean-Baptiste Raclet, and Emmanuel Lescure.
    <br>
    I work on <span class="font-semibold">AI</span> and <span class="font-semibold">learning analytics</span>—developing dashboards to help teachers support students’ out-of-class activities (K-12).
    
    Interested in <span class="font-semibold">Human-AI Interaction</span> and responsible AI in education.
  </motion.div>
</template>
