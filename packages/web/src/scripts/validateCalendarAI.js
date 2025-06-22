// AI Calendar Validation Script
// Validates that AI receives correct date data and responds accurately

const validateCalendarAI = async () => {
  console.log('🔍 AI CALENDAR VALIDATION STARTING...');
  
  try {
    // Test the entire data pipeline
    console.log('\n📊 TESTING DATA PIPELINE...');
    
    // 1. Check Firebase Data
    const { getFirebaseServices } = await import('../../config/firebase.js');
    const { collection, getDocs } = await import('firebase/firestore');
    
    const { db } = getFirebaseServices();
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    
    console.log('✅ Step 1: Firebase Connection - SUCCESS');
    console.log(`Found ${eventsSnapshot.docs.length} events in database`);
    
    // Check canonical events
    const canonicalEvents = {
      'holiday': { expectedDate: 'Monday, June 23, 2025', expectedTime: 'All day' },
      'prekinder': { expectedDate: 'Tuesday, June 24, 2025', expectedTime: '8:30-9:30 AM' },
      'year-1-4': { expectedDate: 'Wednesday, July 2, 2025', expectedTime: '8:30-9:30 AM' }
    };
    
    const foundEvents = {};
    eventsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const title = data.title.toLowerCase();
      const startDate = data.startDate?.toDate?.() || new Date(data.startDate);
      
      if (title.includes('holiday')) {
        foundEvents.holiday = {
          title: data.title,
          date: startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          time: data.allDay ? 'All day' : startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      } else if (title.includes('prekinder')) {
        foundEvents.prekinder = {
          title: data.title,
          date: startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          time: data.allDay ? 'All day' : startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      } else if (title.includes('year') && (title.includes('1') || title.includes('2') || title.includes('3') || title.includes('4'))) {
        foundEvents['year-1-4'] = {
          title: data.title,
          date: startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          time: data.allDay ? 'All day' : startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      }
    });
    
    console.log('\n📋 DATABASE VALIDATION:');
    let dbErrors = 0;
    Object.keys(canonicalEvents).forEach(key => {
      const expected = canonicalEvents[key];
      const found = foundEvents[key];
      
      if (!found) {
        console.log(`❌ ${key}: MISSING from database`);
        dbErrors++;
      } else {
        const dateMatch = found.date === expected.expectedDate;
        const timeMatch = found.time === expected.expectedTime;
        
        if (dateMatch && timeMatch) {
          console.log(`✅ ${key}: CORRECT (${found.date}, ${found.time})`);
        } else {
          console.log(`❌ ${key}: INCORRECT`);
          console.log(`   Expected: ${expected.expectedDate}, ${expected.expectedTime}`);
          console.log(`   Found: ${found.date}, ${found.time}`);
          dbErrors++;
        }
      }
    });
    
    // 2. Test Data Aggregation Service
    console.log('\n🔄 TESTING DATA AGGREGATION...');
    try {
      const { getRealTimeRefreshService } = await import('@famapp/shared');
      const refreshService = getRealTimeRefreshService();
      const familyData = await refreshService.getFamilyData();
      
      if (familyData) {
        console.log('✅ Step 2: Data Aggregation - SUCCESS');
        console.log(`Aggregated ${familyData.events.totalCount} events`);
        
        // Check if key events are properly aggregated
        const upcomingEvents = familyData.events.upcoming.filter(event => {
          const title = event.title.toLowerCase();
          return title.includes('holiday') || title.includes('prekinder') || 
                 (title.includes('year') && (title.includes('1') || title.includes('2') || title.includes('3') || title.includes('4')));
        });
        
        console.log(`Found ${upcomingEvents.length} key school events in aggregated data`);
      } else {
        console.log('❌ Step 2: Data Aggregation - FAILED');
        return;
      }
    } catch (error) {
      console.log('❌ Step 2: Data Aggregation - ERROR:', error.message);
      return;
    }
    
    // 3. Test AI Service
    console.log('\n🤖 TESTING AI SERVICE...');
    try {
      const { getAIService } = await import('@famapp/shared');
      const aiService = getAIService();
      
      if (aiService) {
        console.log('✅ Step 3: AI Service Connection - SUCCESS');
        
        // Test health check
        const isHealthy = await aiService.healthCheck();
        if (isHealthy) {
          console.log('✅ Step 3: AI Health Check - SUCCESS');
          
          // Generate a test summary
          const testSummary = await aiService.generateFamilySummary(familyData);
          if (testSummary) {
            console.log('✅ Step 3: AI Summary Generation - SUCCESS');
            
            // Validate AI response contains correct dates
            const aiContent = testSummary.content.toLowerCase();
            let aiErrors = 0;
            
            console.log('\n🔍 AI RESPONSE VALIDATION:');
            
            // Check for canonical dates in AI response
            if (aiContent.includes('monday, june 23, 2025') || aiContent.includes('june 23')) {
              console.log('✅ Holiday date: Mentioned correctly');
            } else {
              console.log('❌ Holiday date: Not found or incorrect');
              aiErrors++;
            }
            
            if (aiContent.includes('tuesday, june 24, 2025') || (aiContent.includes('june 24') && aiContent.includes('8:30'))) {
              console.log('✅ Prekinder meeting: Mentioned correctly');
            } else {
              console.log('❌ Prekinder meeting: Not found or incorrect');
              aiErrors++;
            }
            
            if (aiContent.includes('wednesday, july 2, 2025') || (aiContent.includes('july 2') && aiContent.includes('8:30'))) {
              console.log('✅ Year 1-4 meeting: Mentioned correctly');
            } else {
              console.log('❌ Year 1-4 meeting: Not found or incorrect');
              aiErrors++;
            }
            
            // Check for wrong dates that should NOT appear
            const wrongDates = ['june 26', 'thursday june', 'july 3', 'thursday july', '17:30', '18:30'];
            wrongDates.forEach(wrongDate => {
              if (aiContent.includes(wrongDate)) {
                console.log(`❌ Found incorrect date/time: ${wrongDate}`);
                aiErrors++;
              }
            });
            
            console.log(`\n📊 FULL AI RESPONSE PREVIEW:`);
            console.log(testSummary.content.substring(0, 500) + '...');
            
            // Final validation summary
            console.log('\n🏁 VALIDATION SUMMARY:');
            console.log(`Database Errors: ${dbErrors}`);
            console.log(`AI Response Errors: ${aiErrors}`);
            
            if (dbErrors === 0 && aiErrors === 0) {
              console.log('🎉 PERFECT! All calendar data is consistent and AI is responding correctly!');
            } else {
              console.log('⚠️ Issues found. Recommendations:');
              if (dbErrors > 0) {
                console.log('  1. Run: window.fixCalendarEventsCompletely()');
              }
              if (aiErrors > 0) {
                console.log('  2. Clear cache and test again');
                console.log('  3. Check AI prompt enhancement is working');
              }
            }
            
          } else {
            console.log('❌ Step 3: AI Summary Generation - FAILED');
          }
        } else {
          console.log('❌ Step 3: AI Health Check - FAILED');
        }
      } else {
        console.log('❌ Step 3: AI Service Connection - FAILED');
      }
    } catch (error) {
      console.log('❌ Step 3: AI Service - ERROR:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  }
};

// Make function globally available
window.validateCalendarAI = validateCalendarAI;

console.log('🔧 AI Calendar validation script loaded. Run: window.validateCalendarAI()');