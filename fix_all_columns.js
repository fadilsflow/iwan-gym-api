const { pool } = require('./config/database');

async function fixAllColumns() {
    try {
        console.log('🔧 Memeriksa struktur tabel users...\n');

        // Cek kolom yang ada saat ini
        const [existingColumns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('📋 Kolom yang ada saat ini:');
        existingColumns.forEach(col => console.log(`   - ${col.COLUMN_NAME}`));
        console.log('');

        // Daftar kolom yang harus ada
        const requiredColumns = [
            { name: 'is_verified', type: 'BOOLEAN DEFAULT FALSE', after: 'password' },
            { name: 'alamat', type: 'VARCHAR(255) DEFAULT NULL', after: 'is_verified' },
            { name: 'jenis_kelamin', type: 'VARCHAR(20) DEFAULT NULL', after: 'alamat' },
            { name: 'tanggal_lahir', type: 'DATE DEFAULT NULL', after: 'jenis_kelamin' }
        ];

        // Tambahkan kolom yang hilang
        for (const col of requiredColumns) {
            const exists = existingColumns.some(ec => ec.COLUMN_NAME === col.name);

            if (!exists) {
                console.log(`➕ Menambahkan kolom: ${col.name}...`);
                await pool.query(`
                    ALTER TABLE users 
                    ADD COLUMN ${col.name} ${col.type} 
                    AFTER ${col.after}
                `);
                console.log(`   ✅ Kolom ${col.name} berhasil ditambahkan!`);
            } else {
                console.log(`   ✓ Kolom ${col.name} sudah ada`);
            }
        }

        console.log('\n📋 Struktur tabel users setelah update:');
        const [updatedColumns] = await pool.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `);

        updatedColumns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME} (${col.COLUMN_TYPE})`);
        });

        // Update user yang sudah ada menjadi verified
        console.log('\n🔄 Mengupdate user yang sudah ada...');
        const [result] = await pool.query(`
            UPDATE users 
            SET is_verified = TRUE 
            WHERE is_verified IS NULL OR is_verified = FALSE
        `);
        console.log(`   ✅ ${result.affectedRows} user di-update menjadi verified`);

        console.log('\n🎉 Selesai! Database sudah diperbaiki.');
        console.log('💡 Silakan coba registrasi lagi dari aplikasi Flutter.\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

fixAllColumns();
