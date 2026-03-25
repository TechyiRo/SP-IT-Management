/**
 * Migration Script: Apply new attendance logic to existing records
 *
 * Rules applied:
 *  1. Check-In NOT approved + no valid Leave/HalfDay → status = 'Absent'
 *  2. Both Check-In & Check-Out approved:
 *       duration <= 240 min  → 'Half Day'
 *       duration >  480 min  → 'Over Work'
 *       else                 → 'Checked-Out'
 *
 * Run once: node scripts/migrateAttendance.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Attendance = require('../models/Attendance');

const HALF_DAY_MAX = 240;  // 4 hours in minutes
const OVER_WORK_MIN = 480; // 8 hours in minutes

async function migrate() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const records = await Attendance.find({});
    console.log(`📦 Total records found: ${records.length}`);

    let updatedAbsent = 0;
    let updatedHalfDay = 0;
    let updatedOverWork = 0;
    let updatedCheckedOut = 0;
    let skipped = 0;

    for (const record of records) {
        let changed = false;
        const originalStatus = record.status;

        const checkInApproved = record.checkIn?.status === 'Approved';
        const checkOutApproved = record.checkOut?.status === 'Approved';
        const hasApprovedLeave = record.leave?.isRequested && record.leave?.status === 'Approved';
        const hasApprovedHalfDay = record.halfDay?.isRequested && record.halfDay?.status === 'Approved';

        // ─── Rule 1: No valid check-in → Absent ───────────────────────────────
        if (!checkInApproved && !hasApprovedLeave && !hasApprovedHalfDay) {
            // Skip already-correct statuses to avoid unnecessary writes
            if (record.status !== 'Absent' &&
                record.status !== 'Forgot Check-Out' &&
                !record.status.includes('Pending')) {
                record.status = 'Absent';
                changed = true;
                updatedAbsent++;
            }
        }

        // ─── Rule 2: Both in & out approved → recalculate duration & status ───
        if (checkInApproved && checkOutApproved && record.checkIn.time && record.checkOut.time) {
            const diff = Math.abs(new Date(record.checkOut.time) - new Date(record.checkIn.time));
            const durationMin = Math.floor((diff / 1000) / 60);

            // Always recalculate duration
            if (record.duration !== durationMin) {
                record.duration = durationMin;
                changed = true;
            }

            let newStatus;
            if (durationMin <= HALF_DAY_MAX) {
                newStatus = 'Half Day';
            } else if (durationMin > OVER_WORK_MIN) {
                newStatus = 'Over Work';
            } else {
                newStatus = 'Checked-Out';
            }

            if (record.status !== newStatus) {
                record.status = newStatus;
                changed = true;

                if (newStatus === 'Half Day') updatedHalfDay++;
                else if (newStatus === 'Over Work') updatedOverWork++;
                else updatedCheckedOut++;
            }
        }

        if (changed) {
            await record.save();
            console.log(`  → [${record._id}] ${originalStatus} → ${record.status} (${record.duration ?? 0} min)`);
        } else {
            skipped++;
        }
    }

    console.log('\n══════════════════════════════════════════');
    console.log('✅ Migration Complete!');
    console.log(`   🔴 Marked Absent   : ${updatedAbsent}`);
    console.log(`   🌓 Marked Half Day : ${updatedHalfDay}`);
    console.log(`   🔥 Marked Over Work: ${updatedOverWork}`);
    console.log(`   ✅ Marked Checked-Out: ${updatedCheckedOut}`);
    console.log(`   ⏭️  Skipped (no change): ${skipped}`);
    console.log('══════════════════════════════════════════\n');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    mongoose.disconnect();
    process.exit(1);
});
