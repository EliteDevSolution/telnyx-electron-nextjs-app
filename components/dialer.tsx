"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Delete } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import CallService from "@/lib/call-service"

interface DialerProps {
  onCall: (number: string) => void
}

export default function Dialer({ onCall }: DialerProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isDialing, setIsDialing] = useState(false)
  const { toast } = useToast()
  const callService = CallService.getInstance()

  const handleKeyPress = (key: string) => {
    setPhoneNumber((prev) => prev + key)

    // If in a call, send DTMF tone
    if (callService.isInCall()) {
      callService.sendDTMF(key).catch((error) => {
        console.error("Failed to send DTMF:", error)
        toast({
          title: "DTMF Error",
          description: "Failed to send tone",
          variant: "destructive",
        })
      })
    }
  }

  const handleDelete = () => {
    setPhoneNumber((prev) => prev.slice(0, -1))
  }

  const handleCall = async () => {
    if (phoneNumber.length === 0) return

    setIsDialing(true)
    try {
      const call = await callService.makeCall(phoneNumber)
      if (call) {
        onCall(phoneNumber)
      } else {
        toast({
          title: "Call Failed",
          description: "Could not connect the call",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Call failed:", error)
      toast({
        title: "Call Failed",
        description: "Could not connect the call",
        variant: "destructive",
      })
    } finally {
      setIsDialing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="Enter phone number"
        className="text-xl text-center font-mono"
      />

      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((key) => (
          <Button key={key} variant="outline" className="h-14 text-xl" onClick={() => handleKeyPress(key.toString())}>
            {key}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-14" onClick={handleDelete}>
          <Delete className="h-5 w-5 mr-2" />
          Delete
        </Button>

        <Button className="h-14" onClick={handleCall} disabled={isDialing || phoneNumber.length === 0}>
          <Phone className="h-5 w-5 mr-2" />
          {isDialing ? "Dialing..." : "Call"}
        </Button>
      </div>
    </div>
  )
}
