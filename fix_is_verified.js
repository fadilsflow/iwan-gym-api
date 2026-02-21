const { pool } = require('./config/database');

async function addIsVerifiedColumn() {
    try {
        console.log('🔧 Memeriksa dan menambahkan kolom is_verified...');
        
        // Cek apakah kolom sudah ada
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'is_verified'
        `);
        
        if (columns.length > 0) {
            console.log('✅ Kolom is_verified sudah ada!');
        } else {
            console.log('➕ Menambahkan kolom is_verified...');
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN is_verified BOOLEAN DEFAULT FALSE 
                AFTER password
            `);
            console.log('✅ Kolom is_verified berhasil ditambahkan!');
        }
        
        // Update semua user yang sudah ada menjadi verified (opsional)
        const [result] = await pool.query(`
            UPDATE users 
            SET is_verified = TRUE 
            WHERE is_verified IS NULL OR is_verified = FALSE
        `);
        
        console.log(`✅ ${result.affectedRows} user di-update menjadi verified`);
        console.log('🎉 Selesai! Silakan coba registrasi lagi.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addIsVerifiedColumn();
