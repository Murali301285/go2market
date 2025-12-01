// ========================================
// DATABASE MIGRATION SCRIPT
// Run this in Firebase Console
// ========================================

// STEP 1: Open Firebase Console
// Go to: https://console.firebase.google.com
// Select your project
// Go to Firestore Database
// Open Browser Console (F12)

// ========================================
// MIGRATION 1: Add zipCode to Leads
// ========================================

const migrateLeadsZipCode = async () => {
    console.log('🚀 Starting Lead ZIP Code Migration...');

    const db = firebase.firestore();
    const leadsRef = db.collection('leads');

    try {
        const snapshot = await leadsRef.get();
        console.log(`📊 Found ${snapshot.size} leads to migrate`);

        if (snapshot.size === 0) {
            console.log('✅ No leads to migrate');
            return;
        }

        const batch = db.batch();
        let count = 0;

        snapshot.docs.forEach(doc => {
            const data = doc.data();

            // Only update if zipCode doesn't exist
            if (!data.zipCode) {
                batch.update(doc.ref, {
                    zipCode: '000000', // Placeholder - update manually later
                    googlePlaceId: null // Optional field for future use
                });
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`✅ Successfully migrated ${count} leads`);
            console.log('⚠️  Please update ZIP codes manually for existing leads');
        } else {
            console.log('✅ All leads already have zipCode field');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
};

// ========================================
// MIGRATION 2: Add stage to Leads
// ========================================

const migrateLeadsStage = async () => {
    console.log('🚀 Starting Lead Stage Migration...');

    const db = firebase.firestore();
    const leadsRef = db.collection('leads');

    try {
        const snapshot = await leadsRef.get();
        console.log(`📊 Found ${snapshot.size} leads to migrate`);

        if (snapshot.size === 0) {
            console.log('✅ No leads to migrate');
            return;
        }

        const batch = db.batch();
        let count = 0;

        snapshot.docs.forEach(doc => {
            const data = doc.data();

            // Only update if stage doesn't exist
            if (!data.stage) {
                let stage = 'NEW'; // Default

                // Set stage based on status
                if (data.status === 'CONVERTED') {
                    stage = 'CONVERTED';
                } else if (data.status === 'CANCELLED') {
                    stage = 'CANCELLED';
                }

                batch.update(doc.ref, { stage });
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`✅ Successfully migrated ${count} leads with stage field`);
        } else {
            console.log('✅ All leads already have stage field');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
};

// ========================================
// MIGRATION 3: Add isActive & remarks to Regions
// ========================================

const migrateRegions = async () => {
    console.log('🚀 Starting Region Migration...');

    const db = firebase.firestore();
    const regionsRef = db.collection('regions');

    try {
        const snapshot = await regionsRef.get();
        console.log(`📊 Found ${snapshot.size} regions to migrate`);

        if (snapshot.size === 0) {
            console.log('✅ No regions to migrate');
            return;
        }

        const batch = db.batch();
        let count = 0;

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const updates = {};

            // Add isActive if doesn't exist
            if (data.isActive === undefined) {
                updates.isActive = true; // Default to active
            }

            // Add remarks if doesn't exist
            if (data.remarks === undefined) {
                updates.remarks = '';
            }

            if (Object.keys(updates).length > 0) {
                batch.update(doc.ref, updates);
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`✅ Successfully migrated ${count} regions`);
        } else {
            console.log('✅ All regions already have required fields');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
};

// ========================================
// RUN ALL MIGRATIONS
// ========================================

const runAllMigrations = async () => {
    console.log('🎯 Starting All Migrations...\n');

    try {
        await migrateLeadsZipCode();
        console.log('\n');

        await migrateLeadsStage();
        console.log('\n');

        await migrateRegions();
        console.log('\n');

        console.log('🎉 All migrations completed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Update ZIP codes for existing leads (currently set to 000000)');
        console.log('2. Review and update Firestore security rules');
        console.log('3. Test all features thoroughly');

    } catch (error) {
        console.error('❌ Migration process failed:', error);
    }
};

// ========================================
// EXECUTE
// ========================================

// Run all migrations at once
runAllMigrations();

// OR run individually:
// migrateLeadsZipCode();
// migrateLeadsStage();
// migrateRegions();
