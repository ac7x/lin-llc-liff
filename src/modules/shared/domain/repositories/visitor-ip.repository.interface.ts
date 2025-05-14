export interface VisitorIpMeta {
  userAgent?: string;
  referrer?: string;
  [key: string]: unknown;
}

export interface VisitorIpRepository {
  saveVisitorIp(ip: string, meta?: VisitorIpMeta): Promise<void>;
}
