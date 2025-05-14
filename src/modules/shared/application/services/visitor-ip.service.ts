import { VisitorIpRepository, VisitorIpMeta } from '../../domain/repositories/visitor-ip.repository.interface';

/**
 * Application service for managing visitor IP operations.
 */
export class VisitorIpService {
  constructor(private readonly visitorIpRepository: VisitorIpRepository) {}

  /**
   * Records a visitor's IP address.
   * @param ip The visitor's IP address.
   * @param meta Optional metadata associated with the visit.
   */
  async recordVisitorIp(ip: string, meta?: VisitorIpMeta): Promise<void> {
    if (!ip || ip.trim() === '') {
      // Basic validation at the application service layer.
      // More complex validation could be handled by a dedicated validator or within the domain if IP is a Value Object.
      throw new Error('Visitor IP address cannot be null or empty.');
    }

    try {
      await this.visitorIpRepository.saveVisitorIp(ip, meta);
      // console.log(`Visitor IP ${ip} recorded successfully via VisitorIpService.`);
    } catch (error) {
      console.error(`Error recording visitor IP ${ip} in VisitorIpService:`, error);
      // Handle or re-throw error. Application services might log, transform, or wrap errors.
      // For example, throw new ApplicationException('Failed to record visitor IP', { cause: error });
      throw error;
    }
  }
}
