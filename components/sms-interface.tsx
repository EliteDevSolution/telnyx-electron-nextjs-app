"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import SMSService from "@/lib/sms-service"

interface Message {
  id: string
  text: string
  timestamp: Date
  incoming: boolean
  status?: string
}

export default function SmsInterface() {
  const [recipient, setRecipient] = useState("")
  const [messageText, setMessageText] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()
  const smsService = SMSService.getInstance()

  useEffect(() => {
    // Load SMS history when component mounts
    loadSMSHistory()
  }, [])

  const loadSMSHistory = async () => {
    setIsLoading(true)
    try {
      const response = await smsService.getSMSHistory({
        pageSize: 20,
      })

      const formattedMessages = response.data.map((msg: any) => ({
        id: msg.id,
        text: msg.text,
        timestamp: new Date(msg.sent_at || msg.received_at),
        incoming: msg.direction === "inbound",
        status: msg.status,
      }))

      setMessages(formattedMessages)
    } catch (error) {
      console.error("Failed to load SMS history:", error)
      toast({
        title: "Error",
        description: "Failed to load message history",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!recipient || !messageText) return

    setIsSending(true)
    try {
      // Create a temporary message
      const tempId = `temp-${Date.now()}`
      const tempMessage: Message = {
        id: tempId,
        text: messageText,
        timestamp: new Date(),
        incoming: false,
        status: "sending",
      }

      setMessages((prev) => [tempMessage, ...prev])
      setMessageText("")

      // Send the actual SMS
      const response = await smsService.sendSMS(recipient, messageText)

      // Update the message with the real ID and status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                id: response.data.id,
                status: response.data.status,
              }
            : msg,
        ),
      )

      toast({
        title: "Message Sent",
        description: `SMS sent to ${recipient}`,
      })
    } catch (error) {
      console.error("Failed to send SMS:", error)

      // Update the temporary message to show error
      setMessages((prev) => prev.map((msg) => (msg.id.startsWith("temp-") ? { ...msg, status: "failed" } : msg)))

      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient phone number" />

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Messages</h3>
        <Button variant="ghost" size="sm" onClick={loadSMSHistory} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="h-64 overflow-y-auto border rounded-md p-2 bg-background">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            {isLoading ? "Loading messages..." : "No messages yet"}
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-2 rounded-lg max-w-[80%] ${
                  message.incoming ? "bg-muted ml-0 mr-auto" : "bg-primary text-primary-foreground ml-auto mr-0"
                }`}
              >
                <div>{message.text}</div>
                <div className="text-xs opacity-70 flex justify-between">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.status && !message.incoming && (
                    <span className="ml-2">
                      {message.status === "sending"
                        ? "Sending..."
                        : message.status === "failed"
                          ? "Failed"
                          : message.status === "delivered"
                            ? "Delivered"
                            : message.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <Textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          className="resize-none"
          rows={2}
          disabled={isSending}
        />
        <Button onClick={handleSendMessage} className="self-end" disabled={!recipient || !messageText || isSending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
