import { useEffect, useRef, useCallback, useMemo } from 'react';
import gsap from '../lib/gsap';

// A position: fixed element is positioned relative to the viewport UNLESS an
// ancestor establishes a containing block (transform, perspective, filter,
// will-change of those, or contain). When that happens, the cursor's translate
// no longer maps to viewport coordinates, so we measure and compensate for it.
const getContainingBlock = element => {
  let node = element?.parentElement;
  while (node && node !== document.documentElement) {
    const style = getComputedStyle(node);
    if (
      style.transform !== 'none' ||
      style.perspective !== 'none' ||
      style.filter !== 'none' ||
      style.willChange.includes('transform') ||
      style.willChange.includes('perspective') ||
      style.willChange.includes('filter') ||
      /paint|layout|strict|content/.test(style.contain)
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

const getContainingBlockOffset = block => {
  if (!block) return { x: 0, y: 0 };
  const rect = block.getBoundingClientRect();
  return { x: rect.left + block.clientLeft, y: rect.top + block.clientTop };
};

const TargetCursor = ({
  targetSelector = '.cursor-target',
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true,
  cursorColor = '#ffffff',
  cursorColorOnTarget
}) => {
  const cursorRef = useRef(null);
  const cornersRef = useRef(null);
  const spinTl = useRef(null);
  const dotRef = useRef(null);
  const containingBlockRef = useRef(null);

  const isActiveRef = useRef(false);
  const targetCornerPositionsRef = useRef(null);
  const tickerFnRef = useRef(null);
  const activeStrengthRef = useRef(0);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileUserAgent = mobileRegex.test(userAgent.toLowerCase());
    return (hasTouchScreen && isSmallScreen) || isMobileUserAgent;
  }, []);

  const constants = useMemo(
    () => ({
      borderWidth: 3,
      cornerSize: 12
    }),
    []
  );

  // Store mouse position for the lerp loop
  const mouseRef = useRef({ x: 0, y: 0 });
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const lerpTickerRef = useRef(null);

  const moveCursor = useCallback((x, y) => {
    mouseRef.current.x = x;
    mouseRef.current.y = y;
  }, []);

  useEffect(() => {
    if (isMobile || !cursorRef.current) return;

    const originalCursor = document.body.style.cursor;
    if (hideDefaultCursor) {
      document.body.classList.add('custom-cursor-active');
    }

    const cursor = cursorRef.current;
    cornersRef.current = cursor.querySelectorAll('.target-cursor-corner');

    containingBlockRef.current = getContainingBlock(cursor);
    const getOffset = () => getContainingBlockOffset(containingBlockRef.current);

    let activeTarget = null;
    let currentLeaveHandler = null;
    let resumeTimeout = null;

    const cleanupTarget = target => {
      if (currentLeaveHandler) {
        target.removeEventListener('mouseleave', currentLeaveHandler);
      }
      currentLeaveHandler = null;
    };

    const initialOffset = getOffset();
    const startX = window.innerWidth / 2 - initialOffset.x;
    const startY = window.innerHeight / 2 - initialOffset.y;
    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: startX,
      y: startY
    });
    cursorPosRef.current = { x: startX, y: startY };
    mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // Smooth lerp loop — runs every frame for buttery cursor tracking
    const lerpSpeed = 0.15;
    const lerpTicker = () => {
      const { x: offsetX, y: offsetY } = getOffset();
      const targetX = mouseRef.current.x - offsetX;
      const targetY = mouseRef.current.y - offsetY;
      const pos = cursorPosRef.current;
      pos.x += (targetX - pos.x) * lerpSpeed;
      pos.y += (targetY - pos.y) * lerpSpeed;
      gsap.set(cursor, { x: pos.x, y: pos.y });
    };
    lerpTickerRef.current = lerpTicker;
    gsap.ticker.add(lerpTicker);

    const createSpinTimeline = () => {
      if (spinTl.current) {
        spinTl.current.kill();
      }
      spinTl.current = gsap
        .timeline({ repeat: -1 })
        .to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
    };

    createSpinTimeline();

    const tickerFn = () => {
      if (!targetCornerPositionsRef.current || !cursorRef.current || !cornersRef.current) {
        return;
      }
      const strength = activeStrengthRef.current;
      if (strength === 0) return;
      const cursorX = gsap.getProperty(cursorRef.current, 'x');
      const cursorY = gsap.getProperty(cursorRef.current, 'y');
      const corners = Array.from(cornersRef.current);
      corners.forEach((corner, i) => {
        const currentX = gsap.getProperty(corner, 'x');
        const currentY = gsap.getProperty(corner, 'y');
        const targetX = targetCornerPositionsRef.current[i].x - cursorX;
        const targetY = targetCornerPositionsRef.current[i].y - cursorY;
        const finalX = currentX + (targetX - currentX) * strength;
        const finalY = currentY + (targetY - currentY) * strength;
        const duration = strength >= 0.99 ? (parallaxOn ? 0.35 : 0) : 0.12;
        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? 'none' : 'power2.out',
          overwrite: 'auto'
        });
      });
    };

    tickerFnRef.current = tickerFn;

    const moveHandler = e => moveCursor(e.clientX, e.clientY);
    window.addEventListener('mousemove', moveHandler);

    const scrollHandler = () => {
      if (!activeTarget || !cursorRef.current) return;
      const { x: offsetX, y: offsetY } = getOffset();
      const mouseX = gsap.getProperty(cursorRef.current, 'x') + offsetX;
      const mouseY = gsap.getProperty(cursorRef.current, 'y') + offsetY;
      const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
      const isStillOverTarget =
        elementUnderMouse &&
        (elementUnderMouse === activeTarget || elementUnderMouse.closest(targetSelector) === activeTarget);
      if (!isStillOverTarget) {
        if (currentLeaveHandler) {
          currentLeaveHandler();
        }
      }
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    const mouseDownHandler = () => {
      if (!dotRef.current) return;
      gsap.to(dotRef.current, { scale: 0.7, duration: 0.25, ease: 'power2.out' });
      gsap.to(cursorRef.current, { scale: 0.9, duration: 0.25, ease: 'power2.out' });
    };

    const mouseUpHandler = () => {
      if (!dotRef.current) return;
      gsap.to(dotRef.current, { scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.5)' });
      gsap.to(cursorRef.current, { scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.5)' });
    };

    window.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('mouseup', mouseUpHandler);

    const enterHandler = e => {
      const directTarget = e.target;
      const allTargets = [];
      let current = directTarget;
      while (current && current !== document.body) {
        if (current.matches(targetSelector)) {
          allTargets.push(current);
        }
        current = current.parentElement;
      }
      const target = allTargets[0] || null;
      if (!target || !cursorRef.current || !cornersRef.current) return;
      if (activeTarget === target) return;
      if (activeTarget) {
        cleanupTarget(activeTarget);
      }
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      activeTarget = target;
      const corners = Array.from(cornersRef.current);
      corners.forEach(corner => gsap.killTweensOf(corner, 'x,y'));
      gsap.killTweensOf(cursorRef.current, 'rotation');
      spinTl.current?.pause();
      gsap.set(cursorRef.current, { rotation: 0 });

      if (cursorColorOnTarget) {
        gsap.to(corners, {
          borderColor: cursorColorOnTarget,
          duration: 0.15,
          ease: 'power2.out'
        });
        if (dotRef.current) {
          gsap.to(dotRef.current, {
            backgroundColor: cursorColorOnTarget,
            duration: 0.15,
            ease: 'power2.out'
          });
        }
      }

      const rect = target.getBoundingClientRect();
      const { borderWidth, cornerSize } = constants;
      const { x: offsetX, y: offsetY } = getOffset();
      const cursorX = gsap.getProperty(cursorRef.current, 'x');
      const cursorY = gsap.getProperty(cursorRef.current, 'y');

      targetCornerPositionsRef.current = [
        { x: rect.left - borderWidth - offsetX, y: rect.top - borderWidth - offsetY },
        { x: rect.right + borderWidth - cornerSize - offsetX, y: rect.top - borderWidth - offsetY },
        { x: rect.right + borderWidth - cornerSize - offsetX, y: rect.bottom + borderWidth - cornerSize - offsetY },
        { x: rect.left - borderWidth - offsetX, y: rect.bottom + borderWidth - cornerSize - offsetY }
      ];

      isActiveRef.current = true;
      gsap.ticker.add(tickerFnRef.current);

      gsap.to(activeStrengthRef, { current: 1, duration: hoverDuration * 1.5, ease: 'power3.out' });

      corners.forEach((corner, i) => {
        gsap.to(corner, {
          x: targetCornerPositionsRef.current[i].x - cursorX,
          y: targetCornerPositionsRef.current[i].y - cursorY,
          duration: 0.35,
          ease: 'power3.out'
        });
      });

      const leaveHandler = () => {
        gsap.ticker.remove(tickerFnRef.current);
        isActiveRef.current = false;
        targetCornerPositionsRef.current = null;
        gsap.set(activeStrengthRef, { current: 0, overwrite: true });
        activeTarget = null;

        if (cursorColorOnTarget && cornersRef.current) {
          gsap.to(Array.from(cornersRef.current), {
            borderColor: cursorColor,
            duration: 0.15,
            ease: 'power2.out'
          });
          if (dotRef.current) {
            gsap.to(dotRef.current, {
              backgroundColor: cursorColor,
              duration: 0.15,
              ease: 'power2.out'
            });
          }
        }

        if (cornersRef.current) {
          const corners = Array.from(cornersRef.current);
          gsap.killTweensOf(corners, 'x,y');
          const { cornerSize } = constants;
          const positions = [
            { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: cornerSize * 0.5 },
            { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
          ];
          const tl = gsap.timeline();
          corners.forEach((corner, index) => {
            tl.to(corner, { x: positions[index].x, y: positions[index].y, duration: 0.45, ease: 'power3.out' }, 0);
          });
        }
        resumeTimeout = setTimeout(() => {
          if (!activeTarget && cursorRef.current && spinTl.current) {
            const currentRotation = gsap.getProperty(cursorRef.current, 'rotation');
            const normalizedRotation = currentRotation % 360;
            spinTl.current.kill();
            spinTl.current = gsap
              .timeline({ repeat: -1 })
              .to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' });
            gsap.to(cursorRef.current, {
              rotation: normalizedRotation + 360,
              duration: spinDuration * (1 - normalizedRotation / 360),
              ease: 'none',
              onComplete: () => {
                spinTl.current?.restart();
              }
            });
          }
          resumeTimeout = null;
        }, 50);
        cleanupTarget(target);
      };
      currentLeaveHandler = leaveHandler;
      target.addEventListener('mouseleave', leaveHandler);
    };

    window.addEventListener('mouseover', enterHandler, { passive: true });

    const resizeHandler = () => {
      containingBlockRef.current = getContainingBlock(cursor);
    };
    window.addEventListener('resize', resizeHandler);

    return () => {
      if (tickerFnRef.current) {
        gsap.ticker.remove(tickerFnRef.current);
      }
      if (lerpTickerRef.current) {
        gsap.ticker.remove(lerpTickerRef.current);
      }
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseover', enterHandler);
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
      if (activeTarget) {
        cleanupTarget(activeTarget);
      }
      spinTl.current?.kill();
      document.body.classList.remove('custom-cursor-active');
      isActiveRef.current = false;
      targetCornerPositionsRef.current = null;
      activeStrengthRef.current = 0;
    };
  }, [
    targetSelector,
    spinDuration,
    moveCursor,
    constants,
    hideDefaultCursor,
    isMobile,
    hoverDuration,
    parallaxOn,
    cursorColor,
    cursorColorOnTarget
  ]);

  useEffect(() => {
    if (isMobile || !cursorRef.current || !spinTl.current) return;
    if (spinTl.current.isActive()) {
      spinTl.current.kill();
      spinTl.current = gsap
        .timeline({ repeat: -1 })
        .to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' });
    }
  }, [spinDuration, isMobile]);

  if (isMobile) {
    return null;
  }

  // Shared styles for the corner bracket elements
  const cornerBase = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '12px',
    height: '12px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: cursorColor,
    willChange: 'transform'
  };

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform'
      }}
    >
      {/* Center dot */}
      <div
        ref={dotRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: cursorColor,
          willChange: 'transform'
        }}
      />
      {/* Top-left corner */}
      <div
        className="target-cursor-corner"
        style={{
          ...cornerBase,
          transform: 'translate(-150%, -150%)',
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent'
        }}
      />
      {/* Top-right corner */}
      <div
        className="target-cursor-corner"
        style={{
          ...cornerBase,
          transform: 'translate(50%, -150%)',
          borderLeftColor: 'transparent',
          borderBottomColor: 'transparent'
        }}
      />
      {/* Bottom-right corner */}
      <div
        className="target-cursor-corner"
        style={{
          ...cornerBase,
          transform: 'translate(50%, 50%)',
          borderLeftColor: 'transparent',
          borderTopColor: 'transparent'
        }}
      />
      {/* Bottom-left corner */}
      <div
        className="target-cursor-corner"
        style={{
          ...cornerBase,
          transform: 'translate(-150%, 50%)',
          borderRightColor: 'transparent',
          borderTopColor: 'transparent'
        }}
      />
    </div>
  );
};

export default TargetCursor;
