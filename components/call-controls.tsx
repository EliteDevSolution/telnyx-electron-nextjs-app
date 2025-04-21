"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { PhoneOff, Mic, MicOff, PhoneIncoming } from "lucide-react"
import CallService from "@/lib/call-service"
import { useToast } from "@/hooks/use-toast"

interface CallControlsProps {
  status: string
  isMuted: boolean
  onEndCall: () => void
  onToggleMute: () => void
}

export default function CallControls({ status, isMuted, onEndCall, onToggleMute }: CallControlsProps) {
  const [callDuration, setCallDuration] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const callService = CallService.getInstance()
  const { toast } = useToast()

  useEffect(() => {
    // Start timer when call is ongoing
    if (status === "ongoing" && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }

    // Clean up timer when call ends
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleEndCall = async () => {
    try {
      await callService.endCall()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setCallDuration(0)
      onEndCall()
    } catch (error) {
      console.error("Failed to end call:", error)
      toast({
        title: "Error",
        description: "Failed to end call",
        variant: "destructive",
      })
    }
  }

  const handleToggleMute = async () => {
    try {
      await callService.toggleMute(!isMuted)
      onToggleMute()
    } catch (error) {
      console.error("Failed to toggle mute:", error)
      toast({
        title: "Error",
        description: "Failed to toggle mute",
        variant: "destructive",
      })
    }
  }

  const handleAnswerCall = async () => {
    if (status !== "ringing") return

    try {
      await callService.answerCall()
      toast({
        title: "Call Answered",
        description: "You are now connected",
      })
    } catch (error) {
      console.error("Failed to answer call:", error)
      toast({
        title: "Error",
        description: "Failed to answer call",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mb-6 p-4 bg-muted rounded-lg">
      <div className="text-center mb-4">
        <div className="text-lg font-medium">{status === "ringing" ? "Incoming Call..." : "Call in progress"}</div>
        <div className="text-sm text-muted-foreground">
          {status === "ringing" ? "Waiting for answer" : formatDuration(callDuration)}
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        {status === "ringing" ? (
          <>
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600"
              onClick={handleAnswerCall}
            >
              <PhoneIncoming className="h-5 w-5" />
            </Button>
            <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={handleEndCall}>
              <PhoneOff className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              className={`h-12 w-12 rounded-full ${isMuted ? "bg-destructive text-destructive-foreground" : ""}`}
              onClick={handleToggleMute}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={handleEndCall}>
              <PhoneOff className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
