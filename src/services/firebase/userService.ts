import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@infraFirebase/config';
import { COLLECTIONS } from '@infraFirebase/collections';
import { UserProfile } from '@appTypes/intelligence';
import { sanitizePayload } from '../../utils/firebaseSanitizer';

export const userService = {
  async updateUserProfile(profile: UserProfile) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, profile.id);
      const sanitized = sanitizePayload(profile);
      await setDoc(userRef, sanitized, { merge: true });
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  },

  async updateLocation(userId: string, location: UserProfile['liveLocation']) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const sanitized = sanitizePayload({
        liveLocation: location,
        lastUpdated: Date.now(),
      });
      await updateDoc(userRef, sanitized);
    } catch (error) {
      console.error('Error updating user location:', error);
    }
  }
};
