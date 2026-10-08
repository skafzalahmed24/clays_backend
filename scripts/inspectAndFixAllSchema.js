require('dotenv').config();
const { sequelize } = require('../config/db');
const models = require('../models');

async function checkAndSync() {
    try {
        await sequelize.authenticate();
        console.log('✓ Connected to Database.\n');

        const [tables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        `);
        const existingTableNames = new Set(tables.map(t => t.table_name));

        const [existingColumns] = await sequelize.query(`
            SELECT table_name, column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public';
        `);

        // Group columns by table
        const tableColumnsMap = {};
        for (const col of existingColumns) {
            if (!tableColumnsMap[col.table_name]) {
                tableColumnsMap[col.table_name] = new Set();
            }
            tableColumnsMap[col.table_name].add(col.column_name);
        }

        console.log('==============================================');
        console.log('🔍 CHECKING ALL MODELS AGAINST DATABASE SCHEMA');
        console.log('==============================================\n');

        const missingAlterQueries = [];

        for (const [modelName, model] of Object.entries(models)) {
            const tableName = model.tableName || model.name;
            if (!tableName) continue;

            if (!existingTableNames.has(tableName)) {
                console.log(`⚠️ Table "${tableName}" does not exist in DB!`);
                continue;
            }

            const dbCols = tableColumnsMap[tableName] || new Set();
            const rawAttributes = model.rawAttributes;

            for (const [attrName, attrDef] of Object.entries(rawAttributes)) {
                // Ignore virtual attributes
                if (attrDef.type && attrDef.type.key === 'VIRTUAL') continue;
                
                const colName = attrDef.field || attrName;

                if (!dbCols.has(colName)) {
                    console.log(`❌ Missing column: "${tableName}"."${colName}" (Type: ${attrDef.type.toSql ? attrDef.type.toSql() : attrDef.type.key})`);

                    let sqlType = 'VARCHAR(255)';
                    const typeKey = attrDef.type.key || (attrDef.type.constructor ? attrDef.type.constructor.name : '');

                    if (typeKey === 'INTEGER') {
                        if (attrDef.autoIncrement) {
                            sqlType = 'SERIAL';
                        } else {
                            sqlType = 'INTEGER';
                        }
                    } else if (typeKey === 'FLOAT' || typeKey === 'DOUBLE') {
                        sqlType = 'DOUBLE PRECISION';
                    } else if (typeKey === 'BOOLEAN') {
                        sqlType = 'BOOLEAN';
                    } else if (typeKey === 'DATE') {
                        sqlType = 'TIMESTAMP WITH TIME ZONE';
                    } else if (typeKey === 'TEXT') {
                        sqlType = 'TEXT';
                    } else if (typeKey === 'JSONB' || typeKey === 'JSON') {
                        sqlType = 'JSONB';
                    } else if (typeKey === 'UUID') {
                        sqlType = 'UUID';
                    } else if (attrDef.type.toSql) {
                        sqlType = attrDef.type.toSql();
                    }

                    let defaultClause = '';
                    if (attrDef.defaultValue !== undefined && typeof attrDef.defaultValue !== 'function') {
                        if (typeof attrDef.defaultValue === 'object' && attrDef.defaultValue !== null) {
                            defaultClause = ` DEFAULT '${JSON.stringify(attrDef.defaultValue).replace(/'/g, "''")}'::jsonb`;
                        } else if (typeof attrDef.defaultValue === 'boolean') {
                            defaultClause = ` DEFAULT ${attrDef.defaultValue}`;
                        } else if (typeof attrDef.defaultValue === 'number') {
                            defaultClause = ` DEFAULT ${attrDef.defaultValue}`;
                        } else if (typeof attrDef.defaultValue === 'string') {
                            defaultClause = ` DEFAULT '${attrDef.defaultValue.replace(/'/g, "''")}'`;
                        }
                    }

                    let query = `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${colName}" ${sqlType}${defaultClause};`;
                    
                    if (attrDef.unique && !attrDef.primaryKey) {
                        query += `\n-- Create unique index if not exists\nCREATE UNIQUE INDEX IF NOT EXISTS "${tableName}_${colName}_unique" ON "${tableName}" ("${colName}");`;
                    }

                    missingAlterQueries.push({
                        tableName,
                        colName,
                        query
                    });
                }
            }
        }

        if (missingAlterQueries.length === 0) {
            console.log('\n✅ All model columns match the database schema perfectly! No missing columns found.');
        } else {
            console.log(`\nFound ${missingAlterQueries.length} missing column(s):`);
            for (const item of missingAlterQueries) {
                console.log(`\nExecuting: ${item.query}`);
                try {
                    await sequelize.query(item.query);
                    console.log(`✓ Added "${item.colName}" to "${item.tableName}"`);
                } catch (err) {
                    console.error(`Error adding ${item.colName}:`, err.message);
                }
            }
        }

        console.log('\n==============================================');
        console.log('🎉 SCHEMA VERIFICATION COMPLETE');
        console.log('==============================================');

    } catch (e) {
        console.error('Fatal check error:', e);
    } finally {
        process.exit(0);
    }
}

checkAndSync();
