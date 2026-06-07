declare module "resend" {
  export class Resend {
    constructor(apiKey: string)
    emails: {
      send(message: {
        from: string
        to: string[]
        subject: string
        text?: string
        html?: string
      }): Promise<{
        data?: {
          id?: string
        } | null
        error?: {
          message?: string | null
        } | null
      }>
    }
  }
}
