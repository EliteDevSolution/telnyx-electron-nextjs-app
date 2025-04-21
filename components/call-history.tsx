"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { useAuth } from "@/contexts/auth-context"

interface CallRecord {
  id: string
  call_id: string
  direction: "incoming" | "outgoing"
  phone_number: string
  status: string
  duration: number
  started_at: string
  ended_at: string | null
}

export default function CallHistory() {
  const [callRecords, setCallRecords] = useState<CallRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (user) {
      loadCallHistory()
    }
  }, [user])

  const loadCallHistory = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("call_history")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(50)

      if (error) {
        throw error
      }

      setCallRecords(data || [])
    } catch (error) {
      console.error("Failed to load call history:", error)
      toast({
        title: "Error",
        description: "Failed to load call history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getCallIcon = (record: CallRecord) => {
    if (record.direction === "incoming") {
      if (record.status === "rejected" || record.status === "missed") {
        return <PhoneMissed className="h-4 w-4 text-red-500" />
      }
      return <PhoneIncoming className="h-4 w-4 text-green-500" />
    } else {
      return <PhoneOutgoing className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusText = (record: CallRecord) => {
    switch (record.status) {
      case "answered":
        return "Answered"
      case "ended":
        return "Completed"
      case "rejected":
        return "Rejected"
      case "missed":
        return "Missed"
      case "dialing":
        return "Dialing"
      case "ringing":
        return "Ringing"
      default:
        return record.status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Call History</h3>
        <Button variant="ghost" size="sm" onClick={loadCallHistory} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : callRecords.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">No call history available</div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {callRecords.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center">
                <div className="mr-3">{getCallIcon(record)}</div>
                <div>
                  <div className="font-medium">{record.phone_number}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(record.started_at)} • {getStatusText(record)}
                  </div>
                </div>
              </div>
              <div className="text-sm">
                {record.status === "ended" && record.duration > 0 ? formatDuration(record.duration) : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
