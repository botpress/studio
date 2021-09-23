export class RealTimePayload {
  readonly eventName: string
  readonly payload: any

  constructor(eventName: string, payload: any) {
    this.eventName = eventName.toLowerCase()
    this.payload = payload
  }

  public static forAdmins(eventName: string, payload: any): RealTimePayload {
    return new RealTimePayload(eventName, payload)
  }
}
