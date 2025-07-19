"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudyTimerProps {
  onTimeUpdate?: (seconds: number) => void;
  onFinalTime?: (seconds: number) => void;
  autoStart?: boolean;
  className?: string;
}

export default function StudyTimer({
  onTimeUpdate,
  onFinalTime,
  autoStart = true,
  className = "",
}: StudyTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const newTime = prev + 1;
          onTimeUpdate?.(newTime);
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUpdate]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setSeconds(0);
    setIsRunning(autoStart);
    onTimeUpdate?.(0);
  };

  const stopTimer = () => {
    setIsRunning(false);
    onFinalTime?.(seconds);
  };

  // Expose the current time for external access
  const getCurrentTime = () => seconds;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-sm font-mono">
        <Clock className="h-4 w-4" />
        <span className="min-w-[3rem] text-center">{formatTime(seconds)}</span>
      </div>

      <div className="flex gap-1">
        <Button
          onClick={toggleTimer}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isRunning ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>

        <Button
          onClick={resetTimer}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
