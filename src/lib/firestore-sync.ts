import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type {
  Customer,
  Document,
  Product,
  ExpenseReport,
  AppSettings,
  DocumentTemplate,
  Memo,
  ExpenseSplit,
} from '../types';

// Collection names
const COLLECTIONS = {
  CUSTOMERS: 'customers',
  DOCUMENTS: 'documents',
  PRODUCTS: 'products',
  EXPENSE_REPORTS: 'expenseReports',
  SETTINGS: 'settings',
  TEMPLATES: 'templates',
  MEMOS: 'memos',
  EXPENSE_SPLITS: 'expenseSplits',
  METADATA: 'metadata',
} as const;

// Data structure for the entire app state
export interface CloudData {
  customers: Customer[];
  documents: Document[];
  products: Product[];
  expenseReports: ExpenseReport[];
  settings: AppSettings;
  templates: DocumentTemplate[];
  memos: Memo[];
  expenseSplits: ExpenseSplit[];
  lastUpdated: string;
}

// Check if cloud sync is available
export const isCloudSyncAvailable = (): boolean => {
  return isFirebaseConfigured() && db !== null;
};

// Save all data to Firestore (single document approach for simplicity)
export const saveToCloud = async (data: Omit<CloudData, 'lastUpdated'>): Promise<void> => {
  if (!isCloudSyncAvailable() || !db) {
    console.log('Cloud sync not available, skipping save');
    return;
  }

  try {
    const docRef = doc(db, COLLECTIONS.METADATA, 'appData');
    await setDoc(docRef, {
      ...data,
      lastUpdated: serverTimestamp(),
    });
    console.log('Data saved to cloud');
  } catch (error) {
    console.error('Error saving to cloud:', error);
    throw error;
  }
};

// Load all data from Firestore
export const loadFromCloud = async (): Promise<CloudData | null> => {
  if (!isCloudSyncAvailable() || !db) {
    console.log('Cloud sync not available, skipping load');
    return null;
  }

  try {
    const docRef = doc(db, COLLECTIONS.METADATA, 'appData');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Data loaded from cloud');
      return {
        customers: data.customers || [],
        documents: data.documents || [],
        products: data.products || [],
        expenseReports: data.expenseReports || [],
        settings: data.settings || null,
        templates: data.templates || [],
        memos: data.memos || [],
        expenseSplits: data.expenseSplits || [],
        lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }

    console.log('No cloud data found');
    return null;
  } catch (error) {
    console.error('Error loading from cloud:', error);
    throw error;
  }
};

// Subscribe to real-time updates
export const subscribeToCloudUpdates = (
  onUpdate: (data: CloudData) => void,
  onError?: (error: Error) => void
): Unsubscribe | null => {
  if (!isCloudSyncAvailable() || !db) {
    console.log('Cloud sync not available, skipping subscription');
    return null;
  }

  const docRef = doc(db, COLLECTIONS.METADATA, 'appData');

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          customers: data.customers || [],
          documents: data.documents || [],
          products: data.products || [],
          expenseReports: data.expenseReports || [],
          settings: data.settings || null,
          templates: data.templates || [],
          memos: data.memos || [],
          expenseSplits: data.expenseSplits || [],
          lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      }
    },
    (error) => {
      console.error('Cloud subscription error:', error);
      onError?.(error);
    }
  );
};

// Batch save for multiple collections (alternative approach)
export const batchSaveToCloud = async (
  updates: Partial<Omit<CloudData, 'lastUpdated'>>
): Promise<void> => {
  if (!isCloudSyncAvailable() || !db) {
    return;
  }

  try {
    const batch = writeBatch(db);
    const docRef = doc(db, COLLECTIONS.METADATA, 'appData');

    // Get current data first
    const currentSnap = await getDoc(docRef);
    const currentData = currentSnap.exists() ? currentSnap.data() : {};

    // Merge updates
    batch.set(docRef, {
      ...currentData,
      ...updates,
      lastUpdated: serverTimestamp(),
    });

    await batch.commit();
    console.log('Batch save completed');
  } catch (error) {
    console.error('Batch save error:', error);
    throw error;
  }
};

// Sync status
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

// Create a debounced save function
export const createDebouncedSave = (delayMs: number = 1000) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingData: Omit<CloudData, 'lastUpdated'> | null = null;

  return {
    save: (data: Omit<CloudData, 'lastUpdated'>) => {
      pendingData = data;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        if (pendingData) {
          try {
            await saveToCloud(pendingData);
          } catch (error) {
            console.error('Debounced save failed:', error);
          }
        }
        timeoutId = null;
      }, delayMs);
    },
    flush: async () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (pendingData) {
        await saveToCloud(pendingData);
        pendingData = null;
      }
    },
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingData = null;
    },
  };
};
