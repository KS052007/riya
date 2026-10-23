import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { Flip } from 'gsap/Flip';
import { Draggable } from 'gsap/Draggable';
import { Observer } from 'gsap/Observer';
import { TextPlugin } from 'gsap/TextPlugin';

// Register all the free plugins globally
gsap.registerPlugin(
  useGSAP,
  ScrollTrigger,
  ScrollToPlugin,
  MotionPathPlugin,
  Flip,
  Draggable,
  Observer,
  TextPlugin
);

export default gsap;
