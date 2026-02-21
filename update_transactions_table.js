const { pool } = require('./config/database');

async function updateTransactionsTable() {
    try {
        console.log('🔧 Updating transactions table for Midtrans integration...\n');

        // Check if order_id column exists
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'transactions' 
            AND COLUMN_NAME = 'order_id'
        `);

        if (columns.length === 0) {
            console.log('➕ Adding order_id column...');
            await pool.query(`
                ALTER TABLE transactions 
                ADD COLUMN order_id VARCHAR(100) UNIQUE DEFAULT NULL 
                AFTER id
            `);
            console.log('   ✅ order_id column added!');
        } else {
            console.log('   ✓ order_id column already exists');
        }

        // Check if updated_at column exists
        const [updatedAtColumns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'transactions' 
            AND COLUMN_NAME = 'updated_at'
        `);

        if (updatedAtColumns.length === 0) {
            console.log('➕ Adding updated_at column...');
            await pool.query(`
                ALTER TABLE transactions 
                ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            `);
            console.log('   ✅ updated_at column added!');
        } else {
            console.log('   ✓ updated_at column already exists');
        }

        console.log('\n🎉 Transactions table updated successfully!');
        console.log('💡 Ready for Midtrans integration.\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

updateTransactionsTable();
