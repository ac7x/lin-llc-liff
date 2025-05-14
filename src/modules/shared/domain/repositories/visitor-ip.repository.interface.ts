export interface VisitorIpRepository {
  saveVisitorIp(ip: string, meta?: Record<string, any>): Promise<void>;
}
