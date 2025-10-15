-- Cleanup payments with invalid package references
-- This script will mark payments as "Invalid" if their package_id doesn't exist

-- First, let's see what invalid payments exist
SELECT 
    p.id,
    p.user_id,
    p.package_id,
    p.amount,
    p.status,
    p.transaction_date,
    CASE 
        WHEN pk.id IS NULL THEN 'Package not found'
        ELSE 'Package exists'
    END as package_status
FROM Payment p
LEFT JOIN Package pk ON p.package_id = pk.id
WHERE pk.id IS NULL;

-- Update invalid payments to "Invalid" status
UPDATE Payment 
SET status = 'Invalid'
WHERE package_id NOT IN (SELECT id FROM Package);

-- Show the results
SELECT 
    COUNT(*) as total_payments,
    SUM(CASE WHEN status = 'Invalid' THEN 1 ELSE 0 END) as invalid_payments,
    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_payments,
    SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as success_payments,
    SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed_payments
FROM Payment;

-- Show current packages
SELECT id, name, price, is_active FROM Package;
