// Script to import Craighouse School events into Firebase
import { addCraighouseSchoolEvents } from '../utils/addCraighouseSchoolEvents';

// Import Firebase configuration to initialize services
import '../config/firebase';

async function main() {
  try {
    console.log('🚀 Starting import of Craighouse School events...');
    await addCraighouseSchoolEvents();
    console.log('✅ Import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the script
main();