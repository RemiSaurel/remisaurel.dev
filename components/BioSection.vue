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
    class="mt-8"
  >
    Hey! I'm a Rémi, a French PhD student located in Toulouse, France. I'm working at the 
    <ProseA href="https://www.irit.fr/" target="_blank">IRIT</ProseA> lab, within the 
    <ProseA href="https://www.irit.fr/TALENT/site/" target="_blank">TALENT team</ProseA> and with 
    <ProseA href="https://www.kosmos-education.com/" target="_blank">Kosmos Education</ProseA>.
    <br>
    My main focus is about <span class="font-semibold">AI</span> and <span class="font-semibold">learning analytics</span> 
    to support learning and teaching. I'm working on Learning Analytics Dashboards for teachers to
    help them regulate out-of-class learning activities from their students (K-12).
    <p>I am advised by Franck Silvestre, Jean-Baptiste Raclet, and Emmanuel Lescure.</p>
  </motion.div>
</template>
