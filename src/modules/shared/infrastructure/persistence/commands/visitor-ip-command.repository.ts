import { VisitorIpRepository, VisitorIpMeta } from '../../../domain/repositories/visitor-ip.repository.interface';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Firestore implementation for VisitorIpRepository.
 * Assumes Firebase Admin SDK is initialized elsewhere in the application.
 */
export class FirestoreVisitorIpRepository implements VisitorIpRepository {
  private db = getFirestore();

  /**
   * Saves the visitor's IP address and optional metadata to Firestore.
   * @param ip The visitor's IP address.
   * @param meta Optional metadata to store alongside the IP.
   */
  async saveVisitorIp(ip: string, meta: VisitorIpMeta = {}): Promise<void> {
    try {
      const docRef = this.db.collection('visitor_ips').doc(); // Firestore will auto-generate an ID
      await docRef.set({
        ip,
        ...meta,
        createdAt: new Date(), // Consider using FieldValue.serverTimestamp() for server-side timestamp
      });
      // console.log(`Visitor IP ${ip} saved to Firestore with ID: ${docRef.id}`);
    } catch (error) {
      console.error('Error saving visitor IP to Firestore:', error);
      // Propagate the error to be handled by the application layer or a global error handler.
      // Consider wrapping in a custom InfrastructureException if your error handling strategy requires it.
      throw error;
    }
  }
}
