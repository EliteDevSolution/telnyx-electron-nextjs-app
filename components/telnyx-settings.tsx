"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface TelnyxSettingsProps {
  onSave: (sipUsername: string, sipPassword: string, apiKey: string, messagingProfileId: string) => void
}

export default function TelnyxSettings({ onSave }: TelnyxSettingsProps) {
  const [sipUsername, setSipUsername] = useState("")
  const [sipPassword, setSipPassword] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [messagingProfileId, setMessagingProfileId] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const { profile } = useAuth()

  // Load values from profile
  useEffect(() => {
    if (profile) {
      setSipUsername(profile.sip_username || "")
      setSipPassword(profile.sip_password || "")
      setApiKey(profile.telnyx_api_key || "")
      setMessagingProfileId(profile.telnyx_messaging_profile_id || "")
    }
  }, [profile])

  const handleSave = () => {
    if (!sipUsername || !sipPassword) {
      toast({
        title: "Missing Information",
        description: "SIP Username and Password are required for WebRTC functionality",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      onSave(sipUsername, sipPassword, apiKey, messagingProfileId)
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telnyx Settings</CardTitle>
        <CardDescription>Configure your Telnyx credentials to enable calling and messaging</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sip-username">SIP Username (Required)</Label>
          <Input
            id="sip-username"
            value={sipUsername}
            onChange={(e) => setSipUsername(e.target.value)}
            placeholder="Your Telnyx SIP username"
          />
          <p className="text-xs text-muted-foreground">
            Used for WebRTC authentication. Find this in the Telnyx Portal under "Credentials" section.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sip-password">SIP Password (Required)</Label>
          <Input
            id="sip-password"
            type="password"
            value={sipPassword}
            onChange={(e) => setSipPassword(e.target.value)}
            placeholder="Your Telnyx SIP password"
          />
          <p className="text-xs text-muted-foreground">
            Used for WebRTC authentication. Find this in the Telnyx Portal under "Credentials" section.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key (For SMS)</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your Telnyx API key"
          />
          <p className="text-xs text-muted-foreground">
            Used for SMS and other API calls. Find this in the Telnyx Portal under "API Keys".
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="messaging-profile-id">Messaging Profile ID (For SMS)</Label>
          <Input
            id="messaging-profile-id"
            value={messagingProfileId}
            onChange={(e) => setMessagingProfileId(e.target.value)}
            placeholder="Your Telnyx Messaging Profile ID"
          />
          <p className="text-xs text-muted-foreground">
            Used for sending SMS. Find this in the Telnyx Portal under "Messaging" section.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={isSaving || !sipUsername || !sipPassword} className="w-full">
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  )
}
