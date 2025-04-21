"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, MessageSquare, User, Clock, Settings, LogOut } from "lucide-react"
import Dialer from "@/components/dialer"
import CallControls from "@/components/call-controls"
import SmsInterface from "@/components/sms-interface"
import CallHistory from "@/components/call-history"
import Contacts from "@/components/contacts"
import TelnyxSettings from "@/components/telnyx-settings"
import { useToast } from "@/hooks/use-toast"
import TelnyxClient from "@/lib/telnyx-client"
import CallService from "@/lib/call-service"
import SMSService from "@/lib/sms-service"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

export default function Home() {
  const [activeTab, setActiveTab] = useState("dialer")
  const [callStatus, setCallStatus] = useState("idle") // idle, ringing, ongoing
  const [isMuted, setIsMuted] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const { toast } = useToast()
  const { user, profile, signOut, isLoading } = useAuth()
  const router = useRouter()

  const initializeTelnyxClient = useCallback(
    async (sipUsername: string, sipPassword: string, apiKey: string, messagingProfileId: string) => {
      try {
        const telnyxClient = TelnyxClient.getInstance()

        // Set up socket status listener before initializing
        const removeSocketListener = telnyxClient.onSocketStatus((status) => {
          setConnectionStatus(status)

          if (status === "disconnected") {
            toast({
              title: "Connection Lost",
              description: "Disconnected from Telnyx services",
              variant: "destructive",
            })
          } else if (status === "ready") {
            toast({
              title: "Connected",
              description: "Ready to make and receive calls",
            })
          }
        })

        const success = await telnyxClient.initialize({
          sipUsername,
          sipPassword,
          ringtone: "/sounds/ringtone.mp3",
          ringbacktone: "/sounds/ringbacktone.mp3",
        })

        if (success) {
          // Initialize SMS service
          const smsService = SMSService.getInstance()
          smsService.initialize({
            apiKey,
            messagingProfileId,
          })

          // Initialize Call service
          const callService = CallService.getInstance()
          callService.initialize({
            userId: user?.id,
          })

          // Set up event listeners for incoming calls
          telnyxClient.onIncomingCall((call) => {
            setCallStatus("ringing")
            toast({
              title: "Incoming Call",
              description: `Call from ${call.callerInfo?.number || "Unknown"}`,
            })
          })

          // Set up call status listener
          callService.onCallStatus(({ status }) => {
            if (status === "answered" || status === "active") {
              setCallStatus("ongoing")
            } else if (status === "ended") {
              setCallStatus("idle")
              setIsMuted(false)
            }
          })

          setIsInitialized(true)
        }
      } catch (error) {
        console.error("Failed to initialize Telnyx client:", error)
        toast({
          title: "Connection Error",
          description: "Failed to connect to Telnyx services",
          variant: "destructive",
        })
      }
    },
    [user, toast],
  )

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user) {
      router.push("/login")
      return
    }

    // Initialize Telnyx client if we have credentials in the profile and it's not already initialized
    if (
      !isInitialized &&
      profile?.sip_username &&
      profile?.sip_password &&
      profile?.telnyx_api_key &&
      profile?.telnyx_messaging_profile_id
    ) {
      initializeTelnyxClient(
        profile.sip_username,
        profile.sip_password,
        profile.telnyx_api_key,
        profile.telnyx_messaging_profile_id,
      )
    }
  }, [isLoading, user, profile, router, isInitialized])

  const handleOutgoingCall = (number: string) => {
    setCallStatus("ongoing")
    toast({
      title: "Calling",
      description: `Calling ${number}...`,
    })
  }

  const handleEndCall = () => {
    setCallStatus("idle")
    setIsMuted(false)
    toast({
      title: "Call Ended",
      description: "The call has been disconnected",
    })
  }

  const handleToggleMute = () => {
    setIsMuted(!isMuted)
    toast({
      title: isMuted ? "Microphone Unmuted" : "Microphone Muted",
      description: isMuted ? "Others can now hear you" : "Others cannot hear you",
    })
  }

  const handleSaveSettings = async (
    sipUsername: string,
    sipPassword: string,
    apiKey: string,
    messagingProfileId: string,
  ) => {
    if (!user) return

    try {
      // Update profile in Supabase
      const { error } = await updateTelnyxCredentials(sipUsername, sipPassword, apiKey, messagingProfileId)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save Telnyx credentials",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Settings Saved",
        description: "Your Telnyx credentials have been saved",
      })

      // Initialize Telnyx client
      initializeTelnyxClient(sipUsername, sipPassword, apiKey, messagingProfileId)
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    }
  }

  const updateTelnyxCredentials = async (
    sipUsername: string,
    sipPassword: string,
    apiKey: string,
    messagingProfileId: string,
  ) => {
    if (!user) {
      return { error: new Error("User not authenticated") }
    }

    const supabase = getSupabaseBrowserClient()
    return await supabase
      .from("profiles")
      .update({
        sip_username: sipUsername,
        sip_password: sipPassword,
        telnyx_api_key: apiKey,
        telnyx_messaging_profile_id: messagingProfileId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-background">
      <div className="w-full max-w-md mx-auto bg-card rounded-xl shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Telnyx Communicator</h1>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {profile && (
            <div className="mb-2 text-sm text-muted-foreground">Logged in as {profile.full_name || profile.email}</div>
          )}

          {connectionStatus === "connected" && (
            <div className="mb-2 text-center text-xs text-green-500">Connected to Telnyx</div>
          )}

          {connectionStatus === "disconnected" && (
            <div className="mb-2 text-center text-xs text-red-500">Disconnected from Telnyx</div>
          )}

          {!isInitialized ? (
            <TelnyxSettings onSave={handleSaveSettings} />
          ) : (
            <>
              {callStatus !== "idle" && (
                <CallControls
                  status={callStatus}
                  isMuted={isMuted}
                  onEndCall={handleEndCall}
                  onToggleMute={handleToggleMute}
                />
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="dialer" disabled={callStatus === "ringing"}>
                    <Phone className="h-4 w-4 mr-1" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Dialer</span>
                  </TabsTrigger>
                  <TabsTrigger value="sms" disabled={callStatus === "ringing"}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">SMS</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" disabled={callStatus === "ringing"}>
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">History</span>
                  </TabsTrigger>
                  <TabsTrigger value="contacts" disabled={callStatus === "ringing"}>
                    <User className="h-4 w-4 mr-1" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Contacts</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" disabled={callStatus !== "idle"}>
                    <Settings className="h-4 w-4 mr-1" />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Settings</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="dialer">
                  <Dialer onCall={handleOutgoingCall} />
                </TabsContent>

                <TabsContent value="sms">
                  <SmsInterface />
                </TabsContent>

                <TabsContent value="history">
                  <CallHistory />
                </TabsContent>

                <TabsContent value="contacts">
                  <Contacts onCall={handleOutgoingCall} />
                </TabsContent>

                <TabsContent value="settings">
                  <TelnyxSettings onSave={handleSaveSettings} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </main>
  )
}