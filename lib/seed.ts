import { PrismaClient, UserRole, CustomerType, TableStatus, ItemType, PermissionScope } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create system permissions first
  console.log('📋 Creating permissions...');
  const permissions = [
    { name: 'order.create', displayName: 'Create Orders', description: 'Can create new orders', scope: PermissionScope.BUSINESS_UNIT, module: 'orders' },
    { name: 'order.read', displayName: 'View Orders', description: 'Can view orders', scope: PermissionScope.BUSINESS_UNIT, module: 'orders' },
    { name: 'order.update', displayName: 'Update Orders', description: 'Can update orders', scope: PermissionScope.BUSINESS_UNIT, module: 'orders' },
    { name: 'order.delete', displayName: 'Cancel Orders', description: 'Can cancel orders', scope: PermissionScope.BUSINESS_UNIT, module: 'orders' },
    { name: 'menu.create', displayName: 'Create Menu Items', description: 'Can create menu items', scope: PermissionScope.BUSINESS_UNIT, module: 'menu' },
    { name: 'menu.read', displayName: 'View Menu', description: 'Can view menu items', scope: PermissionScope.BUSINESS_UNIT, module: 'menu' },
    { name: 'menu.update', displayName: 'Update Menu', description: 'Can update menu items', scope: PermissionScope.BUSINESS_UNIT, module: 'menu' },
    { name: 'menu.delete', displayName: 'Delete Menu Items', description: 'Can delete menu items', scope: PermissionScope.BUSINESS_UNIT, module: 'menu' },
    { name: 'customer.create', displayName: 'Create Customers', description: 'Can create customer records', scope: PermissionScope.BUSINESS_UNIT, module: 'customers' },
    { name: 'customer.read', displayName: 'View Customers', description: 'Can view customer information', scope: PermissionScope.BUSINESS_UNIT, module: 'customers' },
    { name: 'customer.update', displayName: 'Update Customers', description: 'Can update customer information', scope: PermissionScope.BUSINESS_UNIT, module: 'customers' },
    { name: 'table.manage', displayName: 'Manage Tables', description: 'Can manage table status and assignments', scope: PermissionScope.BUSINESS_UNIT, module: 'tables' },
    { name: 'kitchen.manage', displayName: 'Manage Kitchen Orders', description: 'Can manage kitchen orders', scope: PermissionScope.BUSINESS_UNIT, module: 'kitchen' },
    { name: 'bar.manage', displayName: 'Manage Bar Orders', description: 'Can manage bar orders', scope: PermissionScope.BUSINESS_UNIT, module: 'bar' },
    { name: 'reports.view', displayName: 'View Reports', description: 'Can view business reports', scope: PermissionScope.BUSINESS_UNIT, module: 'reports' },
    { name: 'users.manage', displayName: 'Manage Users', description: 'Can manage user accounts and roles', scope: PermissionScope.BUSINESS_UNIT, module: 'users' },
    { name: 'system.admin', displayName: 'System Administration', description: 'Full system administration access', scope: PermissionScope.GLOBAL, module: 'system' },
  ];

  const createdPermissions = [];
  for (const permission of permissions) {
    const created = await prisma.permission.create({
      data: permission,
    });
    createdPermissions.push(created);
  }

  // Create system roles
  console.log('👥 Creating roles...');
  const roles = [
    { name: 'waiter', displayName: 'Waiter', description: 'Front-of-house service staff', isSystem: true },
    { name: 'kitchen_staff', displayName: 'Kitchen Staff', description: 'Kitchen and food preparation staff', isSystem: true },
    { name: 'bar_staff', displayName: 'Bar Staff', description: 'Bar and beverage preparation staff', isSystem: true },
    { name: 'cashier', displayName: 'Cashier', description: 'Payment processing staff', isSystem: true },
    { name: 'manager', displayName: 'Manager', description: 'Business unit manager', isSystem: true },
    { name: 'admin', displayName: 'System Administrator', description: 'System-wide administrator', isSystem: true },
  ];

  const createdRoles = [];
  for (const role of roles) {
    const created = await prisma.role.create({
      data: role,
    });
    createdRoles.push(created);
  }

  // Assign permissions to roles
  console.log('🔗 Assigning permissions to roles...');
  const rolePermissionMappings = [
    { roleName: 'waiter', permissions: ['order.create', 'order.read', 'order.update', 'menu.read', 'customer.create', 'customer.read', 'customer.update', 'table.manage'] },
    { roleName: 'kitchen_staff', permissions: ['order.read', 'menu.read', 'kitchen.manage'] },
    { roleName: 'bar_staff', permissions: ['order.read', 'menu.read', 'bar.manage'] },
    { roleName: 'cashier', permissions: ['order.read', 'order.update', 'customer.read', 'reports.view'] },
    { roleName: 'manager', permissions: ['order.create', 'order.read', 'order.update', 'order.delete', 'menu.create', 'menu.read', 'menu.update', 'menu.delete', 'customer.create', 'customer.read', 'customer.update', 'table.manage', 'kitchen.manage', 'bar.manage', 'reports.view', 'users.manage'] },
    { roleName: 'admin', permissions: ['system.admin'] },
  ];

  for (const mapping of rolePermissionMappings) {
    const role = createdRoles.find(r => r.name === mapping.roleName);
    if (role) {
      for (const permissionName of mapping.permissions) {
        const permission = createdPermissions.find(p => p.name === permissionName);
        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }
  }

  // Create system administrator
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@doloresgroup.com',
      username: 'admin',
      name: 'System Administrator',
      passwordHash: await bcrypt.hash('asdasd123', 10),
      isActive: true,
    },
  });

  console.log('✅ Created system administrator');

  // Create business units
  const businessUnits = await Promise.all([
    prisma.businessUnit.create({
      data: {
        code: 'ANCHOR01',
        name: 'Anchor Hotel',
        address: '123 Pioneer Avenue, General Santos City, South Cotabato',
        phone: '+63-83-552-1234',
        email: 'info@anchorhotel.com',
        timezone: 'Asia/Manila',
        currency: 'PHP',
        taxRate: 0.12,
        settings: {
          operatingHours: {
            monday: { open: '06:00', close: '22:00' },
            tuesday: { open: '06:00', close: '22:00' },
            wednesday: { open: '06:00', close: '22:00' },
            thursday: { open: '06:00', close: '22:00' },
            friday: { open: '06:00', close: '23:00' },
            saturday: { open: '06:00', close: '23:00' },
            sunday: { open: '07:00', close: '22:00' }
          }
        }
      },
    }),
    prisma.businessUnit.create({
      data: {
        code: 'FARM01',
        name: 'Dolores Farm Resort',
        address: '456 Farm Road, General Santos City, South Cotabato',
        phone: '+63-83-552-5678',
        email: 'info@doloresfarm.com',
        timezone: 'Asia/Manila',
        currency: 'PHP',
        taxRate: 0.12,
        settings: {
          operatingHours: {
            monday: { open: '07:00', close: '21:00' },
            tuesday: { open: '07:00', close: '21:00' },
            wednesday: { open: '07:00', close: '21:00' },
            thursday: { open: '07:00', close: '21:00' },
            friday: { open: '07:00', close: '22:00' },
            saturday: { open: '06:00', close: '22:00' },
            sunday: { open: '06:00', close: '21:00' }
          }
        }
      },
    }),
    prisma.businessUnit.create({
      data: {
        code: 'LAKE01',
        name: 'Dolores Lake Resort',
        address: '789 Lake View Drive, General Santos City, South Cotabato',
        phone: '+63-83-552-9012',
        email: 'info@doloreslake.com',
        timezone: 'Asia/Manila',
        currency: 'PHP',
        taxRate: 0.12,
        settings: {
          operatingHours: {
            monday: { open: '06:00', close: '22:00' },
            tuesday: { open: '06:00', close: '22:00' },
            wednesday: { open: '06:00', close: '22:00' },
            thursday: { open: '06:00', close: '22:00' },
            friday: { open: '06:00', close: '23:00' },
            saturday: { open: '05:00', close: '23:00' },
            sunday: { open: '05:00', close: '22:00' }
          }
        }
      },
    }),
    prisma.businessUnit.create({
      data: {
        code: 'TROP01',
        name: 'Dolores Tropicana Resort',
        address: '321 Tropical Paradise, General Santos City, South Cotabato',
        phone: '+63-83-552-3456',
        email: 'info@dolorestropicana.com',
        timezone: 'Asia/Manila',
        currency: 'PHP',
        taxRate: 0.12,
        settings: {
          operatingHours: {
            monday: { open: '06:00', close: '22:00' },
            tuesday: { open: '06:00', close: '22:00' },
            wednesday: { open: '06:00', close: '22:00' },
            thursday: { open: '06:00', close: '22:00' },
            friday: { open: '06:00', close: '24:00' },
            saturday: { open: '06:00', close: '24:00' },
            sunday: { open: '06:00', close: '22:00' }
          }
        }
      },
    }),
  ]);

  console.log('✅ Created business units');

  // Find admin role for assignments
  const adminRole = createdRoles.find(r => r.name === 'admin');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const managerRole = createdRoles.find(r => r.name === 'manager');

  // Assign admin to all business units with admin role
  if (adminRole) {
    await Promise.all(
      businessUnits.map((bu) =>
        prisma.userBusinessUnit.create({
          data: {
            userId: adminUser.id,
            businessUnitId: bu.id,
            role: UserRole.MANAGER, // Keep UserRole enum for backward compatibility
            assignedBy: adminUser.id,
          },
        })
      )
    );

    // Also assign the new role system
    await Promise.all(
      businessUnits.map((bu) =>
        prisma.userBusinessUnitRole.create({
          data: {
            userId: adminUser.id,
            businessUnitId: bu.id,
            roleId: adminRole.id,
            assignedBy: adminUser.id,
          },
        })
      )
    );
  }

  // Create additional users for each business unit
  const userConfigs = [
    { name: 'John Doe', role: UserRole.WAITER, systemRole: 'waiter' },
    { name: 'Jane Smith', role: UserRole.KITCHEN_STAFF, systemRole: 'kitchen_staff' },
    { name: 'Mike Johnson', role: UserRole.BAR_STAFF, systemRole: 'bar_staff' },
    { name: 'Sarah Wilson', role: UserRole.CASHIER, systemRole: 'cashier' },
    { name: 'David Brown', role: UserRole.WAITER, systemRole: 'waiter' },
    { name: 'Lisa Garcia', role: UserRole.MANAGER, systemRole: 'manager' },
  ];
  
  for (const businessUnit of businessUnits) {
    const buCode = businessUnit.code.toLowerCase();
    
    for (let i = 0; i < userConfigs.length; i++) {
      const config = userConfigs[i];
      const user = await prisma.user.create({
        data: {
          email: `${config.name.toLowerCase().replace(' ', '.')}@${buCode}.com`,
          username: `${config.name.toLowerCase().replace(' ', '')}_${buCode}`,
          name: config.name,
          passwordHash: await bcrypt.hash('password123', 10),
          isActive: true,
        },
      });

      // Assign old role system
      await prisma.userBusinessUnit.create({
        data: {
          userId: user.id,
          businessUnitId: businessUnit.id,
          role: config.role,
          assignedBy: adminUser.id,
        },
      });

      // Assign new role system
      const systemRole = createdRoles.find(r => r.name === config.systemRole);
      if (systemRole) {
        await prisma.userBusinessUnitRole.create({
          data: {
            userId: user.id,
            businessUnitId: businessUnit.id,
            roleId: systemRole.id,
            assignedBy: adminUser.id,
          },
        });
      }
    }
  }

  console.log('✅ Created users and assigned roles');

  // Create tables for each business unit
  for (const businessUnit of businessUnits) {
    const tableCount = businessUnit.code === 'ANCHOR01' ? 20 : 15; // Hotel has more tables
    
    for (let i = 1; i <= tableCount; i++) {
      await prisma.table.create({
        data: {
          businessUnitId: businessUnit.id,
          number: i,
          capacity: i <= 5 ? 2 : i <= 10 ? 4 : i <= 15 ? 6 : 8,
          status: TableStatus.AVAILABLE,
          location: i <= 5 ? 'Ground Floor' : i <= 10 ? 'Second Floor' : 'Outdoor Area',
        },
      });
    }
  }

  console.log('✅ Created tables');

  // Menu categories
  const categories = [
    { name: 'Appetizers', description: 'Start your meal with these delicious appetizers' },
    { name: 'Salads', description: 'Fresh and healthy salad options' },
    { name: 'Soups', description: 'Warm and comforting soups' },
    { name: 'Main Course - Meat', description: 'Hearty meat dishes' },
    { name: 'Main Course - Seafood', description: 'Fresh seafood specialties' },
    { name: 'Main Course - Vegetarian', description: 'Vegetarian main dishes' },
    { name: 'Rice & Noodles', description: 'Asian-inspired rice and noodle dishes' },
    { name: 'Desserts', description: 'Sweet treats to end your meal' },
    { name: 'Hot Beverages', description: 'Coffee, tea, and hot drinks' },
    { name: 'Cold Beverages', description: 'Refreshing cold drinks' },
    { name: 'Alcoholic Beverages', description: 'Wine, beer, and cocktails' },
    { name: 'Local Specialties', description: 'Regional Filipino dishes' },
  ];

  // Create menu items for each business unit
  for (const businessUnit of businessUnits) {
    // Create categories for this business unit
    const businessCategories = await Promise.all(
      categories.map((cat, index) =>
        prisma.category.create({
          data: {
            businessUnitId: businessUnit.id,
            name: cat.name,
            description: cat.description,
            sortOrder: index,
          },
        })
      )
    );

    console.log(`✅ Created categories for ${businessUnit.name}`);

    // Menu items data
    interface MenuItemData {
      name: string;
      description: string;
      price: number;
      category: string;
      type: ItemType;
      prepTime: number;
    }

    const menuItems: MenuItemData[] = [
      // Appetizers
      { name: 'Chicken Wings', description: 'Buffalo-style chicken wings with blue cheese dip', price: 285, category: 'Appetizers', type: ItemType.FOOD, prepTime: 15 },
      { name: 'Mozzarella Sticks', description: 'Crispy breaded mozzarella with marinara sauce', price: 225, category: 'Appetizers', type: ItemType.FOOD, prepTime: 10 },
      { name: 'Calamari Rings', description: 'Golden fried squid rings with tartar sauce', price: 315, category: 'Appetizers', type: ItemType.FOOD, prepTime: 12 },
      { name: 'Nachos Supreme', description: 'Tortilla chips with cheese, jalapeños, and salsa', price: 265, category: 'Appetizers', type: ItemType.FOOD, prepTime: 8 },
      { name: 'Spring Rolls', description: 'Vegetable spring rolls with sweet chili sauce', price: 185, category: 'Appetizers', type: ItemType.FOOD, prepTime: 10 },

      // Salads
      { name: 'Caesar Salad', description: 'Romaine lettuce with Caesar dressing and croutons', price: 245, category: 'Salads', type: ItemType.FOOD, prepTime: 8 },
      { name: 'Greek Salad', description: 'Mixed greens with feta, olives, and Greek dressing', price: 265, category: 'Salads', type: ItemType.FOOD, prepTime: 10 },
      { name: 'Chicken Salad', description: 'Grilled chicken breast over mixed greens', price: 295, category: 'Salads', type: ItemType.FOOD, prepTime: 15 },
      { name: 'Tuna Salad', description: 'Fresh tuna with mixed vegetables and vinaigrette', price: 325, category: 'Salads', type: ItemType.FOOD, prepTime: 12 },
      { name: 'Garden Salad', description: 'Fresh mixed greens with seasonal vegetables', price: 195, category: 'Salads', type: ItemType.FOOD, prepTime: 5 },

      // Soups
      { name: 'Mushroom Soup', description: 'Creamy mushroom soup with herbs', price: 165, category: 'Soups', type: ItemType.FOOD, prepTime: 10 },
      { name: 'Tomato Basil Soup', description: 'Rich tomato soup with fresh basil', price: 145, category: 'Soups', type: ItemType.FOOD, prepTime: 8 },
      { name: 'Chicken Corn Soup', description: 'Hearty chicken and corn soup', price: 175, category: 'Soups', type: ItemType.FOOD, prepTime: 12 },
      { name: 'Seafood Bisque', description: 'Creamy seafood bisque with shrimp and crab', price: 285, category: 'Soups', type: ItemType.FOOD, prepTime: 15 },
      { name: 'Vegetable Soup', description: 'Healthy mixed vegetable soup', price: 135, category: 'Soups', type: ItemType.FOOD, prepTime: 10 },

      // Main Course - Meat
      { name: 'Grilled Ribeye Steak', description: '300g ribeye steak with garlic butter', price: 895, category: 'Main Course - Meat', type: ItemType.FOOD, prepTime: 25 },
      { name: 'BBQ Pork Ribs', description: 'Slow-cooked pork ribs with BBQ sauce', price: 485, category: 'Main Course - Meat', type: ItemType.FOOD, prepTime: 30 },
      { name: 'Chicken Cordon Bleu', description: 'Stuffed chicken breast with ham and cheese', price: 385, category: 'Main Course - Meat', type: ItemType.FOOD, prepTime: 20 },
      { name: 'Beef Tenderloin', description: 'Grilled beef tenderloin with mushroom sauce', price: 695, category: 'Main Course - Meat', type: ItemType.FOOD, prepTime: 22 },
      { name: 'Pork Chops', description: 'Grilled pork chops with apple glaze', price: 345, category: 'Main Course - Meat', type: ItemType.FOOD, prepTime: 18 },
      { name: 'Lamb Rack', description: 'Herb-crusted lamb rack with mint sauce', price: 785, category: 'Main Course - Meat', type: ItemType.FOOD, prepTime: 25 },

      // Main Course - Seafood
      { name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter sauce', price: 485, category: 'Main Course - Seafood', type: ItemType.FOOD, prepTime: 18 },
      { name: 'Fish and Chips', description: 'Battered fish with crispy fries', price: 325, category: 'Main Course - Seafood', type: ItemType.FOOD, prepTime: 15 },
      { name: 'Grilled Tuna', description: 'Yellowfin tuna steak with wasabi mayo', price: 445, category: 'Main Course - Seafood', type: ItemType.FOOD, prepTime: 12 },
      { name: 'Shrimp Scampi', description: 'Garlic butter shrimp over pasta', price: 385, category: 'Main Course - Seafood', type: ItemType.FOOD, prepTime: 15 },
      { name: 'Lobster Thermidor', description: 'Baked lobster with cheese sauce', price: 1285, category: 'Main Course - Seafood', type: ItemType.FOOD, prepTime: 25 },
      { name: 'Crab Cakes', description: 'Pan-seared crab cakes with remoulade', price: 565, category: 'Main Course - Seafood', type: ItemType.FOOD, prepTime: 20 },

      // Main Course - Vegetarian
      { name: 'Vegetable Pasta', description: 'Penne pasta with seasonal vegetables', price: 245, category: 'Main Course - Vegetarian', type: ItemType.FOOD, prepTime: 15 },
      { name: 'Mushroom Risotto', description: 'Creamy arborio rice with wild mushrooms', price: 285, category: 'Main Course - Vegetarian', type: ItemType.FOOD, prepTime: 20 },
      { name: 'Eggplant Parmesan', description: 'Breaded eggplant with marinara and mozzarella', price: 265, category: 'Main Course - Vegetarian', type: ItemType.FOOD, prepTime: 18 },
      { name: 'Vegetable Curry', description: 'Mixed vegetables in coconut curry sauce', price: 225, category: 'Main Course - Vegetarian', type: ItemType.FOOD, prepTime: 15 },
      { name: 'Quinoa Bowl', description: 'Quinoa with roasted vegetables and tahini', price: 235, category: 'Main Course - Vegetarian', type: ItemType.FOOD, prepTime: 12 },

      // Rice & Noodles
      { name: 'Chicken Fried Rice', description: 'Wok-fried rice with chicken and vegetables', price: 195, category: 'Rice & Noodles', type: ItemType.FOOD, prepTime: 12 },
      { name: 'Beef Pad Thai', description: 'Thai-style noodles with beef and peanuts', price: 225, category: 'Rice & Noodles', type: ItemType.FOOD, prepTime: 15 },
      { name: 'Seafood Paella', description: 'Spanish rice dish with mixed seafood', price: 485, category: 'Rice & Noodles', type: ItemType.FOOD, prepTime: 25 },
      { name: 'Pork Adobo Rice', description: 'Filipino adobo pork over steamed rice', price: 175, category: 'Rice & Noodles', type: ItemType.FOOD, prepTime: 10 },
      { name: 'Vegetable Lo Mein', description: 'Soft noodles with mixed vegetables', price: 165, category: 'Rice & Noodles', type: ItemType.FOOD, prepTime: 12 },

      // Local Specialties
      { name: 'Lechon Kawali', description: 'Crispy pork belly with liver sauce', price: 285, category: 'Local Specialties', type: ItemType.FOOD, prepTime: 20 },
      { name: 'Kare-Kare', description: 'Oxtail stew in peanut sauce', price: 325, category: 'Local Specialties', type: ItemType.FOOD, prepTime: 25 },
      { name: 'Sinigang na Baboy', description: 'Pork in tamarind soup with vegetables', price: 245, category: 'Local Specialties', type: ItemType.FOOD, prepTime: 18 },
      { name: 'Chicken Inasal', description: 'Grilled marinated chicken Filipino-style', price: 215, category: 'Local Specialties', type: ItemType.FOOD, prepTime: 20 },
      { name: 'Bistek Tagalog', description: 'Filipino beef steak with onions', price: 265, category: 'Local Specialties', type: ItemType.FOOD, prepTime: 15 },

      // Desserts
      { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 185, category: 'Desserts', type: ItemType.FOOD, prepTime: 12 },
      { name: 'Cheesecake', description: 'New York style cheesecake with berry sauce', price: 165, category: 'Desserts', type: ItemType.FOOD, prepTime: 5 },
      { name: 'Tiramisu', description: 'Classic Italian coffee-flavored dessert', price: 175, category: 'Desserts', type: ItemType.FOOD, prepTime: 5 },
      { name: 'Ice Cream Sundae', description: 'Three scoops with toppings and sauce', price: 145, category: 'Desserts', type: ItemType.FOOD, prepTime: 5 },
      { name: 'Leche Flan', description: 'Filipino caramel custard dessert', price: 125, category: 'Desserts', type: ItemType.FOOD, prepTime: 5 },

      // Hot Beverages
      { name: 'Espresso', description: 'Strong Italian coffee shot', price: 85, category: 'Hot Beverages', type: ItemType.DRINK, prepTime: 3 },
      { name: 'Cappuccino', description: 'Espresso with steamed milk and foam', price: 115, category: 'Hot Beverages', type: ItemType.DRINK, prepTime: 5 },
      { name: 'Latte', description: 'Espresso with steamed milk', price: 125, category: 'Hot Beverages', type: ItemType.DRINK, prepTime: 5 },
      { name: 'Hot Chocolate', description: 'Rich hot chocolate with whipped cream', price: 105, category: 'Hot Beverages', type: ItemType.DRINK, prepTime: 5 },
      { name: 'Green Tea', description: 'Premium Japanese green tea', price: 75, category: 'Hot Beverages', type: ItemType.DRINK, prepTime: 3 },

      // Cold Beverages
      { name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice', price: 95, category: 'Cold Beverages', type: ItemType.DRINK, prepTime: 3 },
      { name: 'Iced Coffee', description: 'Cold brew coffee over ice', price: 105, category: 'Cold Beverages', type: ItemType.DRINK, prepTime: 3 },
      { name: 'Mango Smoothie', description: 'Fresh mango smoothie with yogurt', price: 125, category: 'Cold Beverages', type: ItemType.DRINK, prepTime: 5 },
      { name: 'Soft Drinks', description: 'Coke, Sprite, or other soft drinks', price: 65, category: 'Cold Beverages', type: ItemType.DRINK, prepTime: 1 },
      { name: 'Iced Tea', description: 'Refreshing iced tea with lemon', price: 75, category: 'Cold Beverages', type: ItemType.DRINK, prepTime: 2 },

      // Alcoholic Beverages
      { name: 'House Wine Red', description: 'Red house wine by the glass', price: 185, category: 'Alcoholic Beverages', type: ItemType.DRINK, prepTime: 2 },
      { name: 'House Wine White', description: 'White house wine by the glass', price: 185, category: 'Alcoholic Beverages', type: ItemType.DRINK, prepTime: 2 },
      { name: 'Local Beer', description: 'San Miguel Pale Pilsen', price: 95, category: 'Alcoholic Beverages', type: ItemType.DRINK, prepTime: 1 },
      { name: 'Imported Beer', description: 'Heineken or Corona', price: 145, category: 'Alcoholic Beverages', type: ItemType.DRINK, prepTime: 1 },
      { name: 'Mojito', description: 'Classic mint and rum cocktail', price: 225, category: 'Alcoholic Beverages', type: ItemType.DRINK, prepTime: 8 },
    ];

    // Create menu items for this business unit
    for (const item of menuItems) {
      const category = businessCategories.find(cat => cat.name === item.category);
      if (category) {
        await prisma.menuItem.create({
          data: {
            businessUnitId: businessUnit.id,
            categoryId: category.id,
            name: item.name,
            description: item.description,
            price: item.price,
            type: item.type,
            prepTime: item.prepTime,
            isAvailable: true,
          },
        });
      }
    }

    console.log(`✅ Created ${menuItems.length} menu items for ${businessUnit.name}`);
  }

  // Create some sample customers
  for (const businessUnit of businessUnits) {
    const customers = [
      {
        customerNumber: 'CUST-001',
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria.santos@email.com',
        phone: '+63-917-123-4567',
        type: CustomerType.REGULAR,
      },
      {
        customerNumber: 'CUST-002',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        email: 'juan.delacruz@email.com',
        phone: '+63-917-234-5678',
        type: CustomerType.VIP,
      },
      {
        customerNumber: 'CUST-003',
        firstName: 'Anna',
        lastName: 'Reyes',
        email: 'anna.reyes@email.com',
        phone: '+63-917-345-6789',
        type: CustomerType.REGULAR,
      },
    ];

    for (let i = 0; i < customers.length; i++) {
      await prisma.customer.create({
        data: {
          ...customers[i],
          businessUnitId: businessUnit.id,
          customerNumber: `${businessUnit.code}-${customers[i].customerNumber}`,
        },
      });
    }
  }

  console.log('✅ Created sample customers');

  // Create system settings
  const settings = [
    { key: 'system_name', value: 'Dolores Group Restaurant Management', description: 'System name' },
    { key: 'default_currency', value: 'PHP', description: 'Default currency' },
    { key: 'default_tax_rate', value: '0.12', description: 'Default tax rate (12%)' },
    { key: 'order_timeout_minutes', value: '30', description: 'Order timeout in minutes' },
    { key: 'max_table_capacity', value: '12', description: 'Maximum table capacity' },
  ];

  for (const setting of settings) {
    await prisma.setting.create({
      data: setting,
    });
  }

  console.log('✅ Created system settings');
  console.log('🎉 Database seeding completed successfully!');
  
  console.log('\n📋 Summary:');
  console.log(`- Created ${createdPermissions.length} permissions`);
  console.log(`- Created ${createdRoles.length} roles`);
  console.log(`- Created 1 system administrator`);
  console.log(`- Created 4 business units`);
  console.log(`- Created ${userConfigs.length * businessUnits.length + 1} users total`);
  console.log(`- Created tables for all business units`);
  console.log(`- Created ${categories.length} categories per business unit`);
  console.log(`- Created 50+ menu items per business unit`);
  console.log(`- Created sample customers`);
  console.log(`- Created system settings`);
  
  console.log('\n🔑 Login Credentials:');
  console.log('Email: admin@doloresgroup.com');
  console.log('Password: asdasd123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });