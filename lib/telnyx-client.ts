// The correct import for the Telnyx WebRTC SDK
import { TelnyxRTC } from "@telnyx/webrtc"
import type { Call, CallOptions } from "@telnyx/webrtc"

// Telnyx WebRTC client implementation based on the official demo
class TelnyxClient {
  private static instance: TelnyxClient
  private client: TelnyxRTC | null = null
  private activeCall: Call | null = null
  private isInitialized = false
  private callListeners: Array<(call: Call) => void> = []
  private messageListeners: Array<(message: any) => void> = []
  private socketListeners: Array<(status: string) => void> = []
  private sipCredentials: { username: string; password: string } | null = null

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): TelnyxClient {
    if (!TelnyxClient.instance) {
      TelnyxClient.instance = new TelnyxClient()
    }
    return TelnyxClient.instance
  }

  public async initialize(credentials: {
    sipUsername: string
    sipPassword: string
    ringtone?: string
    ringbacktone?: string
  }): Promise<boolean> {
    try {
      this.sipCredentials = {
        username: credentials.sipUsername,
        password: credentials.sipPassword,
      }

      // Initialize the Telnyx WebRTC client with SIP credentials
      this.client = new TelnyxRTC({
        // Use SIP credentials instead of login_token
        login: credentials.sipUsername,
        password: credentials.sipPassword,
        ringtoneFile: credentials.ringtone,
        ringbackFile: credentials.ringbacktone,
        debug: true,
      })

      // Set up event listeners
      this.setupEventListeners()

      // Connect to Telnyx
      await this.client.connect()

      this.isInitialized = true
      return true
    } catch (error) {
      console.error("Failed to initialize Telnyx client:", error)
      return false
    }
  }

  private setupEventListeners() {
    if (!this.client) return

    // Socket connection events
    this.client.on("socket:connected", () => {
      console.log("Connected to Telnyx")
      this.notifySocketListeners("connected")
    })

    this.client.on("socket:disconnected", () => {
      console.log("Disconnected from Telnyx")
      this.notifySocketListeners("disconnected")
    })

    // Client ready event
    this.client.on("telnyx.ready", () => {
      console.log("Telnyx client is ready")
      this.notifySocketListeners("ready")
    })

    // Error events
    this.client.on("telnyx.error", (error) => {
      console.error("Telnyx error:", error)
    })

    // Call events
    this.client.on("telnyx.notification", (notification) => {
      console.log("Received notification:", notification)
    })

    // Incoming call event
    this.client.on("call.received", (call) => {
      console.log("Incoming call received:", call)
      this.activeCall = call
      this.setupCallEventListeners(call)
      this.notifyCallListeners(call)
    })

    // Call created event (for outgoing calls)
    this.client.on("call.created", (call) => {
      console.log("Call created:", call)
      this.activeCall = call
      this.setupCallEventListeners(call)
    })

    // SMS events - Note: WebRTC SDK doesn't directly handle SMS
    // We'll implement SMS separately using the REST API
  }

  private setupCallEventListeners(call: Call) {
    // Call state events
    // call.on("call.state.connecting", (event) => {
    //   console.log("Call connecting:", event)
    // })

    // call.on("call.state.ringing", (event) => {
    //   console.log("Call ringing:", event)
    // })

    // call.on("call.state.answered", (event) => {
    //   console.log("Call answered:", event)
    // })

    // call.on("call.state.active", (event) => {
    //   console.log("Call active:", event)
    // })

    // call.on("call.state.ended", (event) => {
    //   console.log("Call ended:", event)
    //   this.activeCall = null
    // })

    // // Media events
    // call.on("call.audio.start", (event) => {
    //   console.log("Audio started:", event)
    // })

    // call.on("call.audio.stop", (event) => {
    //   console.log("Audio stopped:", event)
    // })

    // // DTMF events
    // call.on("call.dtmf", (event) => {
    //   console.log("DTMF received:", event)
    // })
  }

  public async makeCall(destination: string, options: Partial<CallOptions> = {}): Promise<Call | null> {
    if (!this.isInitialized || !this.client) {
      throw new Error("Telnyx client not initialized")
    }

    try {
      // Make a call using the Telnyx client
      const callOptions: CallOptions = {
        destinationNumber: destination,
        callerName: options.callerName || "Telnyx WebRTC",
        callerNumber: options.callerNumber || "+15815080022",
        audio: true,
        video: false,
        ...options,
      }

      const call = await this.client.newCall(callOptions)
      this.activeCall = call
      this.setupCallEventListeners(call)

      return call
    } catch (error) {
      console.error("Failed to make call:", error)
      return null
    }
  }

  public async answerCall(): Promise<boolean> {
    if (!this.activeCall) {
      console.error("No active call to answer")
      return false
    }

    try {
      await this.activeCall.answer()
      return true
    } catch (error) {
      console.error("Failed to answer call:", error)
      return false
    }
  }

  public async rejectCall(): Promise<boolean> {
    if (!this.activeCall) {
      console.error("No active call to reject")
      return false
    }

    try {
      await this.activeCall.reject()
      this.activeCall = null
      return true
    } catch (error) {
      console.error("Failed to reject call:", error)
      return false
    }
  }

  public async endCall(): Promise<boolean> {
    if (!this.activeCall) {
      console.error("No active call to end")
      return false
    }

    try {
      await this.activeCall.hangup()
      this.activeCall = null
      return true
    } catch (error) {
      console.error("Failed to end call:", error)
      return false
    }
  }

  public async toggleMute(mute: boolean): Promise<boolean> {
    if (!this.activeCall) {
      console.error("No active call to mute/unmute")
      return false
    }

    try {
      if (mute) {
        await this.activeCall.mute()
      } else {
        await this.activeCall.unmute()
      }
      return true
    } catch (error) {
      console.error("Failed to toggle mute:", error)
      return false
    }
  }

  public async sendDTMF(digit: string): Promise<boolean> {
    if (!this.activeCall) {
      console.error("No active call to send DTMF")
      return false
    }

    try {
      await this.activeCall.dtmf(digit)
      return true
    } catch (error) {
      console.error("Failed to send DTMF:", error)
      return false
    }
  }

  public onIncomingCall(listener: (call: Call) => void): () => void {
    this.callListeners.push(listener)
    return () => {
      this.callListeners = this.callListeners.filter((l) => l !== listener)
    }
  }

  public onSocketStatus(listener: (status: string) => void): () => void {
    this.socketListeners.push(listener)
    return () => {
      this.socketListeners = this.socketListeners.filter((l) => l !== listener)
    }
  }

  private notifyCallListeners(call: Call): void {
    this.callListeners.forEach((listener) => listener(call))
  }

  private notifySocketListeners(status: string): void {
    this.socketListeners.forEach((listener) => listener(status))
  }

  public getClient(): TelnyxRTC | null {
    return this.client
  }

  public getActiveCall(): Call | null {
    return this.activeCall
  }

  public isConnected(): boolean {
    return this.isInitialized && this.client !== null
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      if (this.activeCall) {
        try {
          await this.activeCall.hangup()
        } catch (error) {
          console.error("Error hanging up active call during disconnect:", error)
        }
        this.activeCall = null
      }

      // Clean up event listeners
      this.callListeners = []
      this.messageListeners = []
      this.socketListeners = []

      await this.client.disconnect()
      this.client = null
      this.isInitialized = false
    }
  }

  public async reconnect(): Promise<boolean> {
    if (!this.sipCredentials) {
      console.error("Cannot reconnect: No SIP credentials available")
      return false
    }

    try {
      await this.disconnect()
      return await this.initialize({
        sipUsername: this.sipCredentials.username,
        sipPassword: this.sipCredentials.password,
      })
    } catch (error) {
      console.error("Failed to reconnect:", error)
      return false
    }
  }
}

export default TelnyxClient