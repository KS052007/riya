import React, { useState, useEffect, useRef } from 'react';

export function InteractiveGridPattern({
  width = 40,
  height = 40,
  className = '',
}) {
  const [squares, setSquares] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const col = Math.floor(x / width);
      const row = Math.floor(y / height);
      
      setSquares((prev) => {
        const exists = prev.find(s => s.x === col && s.y === row);
        if (exists) {
          return prev.map(s => s.x === col && s.y === row ? { ...s, time: Date.now() } : s);
        }
        return [...prev, { x: col, y: row, time: Date.now() }];
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [width, height]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSquares(prev => {
        const now = Date.now();
        return prev.filter(s => now - s.time < 1000);
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`interactive-grid-container ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
      }}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="interactive-grid-pattern"
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M.5 ${height}V.5H${width}`}
              fill="none"
              stroke="rgba(0, 240, 255, 0.05)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#interactive-grid-pattern)" />

        {squares.map((sq) => {
          const age = Date.now() - sq.time;
          const opacity = Math.max(0, 1 - age / 1000) * 0.15;
          return (
            <rect
              key={`${sq.x}-${sq.y}`}
              x={sq.x * width + 0.5}
              y={sq.y * height + 0.5}
              width={width - 1}
              height={height - 1}
              fill={`rgba(0, 240, 255, ${opacity})`}
              style={{ transition: 'fill 0.1s linear' }}
            />
          );
        })}
      </svg>
    </div>
  );
}
