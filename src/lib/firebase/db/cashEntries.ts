import { ref, set, push, onValue, off, Unsubscribe, query, orderByChild } from "firebase/database";
import { db } from "../../firebase";
import { MatchFinances, ManualCashEntry } from "@/lib/types";

const ENTRIES_PATH = 'manual_cash_entries';

/**
 * Creates or updates a manual cash entry in the Realtime Database.
 * If an entryId is provided, it updates the existing entry.
 * Otherwise, it creates a new one.
 *
 * @param concept - The main concept of the cash entry.
 * @param date - The date of the movement.
 * @param financesData - The detailed financial data for the entry.
 * @param entryId - (Optional) The ID of the entry to update.
 */
export async function saveManualCashEntry(
  concept: string,
  date: Date,
  financesData: MatchFinances,
  entryId?: string
) {
  try {
    const entriesRef = ref(db, ENTRIES_PATH);
    const id = entryId || push(entriesRef).key;
    if (!id) {
      throw new Error("Could not generate a new key for the entry.");
    }
    
    const entryPath = `${ENTRIES_PATH}/${id}`;
    
    const entryData = {
      id,
      type: "manual",
      concept,
      date: date.toISOString(), 
      finances: financesData,
    };

    await set(ref(db, entryPath), entryData);

    return entryData;
  } catch (error) {
    console.error("Error saving manual cash entry:", error);
    throw new Error("Failed to save manual cash entry.");
  }
}

/**
 * Listens for real-time updates to manual cash entries.
 *
 * @param callback - A function to be called with the list of entries whenever they change.
 * @returns An unsubscribe function to stop listening for updates.
 */
export function listenToManualCashEntries(callback: (entries: ManualCashEntry[]) => void): Unsubscribe {
  const entriesRef = query(ref(db, ENTRIES_PATH), orderByChild('date'));

  const listener = onValue(entriesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const entriesArray: ManualCashEntry[] = Object.keys(data)
        .map(key => ({
          ...data[key],
          id: key,
        }))
        .reverse(); // Since we order by date ascending, we reverse to get newest first
      
      callback(entriesArray);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error("Error listening to manual cash entries:", error);
    callback([]);
  });

  return () => off(entriesRef, 'value', listener);
}
