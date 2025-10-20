#!/usr/bin/env node

/**
 * Script to delete all existing orders and reset order numbering to start from #1001
 * Created: October 18, 2025
 * 
 * This script will:
 * 1. (Optional) Create a backup of existing orders
 * 2. Delete all orders from the database
 * 3. Reset the order ID sequence to start from 1001
 * 
 * Usage:
 *   node scripts/reset-orders.js
 *   node scripts/reset-orders.js --no-backup  (skip backup)
 *   node scripts/reset-orders.js --backup-only (only create backup)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Parse command line arguments
const args = process.argv.slice(2);
const noBackup = args.includes('--no-backup');
const backupOnly = args.includes('--backup-only');

async function confirmAction() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question(
      '\n⚠️  WARNING: This will DELETE ALL ORDERS from the database!\n' +
      '   This action CANNOT be undone (unless you create a backup).\n\n' +
      '   Type "DELETE ALL ORDERS" to confirm: ',
      (answer) => {
        readline.close();
        resolve(answer === 'DELETE ALL ORDERS');
      }
    );
  });
}

async function getOrderCount() {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Error getting order count:', error.message);
    return 0;
  }
  
  return count || 0;
}

async function backupOrders() {
  console.log('\n📦 Creating backup of existing orders...');
  
  try {
    // Check if backup table exists, if not create it
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS orders_backup (
          id INTEGER,
          customer_name VARCHAR(255),
          customer_email VARCHAR(255),
          customer_phone VARCHAR(20),
          items JSONB,
          total_amount DECIMAL(10,2),
          status VARCHAR(20),
          shipping_address JSONB,
          billing_address JSONB,
          payment_method VARCHAR(50),
          payment_id VARCHAR(255),
          payment_status VARCHAR(20),
          tracking_number VARCHAR(100),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE,
          updated_at TIMESTAMP WITH TIME ZONE,
          backup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    // Fetch all orders
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching orders:', fetchError.message);
      return false;
    }
    
    if (!orders || orders.length === 0) {
      console.log('ℹ️  No orders to backup');
      return true;
    }
    
    console.log(`   Found ${orders.length} orders to backup`);
    
    // Note: We can't directly insert into orders_backup via Supabase client
    // Instead, we'll save to a JSON file
    const fs = require('fs');
    const backupFile = `orders_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(orders, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    console.log(`   ${orders.length} orders saved to file`);
    return true;
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    return false;
  }
}

async function deleteAllOrders() {
  console.log('\n🗑️  Deleting all orders...');
  
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .neq('id', 0); // Delete all where id != 0 (i.e., all rows)
    
    if (error) {
      console.error('❌ Error deleting orders:', error.message);
      return false;
    }
    
    console.log('✅ All orders deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting orders:', error.message);
    return false;
  }
}

async function resetSequence() {
  console.log('\n🔢 Resetting order ID sequence to start from #1001...');
  
  try {
    // We need to use direct SQL for this
    // Note: This won't work with Supabase client directly
    console.log('\n⚠️  Note: To reset the sequence, run this SQL in your Supabase SQL Editor:');
    console.log('\n   ALTER SEQUENCE orders_id_seq RESTART WITH 1001;\n');
    console.log('   Or run the SQL file: scripts/reset-orders-to-1001.sql\n');
    
    return true;
  } catch (error) {
    console.error('❌ Error resetting sequence:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Order Reset Script');
  console.log('='.repeat(50));
  
  // Get current order count
  const orderCount = await getOrderCount();
  console.log(`\nCurrent orders in database: ${orderCount}`);
  
  if (orderCount === 0 && !backupOnly) {
    console.log('\nℹ️  No orders to delete. The database is already clean.');
    console.log('   The next order will use the current sequence value.');
    return;
  }
  
  // Backup only mode
  if (backupOnly) {
    console.log('\n📦 Running in BACKUP ONLY mode');
    const success = await backupOrders();
    if (success) {
      console.log('\n✅ Backup completed successfully!');
    } else {
      console.log('\n❌ Backup failed!');
      process.exit(1);
    }
    return;
  }
  
  // Create backup unless --no-backup flag is used
  if (!noBackup) {
    const backupSuccess = await backupOrders();
    if (!backupSuccess) {
      console.log('\n⚠️  Backup failed! Continue anyway? (not recommended)');
      const confirm = await confirmAction();
      if (!confirm) {
        console.log('\n❌ Operation cancelled');
        process.exit(0);
      }
    }
  } else {
    console.log('\n⚠️  Skipping backup (--no-backup flag used)');
  }
  
  // Confirm deletion
  const confirmed = await confirmAction();
  if (!confirmed) {
    console.log('\n❌ Operation cancelled');
    process.exit(0);
  }
  
  // Delete all orders
  const deleteSuccess = await deleteAllOrders();
  if (!deleteSuccess) {
    console.log('\n❌ Failed to delete orders');
    process.exit(1);
  }
  
  // Reset sequence
  await resetSequence();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Order reset completed!');
  console.log('\n📋 Summary:');
  console.log(`   • Orders deleted: ${orderCount}`);
  console.log('   • Next order ID will be: #1001');
  console.log('\n⚠️  IMPORTANT: Run this SQL in Supabase to complete the reset:');
  console.log('   ALTER SEQUENCE orders_id_seq RESTART WITH 1001;');
  console.log('\n   Or execute: scripts/reset-orders-to-1001.sql');
  console.log('='.repeat(50));
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

