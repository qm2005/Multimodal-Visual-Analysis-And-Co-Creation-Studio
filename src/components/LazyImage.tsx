import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholderClassName?: string;
  wrapperClassName?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  placeholderClassName = "",
  wrapperClassName = "",
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, fallback immediately to loading the image
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px", // Fetch image slightly before it reaches the viewport
      }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]);

  // If src changes, re-initialise loading state
  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Sleek Animated Shimmer Overlay while loading */}
      {!isLoaded && !isError && (
        <div 
          className={`absolute inset-0 bg-slate-50/50 flex flex-col items-center justify-center animate-pulse z-10 border border-slate-100/50 rounded-lg ${placeholderClassName}`}
        >
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        </div>
      )}

      {isError && (
        <div className="absolute inset-0 bg-slate-50 border border-slate-150 flex flex-col items-center justify-center text-slate-400 p-2 text-center rounded-lg z-10">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-500">FAILED</span>
          <span className="text-[9px] text-slate-400 mt-0.5">Blocked/Timeout</span>
        </div>
      )}

      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsError(true)}
        className={`${className} transition-all duration-500 ${
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
        }`}
        {...props}
      />
    </div>
  );
};
