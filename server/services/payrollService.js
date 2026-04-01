const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');

/**
 * calculatePayrollData
 * Calculates payroll details for a user for a specific month and year.
 */
const calculatePayrollData = async (userId, month, year) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const m = parseInt(month);
    const y = parseInt(year);

    const baseSalary = user.baseSalary || 0;
    const totalDaysInMonth = new Date(y, m, 0).getDate();

    // Sundays calculation
    let sundayCount = 0;
    for (let i = 1; i <= totalDaysInMonth; i++) {
        const date = new Date(y, m - 1, i);
        if (date.getDay() === 0) sundayCount++;
    }

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const records = await Attendance.find({
        employee: userId,
        date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const manualHolidays = records.filter(r => r.status === 'Holiday' && new Date(r.date).getDay() !== 0).length;
    const totalHolidays = sundayCount + manualHolidays;
    const workingDaysInMonth = totalDaysInMonth - totalHolidays;
    
    // Calculation rates
    const dailyRate = workingDaysInMonth > 0 ? (baseSalary / workingDaysInMonth) : 0;
    const perMinuteRate = dailyRate / (8 * 60);

    let totalPayCuts = 0;
    let totalOvertimePay = 0;
    let totalHours = 0;
    let presentDays = 0;
    const breakdown = [];

    for (let i = 1; i <= totalDaysInMonth; i++) {
        const currentDate = new Date(y, m - 1, i);
        const isSunday = currentDate.getDay() === 0;
        const record = records.find(r => new Date(r.date).getDate() === i);
        let isHoliday = isSunday || (record && record.status === 'Holiday');

        let dailyEarned = 0;
        let cutAmount = 0;
        let overtimePay = 0;
        let hoursWorked = 0;
        let status = record ? record.status : (isHoliday ? 'Holiday' : 'Absent');

        // Main calculation logic
        if (record && record.duration > 0) {
            hoursWorked = record.duration / 60;
            if (isHoliday) {
                overtimePay = record.duration * perMinuteRate;
                dailyEarned = overtimePay;
                totalOvertimePay += overtimePay;
                totalHours += hoursWorked;
                presentDays++;
            } else {
                if (record.duration >= 480) { 
                    dailyEarned = dailyRate;
                    totalHours += hoursWorked;
                    presentDays++;
                    if (record.duration > 480) {
                        const extraMins = record.duration - 480;
                        const extraPay = extraMins * perMinuteRate;
                        overtimePay = extraPay;
                        dailyEarned += extraPay;
                        totalOvertimePay += extraPay;
                    }
                } else {
                    const workedPay = record.duration * perMinuteRate;
                    cutAmount = dailyRate - workedPay;
                    dailyEarned = workedPay;
                    totalPayCuts += cutAmount;
                    totalHours += hoursWorked;
                    presentDays++;
                }
            }
        } else {
            if (!isHoliday) {
                if (status === 'Half Day') {
                    hoursWorked = 4;
                    const workedPay = (4 * 60) * perMinuteRate;
                    cutAmount = dailyRate - workedPay;
                    dailyEarned = workedPay;
                    totalPayCuts += cutAmount;
                    totalHours += hoursWorked;
                    presentDays += 0.5;
                } else if (status === 'Absent' || status === 'On Leave' || status.includes('Pending') || status === 'Forgot Check-Out') {
                    cutAmount = dailyRate;
                    totalPayCuts += cutAmount;
                }
            }
        }

        breakdown.push({
            date: currentDate,
            status: status,
            checkIn: record?.checkIn?.time,
            checkOut: record?.checkOut?.time,
            hours: Math.round(hoursWorked * 100) / 100,
            dailyPay: Math.round(dailyEarned),
            cutAmount: Math.round(cutAmount),
            overtimePay: Math.round(overtimePay)
        });
    }

    const netSalary = Math.round(baseSalary - totalPayCuts + totalOvertimePay);

    return {
        user: { id: user._id, name: user.fullName, baseSalary, designation: user.designation },
        summary: {
            totalDays: totalDaysInMonth,
            workingDays: workingDaysInMonth,
            holidays: totalHolidays,
            presentDays: presentDays,
            totalHours: totalHours.toFixed(2),
            dailyRate: Math.round(dailyRate),
            totalCuts: Math.round(totalPayCuts),
            totalOvertimePay: Math.round(totalOvertimePay),
            netSalary: netSalary
        },
        breakdown
    };
};

/**
 * syncPayrollWithAttendance
 * Auto-updates draft payroll if attendance changes
 */
const syncPayrollWithAttendance = async (userId, date) => {
    const d = new Date(date);
    // Payroll model stores month and year as strings (e.g. "01", "2026")
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString();

    try {
        const payroll = await Payroll.findOne({ employee: userId, month, year });
        
        // Only auto-update if it's in Draft status
        if (payroll && payroll.status === 'Draft') {
            const data = await calculatePayrollData(userId, month, year);
            const earnedAmount = data.summary.netSalary;
            
            payroll.baseSalary = data.user.baseSalary;
            payroll.hourlyRate = Math.round(data.summary.dailyRate / 8);
            payroll.totalHours = data.summary.totalHours;
            payroll.presentDays = data.summary.presentDays;
            payroll.totalDays = data.summary.totalDays;
            payroll.calculatedWithHours = earnedAmount;
            
            // Recalculate net salary with existing bonus/deductions
            payroll.netSalary = Math.round(earnedAmount + (payroll.bonus || 0) - (payroll.deductions || 0));
            payroll.generatedAt = Date.now();
            
            await payroll.save();
            console.log(`[PayrollSync] Auto-updated draft payroll for ${userId} for ${month}/${year}`);
        }
    } catch (err) {
        console.error(`[PayrollSync] Failed to sync: ${err.message}`);
    }
};

module.exports = {
    calculatePayrollData,
    syncPayrollWithAttendance
};
