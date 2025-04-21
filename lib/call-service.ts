import TelnyxClient from "./telnyx-client"
import type { Call, CallOptions } from "@telnyx/webrtc"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

interface CallRecord {
  id: string
  direction: "incoming" | "outgoing"
  number: string
  timestamp: Date
  status: string
  duration: number
  answeredAt?: Date
  endedAt?: Date
}

// This service handles call functionality using the Telnyx WebRTC client
class CallService {
  private static instance: CallService
  private telnyxClient: TelnyxClient
  private callHistory: CallRecord[] = []
  private defaultCallerIdNumber: string | null = null
  private callStatusListeners: Array<(status: { callId: string; status: string }) => void> = []
  private activeCallTimer: NodeJS.Timeout | null = null
  private activeCallStartTime: Date | null = null
  private userId: string | null = null

  private constructor() {
    // Private constructor to enforce singleton pattern
    this.telnyxClient = TelnyxClient.getInstance()
  }

  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService()
    }
    return CallService.instance
  }

  public initialize(config: {
    defaultCallerIdNumber?: string
    userId?: string
  }): void {
    this.defaultCallerIdNumber = config.defaultCallerIdNumber || "+15815080022"
    this.userId = config.userId || null

    // Set up call event listeners
    this.setupCallEventListeners()
  }

  public setUserId(userId: string): void {
    this.userId = userId
  }

  private setupCallEventListeners(): void {
    // Listen for incoming calls
    this.telnyxClient.onIncomingCall((call) => {
      // Add to call history
      const callRecord: CallRecord = {
        id: call.id || `call-${Date.now()}`,
        direction: "incoming",
        number: call.callerInfo?.number || "Unknown",
        timestamp: new Date(),
        status: "ringing",
        duration: 0,
      }

      this.addCallToHistory(callRecord)

      // Set up call-specific event listeners
      this.setupCallSpecificListeners(call, callRecord.id)
    })
  }

  private setupCallSpecificListeners(call: Call, callId: string): void {
    // call.on("call.state.answered", () => {
    //   this.updateCallInHistory(callId, {
    //     status: "answered",
    //     answeredAt: new Date(),
    //   })

    //   this.notifyCallStatusListeners(callId, "answered")

    //   // Start tracking call duration
    //   this.startCallDurationTimer(callId)
    // })

    // call.on("call.state.active", () => {
    //   this.updateCallInHistory(callId, {
    //     status: "active",
    //   })

    //   this.notifyCallStatusListeners(callId, "active")

    //   // If not already tracking duration, start now
    //   if (!this.activeCallStartTime) {
    //     this.startCallDurationTimer(callId)
    //   }
    // })

    // call.on("call.state.ended", () => {
    //   const endedAt = new Date()
    //   this.updateCallInHistory(callId, {
    //     status: "ended",
    //     endedAt,
    //   })

    //   this.notifyCallStatusListeners(callId, "ended")

    //   // Stop tracking call duration
    //   this.stopCallDurationTimer()

    //   // Save call to Supabase
    //   this.saveCallToSupabase(callId)
    // })
  }

  private async saveCallToSupabase(callId: string): Promise<void> {
    if (!this.userId) return

    const call = this.getCallById(callId)
    if (!call) return

    try {
      const supabase = getSupabaseBrowserClient()

      await supabase.from("call_history").insert({
        user_id: this.userId,
        call_id: call.id,
        direction: call.direction as "incoming" | "outgoing",
        phone_number: call.number,
        status: call.status,
        duration: call.duration,
        started_at: call.timestamp.toISOString(),
        ended_at: call.endedAt ? call.endedAt.toISOString() : null,
      })
    } catch (error) {
      console.error("Failed to save call to Supabase:", error)
    }
  }

  private startCallDurationTimer(callId: string): void {
    this.activeCallStartTime = new Date()

    // Clear any existing timer
    if (this.activeCallTimer) {
      clearInterval(this.activeCallTimer)
    }

    // Update duration every second
    this.activeCallTimer = setInterval(() => {
      if (this.activeCallStartTime) {
        const duration = Math.floor((new Date().getTime() - this.activeCallStartTime.getTime()) / 1000)
        this.updateCallInHistory(callId, { duration })
      }
    }, 1000)
  }

  private stopCallDurationTimer(): void {
    if (this.activeCallTimer) {
      clearInterval(this.activeCallTimer)
      this.activeCallTimer = null
    }
    this.activeCallStartTime = null
  }

  public async makeCall(destination: string, options: Partial<CallOptions> = {}): Promise<Call | null> {
    try {
      // Set default caller ID if provided and not overridden
      if (this.defaultCallerIdNumber && !options.callerNumber) {
        options.callerNumber = this.defaultCallerIdNumber
      }

      const call = await this.telnyxClient.makeCall(destination, options)

      if (call) {
        // Add to call history
        const callRecord: CallRecord = {
          id: call.id || `call-${Date.now()}`,
          direction: "outgoing",
          number: destination,
          timestamp: new Date(),
          status: "dialing",
          duration: 0,
        }

        this.addCallToHistory(callRecord)

        // Set up call-specific event listeners
        this.setupCallSpecificListeners(call, callRecord.id)
      }

      return call
    } catch (error) {
      console.error("Failed to make call:", error)
      return null
    }
  }

  public async answerCall(): Promise<boolean> {
    try {
      return await this.telnyxClient.answerCall()
    } catch (error) {
      console.error("Failed to answer call:", error)
      return false
    }
  }

  public async rejectCall(): Promise<boolean> {
    try {
      return await this.telnyxClient.rejectCall()
    } catch (error) {
      console.error("Failed to reject call:", error)
      return false
    }
  }

  public async endCall(): Promise<boolean> {
    try {
      return await this.telnyxClient.endCall()
    } catch (error) {
      console.error("Failed to end call:", error)
      return false
    }
  }

  public async toggleMute(mute: boolean): Promise<boolean> {
    try {
      return await this.telnyxClient.toggleMute(mute)
    } catch (error) {
      console.error("Failed to toggle mute:", error)
      return false
    }
  }

  public async sendDTMF(digit: string): Promise<boolean> {
    try {
      return await this.telnyxClient.sendDTMF(digit)
    } catch (error) {
      console.error("Failed to send DTMF:", error)
      return false
    }
  }

  public getCallHistory(): CallRecord[] {
    return [...this.callHistory]
  }

  private addCallToHistory(call: CallRecord): void {
    this.callHistory.unshift(call)
    // Limit history size
    if (this.callHistory.length > 100) {
      this.callHistory = this.callHistory.slice(0, 100)
    }
  }

  private updateCallInHistory(callId: string, updates: Partial<CallRecord>): void {
    const index = this.callHistory.findIndex((call) => call.id === callId)
    if (index !== -1) {
      this.callHistory[index] = {
        ...this.callHistory[index],
        ...updates,
      }
    }
  }

  public onCallStatus(listener: (status: { callId: string; status: string }) => void): () => void {
    this.callStatusListeners.push(listener)
    return () => {
      this.callStatusListeners = this.callStatusListeners.filter((l) => l !== listener)
    }
  }

  private notifyCallStatusListeners(callId: string, status: string): void {
    this.callStatusListeners.forEach((listener) => listener({ callId, status }))
  }

  public getActiveCall(): Call | null {
    return this.telnyxClient.getActiveCall()
  }

  public isInCall(): boolean {
    return this.telnyxClient.getActiveCall() !== null
  }

  public getCallById(callId: string): CallRecord | undefined {
    return this.callHistory.find((call) => call.id === callId)
  }
}

export default CallService
