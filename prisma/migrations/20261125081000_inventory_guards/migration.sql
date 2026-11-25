CREATE TRIGGER product_inventory_insert BEFORE INSERT ON Product
WHEN NEW.stockGrams < 0 OR NEW.reservedGrams < 0 OR NEW.stockGrams < NEW.reservedGrams
BEGIN SELECT RAISE(ABORT, 'Inventory invariant violated'); END;
CREATE TRIGGER product_inventory_update BEFORE UPDATE ON Product
WHEN NEW.stockGrams < 0 OR NEW.reservedGrams < 0 OR NEW.stockGrams < NEW.reservedGrams
BEGIN SELECT RAISE(ABORT, 'Inventory invariant violated'); END;
CREATE TRIGGER slot_capacity_insert BEFORE INSERT ON Slot
WHEN NEW.used < 0 OR NEW.capacity < 0 OR NEW.used > NEW.capacity
BEGIN SELECT RAISE(ABORT, 'Pickup capacity invariant violated'); END;
CREATE TRIGGER slot_capacity_update BEFORE UPDATE ON Slot
WHEN NEW.used < 0 OR NEW.capacity < 0 OR NEW.used > NEW.capacity
BEGIN SELECT RAISE(ABORT, 'Pickup capacity invariant violated'); END;
