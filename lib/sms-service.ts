// This service handles SMS functionality using the Telnyx API

class SMSService {
  private static instance: SMSService
  private apiKey: string | null = null
  private messagingProfileId: string | null = null
  private defaultFromNumber: string | null = null

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService()
    }
    return SMSService.instance
  }

  public initialize(config: {
    apiKey: string
    messagingProfileId: string
    defaultFromNumber?: string
  }): void {
    this.apiKey = config.apiKey
    this.messagingProfileId = config.messagingProfileId
    this.defaultFromNumber = config.defaultFromNumber || "+15815080022"

  }

  public async sendSMS(to: string, text: string, from?: string): Promise<any> {
    if (!this.apiKey || !this.messagingProfileId) {
      throw new Error("SMS service not initialized")
    }

    const fromNumber = from || this.defaultFromNumber
    if (!fromNumber && !this.messagingProfileId) {
      throw new Error("From number or messaging profile ID is required")
    }

    try {
      const response = await fetch("https://api.telnyx.com/v2/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: "+15815080022",
          to: to,
          text: text,
          messaging_profile_id: this.messagingProfileId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to send SMS: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Failed to send SMS:", error)
      throw error
    }
  }

  public async getSMSHistory(filter?: {
    pageSize?: number
    pageNumber?: number
    from?: string
    to?: string
    startTime?: string
    endTime?: string
  }): Promise<any> {
    if (!this.apiKey) {
      throw new Error("SMS service not initialized")
    }

    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (filter?.pageSize) params.append("page[size]", filter.pageSize.toString())
      if (filter?.pageNumber) params.append("page[number]", filter.pageNumber.toString())
      if (filter?.from) params.append("filter[from][contains]", filter.from)
      if (filter?.to) params.append("filter[to][contains]", filter.to)
      if (filter?.startTime) params.append("filter[time_created][gte]", filter.startTime)
      if (filter?.endTime) params.append("filter[time_created][lte]", filter.endTime)

      // const response = await fetch(`https://api.telnyx.com/v2/messages?${params.toString()}`, {
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${this.apiKey}`,
      //   },
      // })

      // if (!response.ok) {
      //   const errorData = await response.json()
      //   throw new Error(`Failed to get SMS history: ${JSON.stringify(errorData)}`)
      // }

      // const data = await response.json()
      return {data: []}
    } catch (error) {
      console.error("Failed to get SMS history:", error)
      throw error
    }
  }
}

export default SMSService
