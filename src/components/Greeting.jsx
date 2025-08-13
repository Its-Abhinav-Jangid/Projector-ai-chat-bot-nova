/*
 * RcMascot.js - Self-contained RC Car Mascot Component
 *
 * USAGE:
 * import RcMascot from './RcMascot';
 *
 * // Basic usage
 * <RcMascot />
 *
 * // With custom props
 * <RcMascot
 *   greetingText="Ready to race into learning!"
 *   dockRight={false}
 *   onDock={() => console.log('Car docked!')}
 * />
 *
 * REQUIRED PACKAGES: react only (no external deps)
 *
 * INTEGRATION NOTES:
 * - Add sound effects at marked comments (// SOUND:)
 * - Connect real chat input focus to trigger docking
 * - Customize colors/timings in the CSS variables section
 *
 * BACKGROUND CSS (add to your page):
 * body {
 *   background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%);
 *   min-height: 100vh;
 * }
 */

"use client"; // Add this for Next.js App Router

import React, { useState, useEffect, useCallback, useRef } from "react";

// Custom hooks with SSR safety
const usePrefersReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const handler = (e) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
};

const useDocumentVisibility = () => {
  const [isVisible, setIsVisible] = useState(true); // Default to visible for SSR

  useEffect(() => {
    // Only run in browser
    if (typeof document === "undefined") return;

    setIsVisible(!document.hidden); // Set initial state

    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return isVisible;
};

const RcMascot = ({
  greetingText = "Ready to race through some RC adventures! 🏎️",
  dockRight = false,
  onDock = null,
}) => {
  // State management
  const [animationState, setAnimationState] = useState("splash");
  const [showControls, setShowControls] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // Track if component is mounted

  // Refs for cleanup and preventing restart
  const timeoutRefs = useRef([]);
  const animationFrameRef = useRef(null);
  const animationStartedRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Custom hooks
  const prefersReducedMotion = usePrefersReducedMotion();
  const isDocumentVisible = useDocumentVisibility();

  // Handle mounting for SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Safe timeout wrapper
  const safeTimeout = useCallback((fn, delay) => {
    const id = setTimeout(fn, delay);
    timeoutRefs.current.push(id);
    return id;
  }, []);

  // Animation sequence
  const startSequence = useCallback(() => {
    // Prevent multiple starts
    if (animationStartedRef.current) {
      return;
    }

    animationStartedRef.current = true;

    if (prefersReducedMotion) {
      setAnimationState("docked");
      setShowControls(true);
      onDock?.();
      return;
    }

    // Show splash for 5 seconds
    setAnimationState("splash");
    // SOUND: Engine roar sound

    // Start transition to side
    safeTimeout(() => {
      if (animationStartedRef.current) {
        setAnimationState("transitioning");
        // SOUND: Zoom out sound
      }
    }, 5000);

    // Complete transition
    safeTimeout(() => {
      if (animationStartedRef.current) {
        setAnimationState("docked");
        setShowControls(true);
        onDock?.();
        // SOUND: Success ding
      }
    }, 7000);

    // Start idle loop
    safeTimeout(() => {
      if (animationStartedRef.current) {
        setAnimationState("idle");
      }
    }, 7500);
  }, [prefersReducedMotion, onDock, safeTimeout]);

  // Replay function
  const replayAnimation = useCallback(() => {
    cleanup();
    animationStartedRef.current = false;
    setShowControls(false);
    setAnimationState("splash");
    safeTimeout(() => {
      startSequence();
    }, 100);
  }, [cleanup, startSequence, safeTimeout]);

  // Initialize animation on mount ONLY
  useEffect(() => {
    if (!isMounted || isInitializedRef.current) return;

    isInitializedRef.current = true;
    safeTimeout(() => {
      startSequence();
    }, 500);

    // Cleanup only on unmount
    return () => {
      cleanup();
      animationStartedRef.current = false;
    };
  }, [isMounted, startSequence, safeTimeout, cleanup]);

  // Separate effect for handling reduced motion changes
  useEffect(() => {
    if (prefersReducedMotion && animationStartedRef.current) {
      cleanup();
      setAnimationState("docked");
      setShowControls(true);
      onDock?.();
    }
  }, [prefersReducedMotion, cleanup, onDock]);

  // Pause animations when tab is hidden (separate effect)
  useEffect(() => {
    if (typeof document === "undefined") return; // SSR safety

    const mascotEl = document.querySelector(".rc-mascot");
    if (mascotEl) {
      mascotEl.style.animationPlayState = isDocumentVisible
        ? "running"
        : "paused";
    }
  }, [isDocumentVisible]);

  // Don't render until mounted (prevents SSR issues)
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        /* CSS Variables - Customize colors and timings here */
        .rc-mascot {
          --car-primary: #f97316; /* bright orange */
          --car-secondary: #ffffff; /* white */
          --car-tertiary: #374151; /* dark gray */
          --bubble-bg: #ffffff;
          --bubble-border: #e5e7eb;
          --text-color: #1f2937;
          --shadow-color: rgba(0, 0, 0, 0.1);

          /* Animation timing */
          --splash-duration: 5s;
          --transition-duration: 2s;
          --idle-duration: 4s;
        }

        .rc-mascot {
          position: fixed;
          z-index: 1000;
          transition: all var(--transition-duration)
            cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: ${animationState === "splash" ? "none" : "auto"};
        }

        /* Splash state - full page center */
        .rc-mascot.splash {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(2px);
        }

        /* Transitioning state - moving to side */
        .rc-mascot.transitioning {
          top: 50%;
          left: ${dockRight ? "auto" : "50%"};
          right: ${dockRight ? "50%" : "auto"};
          transform: translate(${dockRight ? "50%" : "-50%"}, -50%) scale(0.3);
          width: auto;
          height: auto;
          background: none;
          backdrop-filter: none;
        }

        /* Docked/Idle state - side position */
        .rc-mascot.docked,
        .rc-mascot.idle {
          bottom: 20px;
          left: ${dockRight ? "auto" : "20px"};
          right: ${dockRight ? "20px" : "auto"};
          top: auto;
          transform: none;
          width: auto;
          height: auto;
          background: none;
          backdrop-filter: none;
        }

        .mascot-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: ${dockRight ? "flex-end" : "flex-start"};
          gap: 15px;
        }

        .rc-car {
          transform-origin: center;
          filter: drop-shadow(0 8px 16px var(--shadow-color));
          transition: all 0.3s ease;
        }

        /* Car sizes based on state */
        .splash .rc-car {
          width: 480px;
          height: 240px;
          animation: splashPulse var(--splash-duration) ease-in-out;
        }

        .transitioning .rc-car {
          width: 480px;
          height: 240px;
        }

        .docked .rc-car,
        .idle .rc-car {
          width: 120px;
          height: 60px;
        }

        .idle .rc-car {
          animation: idleFloat var(--idle-duration) ease-in-out infinite;
        }

        /* Keyframe animations */
        @keyframes splashPulse {
          0%,
          100% {
            transform: scale(1);
            filter: drop-shadow(0 8px 16px var(--shadow-color));
          }
          25% {
            transform: scale(1.05);
            filter: drop-shadow(0 12px 24px var(--shadow-color));
          }
          50% {
            transform: scale(0.98);
            filter: drop-shadow(0 6px 12px var(--shadow-color));
          }
          75% {
            transform: scale(1.02);
            filter: drop-shadow(0 10px 20px var(--shadow-color));
          }
        }

        @keyframes idleFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes antennaBounceExcited {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-8px) rotate(15deg);
          }
          50% {
            transform: translateY(-4px) rotate(-10deg);
          }
          75% {
            transform: translateY(-6px) rotate(8deg);
          }
        }

        @keyframes antennaBounceCalm {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-2px) rotate(5deg);
          }
        }

        @keyframes headlightRave {
          0%,
          100% {
            opacity: 0.3;
          }
          25% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          75% {
            opacity: 1;
          }
        }

        @keyframes eyeExcited {
          0%,
          80%,
          100% {
            transform: scaleY(1) scaleX(1);
          }
          85% {
            transform: scaleY(0.3) scaleX(1.2);
          }
          90% {
            transform: scaleY(1.2) scaleX(0.8);
          }
          95% {
            transform: scaleY(0.8) scaleX(1.1);
          }
        }

        @keyframes eyeBlink {
          0%,
          90%,
          100% {
            transform: scaleY(1);
          }
          95% {
            transform: scaleY(0.1);
          }
        }

        /* Car parts animations based on state */
        .splash .antenna-group {
          animation: antennaBounceExcited 1s ease-in-out infinite;
          transform-origin: 85px 15px;
        }

        .splash .headlight {
          animation: headlightRave 0.8s ease-in-out infinite;
        }

        .splash .eye {
          animation: eyeExcited 2s ease-in-out infinite;
          transform-origin: center;
        }

        .idle .antenna-group {
          animation: antennaBounceCalm 3s ease-in-out infinite;
          transform-origin: 85px 15px;
        }

        .idle .eye {
          animation: eyeBlink 4s ease-in-out infinite;
          transform-origin: center;
        }

        /* Speech bubble */
        .speech-bubble {
          background: var(--bubble-bg);
          border: 2px solid var(--bubble-border);
          border-radius: 20px;
          padding: 20px 25px;
          font-weight: 600;
          color: var(--text-color);
          box-shadow: 0 8px 24px var(--shadow-color);
          position: relative;
          transform-origin: ${dockRight ? "bottom right" : "bottom left"};
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .splash .speech-bubble {
          font-size: 32px;
          max-width: 600px;
          text-align: center;
          padding: 30px 40px;
          transform: scale(1);
          opacity: 1;
        }

        .docked .speech-bubble,
        .idle .speech-bubble {
          font-size: 20px;
          max-width: 280px;
          transform: scale(1);
          opacity: 1;
        }

        .transitioning .speech-bubble {
          opacity: 0;
          transform: scale(0.8);
        }

        .speech-bubble::after {
          content: "";
          position: absolute;
          bottom: -12px;
          ${dockRight ? "right: 40px" : "left: 40px"};
          width: 0;
          height: 0;
          border: 12px solid transparent;
          border-top-color: var(--bubble-bg);
        }

        .splash .speech-bubble::after {
          bottom: -15px;
          border: 15px solid transparent;
          border-top-color: var(--bubble-bg);
          left: 50%;
          right: auto;
          transform: translateX(-50%);
        }

        /* Controls */
        .controls {
          display: flex;
          gap: 10px;
          opacity: ${showControls ? "1" : "0"};
          transform: translateY(${showControls ? "0" : "15px"});
          transition: all 0.4s ease;
        }

        .control-btn {
          background: var(--car-primary);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 8px var(--shadow-color);
        }

        .control-btn:hover {
          background: #ea580c;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px var(--shadow-color);
        }

        .control-btn:focus {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        .control-btn:active {
          transform: translateY(0);
        }

        /* Accessibility */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .splash .rc-car {
            width: 320px;
            height: 160px;
          }

          .splash .speech-bubble {
            font-size: 24px;
            max-width: 400px;
            padding: 20px 25px;
          }

          .docked .rc-car,
          .idle .rc-car {
            width: 100px;
            height: 50px;
          }

          .docked .speech-bubble,
          .idle .speech-bubble {
            font-size: 18px;
            max-width: 240px;
            padding: 15px 20px;
          }
        }

        @media (max-width: 480px) {
          .splash .rc-car {
            width: 240px;
            height: 120px;
          }

          .splash .speech-bubble {
            font-size: 20px;
            max-width: 300px;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .speech-bubble {
            border-width: 3px;
          }

          .control-btn {
            border: 2px solid currentColor;
          }
        }

        /* Reduced motion fallback */
        @media (prefers-reduced-motion: reduce) {
          .rc-mascot {
            transition: none !important;
          }

          .rc-car,
          .antenna-group,
          .headlight,
          .eye,
          .speech-bubble,
          .controls {
            animation: none !important;
            transition: opacity 0.3s ease !important;
          }

          /* Stop SVG animations too */
          .wheel animateTransform {
            display: none !important;
          }

          .rc-mascot.splash {
            position: fixed;
            bottom: 20px;
            left: ${dockRight ? "auto" : "20px"};
            right: ${dockRight ? "20px" : "auto"};
            top: auto;
            transform: none;
            width: auto;
            height: auto;
            background: none;
            backdrop-filter: none;
          }
        }
      `}</style>

      <div className={`rc-mascot ${animationState}`}>
        <div className="mascot-container">
          {/* Speech bubble */}
          <div className="speech-bubble" role="status" aria-live="polite">
            {greetingText}
          </div>

          {/* RC Car SVG */}
          <svg
            className="rc-car"
            viewBox="0 0 120 60"
            role="img"
            aria-label="RC Car Mascot"
          >
            {/* Car body */}
            <rect
              x="10"
              y="20"
              width="100"
              height="25"
              rx="12"
              fill="var(--car-primary)"
            />
            <rect
              x="15"
              y="15"
              width="90"
              height="20"
              rx="10"
              fill="var(--car-secondary)"
            />

            {/* Windshield */}
            <rect
              x="25"
              y="18"
              width="35"
              height="12"
              rx="6"
              fill="#87ceeb"
              opacity="0.8"
            />

            {/* Wheels */}
            <circle
              className="wheel"
              cx="25"
              cy="50"
              r="8"
              fill="var(--car-tertiary)"
            >
              {animationState === "splash" && !prefersReducedMotion && (
                <animateTransform
                  attributeName="transform"
                  attributeType="XML"
                  type="rotate"
                  from="0 25 50"
                  to="1080 25 50"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <circle
              className="wheel"
              cx="95"
              cy="50"
              r="8"
              fill="var(--car-tertiary)"
            >
              {animationState === "splash" && !prefersReducedMotion && (
                <animateTransform
                  attributeName="transform"
                  attributeType="XML"
                  type="rotate"
                  from="0 95 50"
                  to="1080 95 50"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <circle cx="25" cy="50" r="5" fill="var(--car-secondary)" />
            <circle cx="95" cy="50" r="5" fill="var(--car-secondary)" />

            {/* Headlights */}
            <circle
              className="headlight"
              cx="105"
              cy="30"
              r="3"
              fill="#ffff99"
            />
            <circle
              className="headlight"
              cx="105"
              cy="38"
              r="3"
              fill="#ffff99"
            />

            {/* Antenna grouped together */}
            <g className="antenna-group">
              <line
                x1="85"
                y1="15"
                x2="85"
                y2="5"
                stroke="var(--car-tertiary)"
                strokeWidth="2"
              />
              <circle cx="85" cy="5" r="2" fill="var(--car-primary)" />
            </g>

            {/* Eyes */}
            <ellipse
              className="eye"
              cx="70"
              cy="25"
              rx="3"
              ry="4"
              fill="var(--car-tertiary)"
            />
            <ellipse
              className="eye"
              cx="80"
              cy="25"
              rx="3"
              ry="4"
              fill="var(--car-tertiary)"
            />
            <circle cx="70" cy="24" r="1.5" fill="white" />
            <circle cx="80" cy="24" r="1.5" fill="white" />

            {/* Spoiler */}
            <rect
              x="5"
              y="25"
              width="8"
              height="15"
              rx="4"
              fill="var(--car-primary)"
            />

            {/* Racing stripes */}
            <rect
              x="30"
              y="22"
              width="2"
              height="21"
              fill="var(--car-tertiary)"
            />
            <rect
              x="35"
              y="22"
              width="2"
              height="21"
              fill="var(--car-tertiary)"
            />

            {/* Enhanced exhaust flames */}
            {animationState === "splash" && (
              <>
                {/* Main flame layer - longest */}
                <ellipse
                  cx="-2"
                  cy="32"
                  rx="12"
                  ry="4"
                  fill="#ff6b35"
                  opacity="0.7"
                >
                  <animate
                    attributeName="rx"
                    values="12;18;12"
                    dur="0.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cx"
                    values="-2;-5;-2"
                    dur="0.4s"
                    repeatCount="indefinite"
                  />
                </ellipse>

                {/* Secondary flame layer - medium */}
                <ellipse
                  cx="1"
                  cy="32"
                  rx="8"
                  ry="3"
                  fill="#ff8c42"
                  opacity="0.8"
                >
                  <animate
                    attributeName="rx"
                    values="8;12;8"
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cx"
                    values="1;-2;1"
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                </ellipse>

                {/* Inner flame layer - hottest */}
                <ellipse
                  cx="3"
                  cy="32"
                  rx="5"
                  ry="2"
                  fill="#ffaa00"
                  opacity="0.9"
                >
                  <animate
                    attributeName="rx"
                    values="5;8;5"
                    dur="0.6s"
                    repeatCount="indefinite"
                  />
                </ellipse>

                {/* Core flame - brightest */}
                <ellipse
                  cx="4"
                  cy="32"
                  rx="3"
                  ry="1.5"
                  fill="#fff200"
                  opacity="1"
                >
                  <animate
                    attributeName="rx"
                    values="3;5;3"
                    dur="0.3s"
                    repeatCount="indefinite"
                  />
                </ellipse>

                {/* Additional flame tongues for more realism */}
                <ellipse
                  cx="-1"
                  cy="28"
                  rx="6"
                  ry="2"
                  fill="#ff6b35"
                  opacity="0.6"
                >
                  <animate
                    attributeName="rx"
                    values="6;10;6"
                    dur="0.7s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values="28;26;28"
                    dur="0.7s"
                    repeatCount="indefinite"
                  />
                </ellipse>

                <ellipse
                  cx="-1"
                  cy="36"
                  rx="6"
                  ry="2"
                  fill="#ff6b35"
                  opacity="0.6"
                >
                  <animate
                    attributeName="rx"
                    values="6;10;6"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cy"
                    values="36;38;36"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </ellipse>
              </>
            )}
          </svg>

          {/* Controls */}
          <div className="controls">
            <button
              className="control-btn"
              onClick={replayAnimation}
              aria-label="Replay mascot animation"
            >
              🔄 Replay
            </button>
          </div>
        </div>

        {/* Screen reader announcements */}
        <div className="sr-only" aria-live="polite">
          {animationState === "splash" &&
            `RC car mascot splash screen: ${greetingText}`}
          {animationState === "docked" &&
            "RC car has moved to the side and is ready to help"}
        </div>
      </div>
    </>
  );
};

export default RcMascot;
