import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable(
  'profiles',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    phone: text('phone').notNull().default(''),
    address: text('address').notNull().default(''),
    city: text('city').notNull().default(''),
    role: text('role').notNull().default('customer'),
    partner: integer('partner').notNull().default(0),
    referral: text('referral').notNull(),
    sponsor: text('sponsor').notNull().default(''),
    cart: text('cart').notNull().default('{}'),
    created: integer('created').notNull(),
    department: text('department').notNull().default(''),
    title: text('title').notNull().default(''),
    adminNote: text('admin_note').notNull().default(''),
    segment: text('segment').notNull().default('Standart'),
  },
  (t) => [
    uniqueIndex('idx_profiles_email').on(t.email),
    uniqueIndex('idx_profiles_referral').on(t.referral),
  ],
);
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id),
    number: text('number').notNull(),
    items: text('items').notNull(),
    total: integer('total').notNull(),
    shipping: integer('shipping').notNull(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    address: text('address').notNull(),
    city: text('city').notNull(),
    note: text('note').notNull().default(''),
    status: text('status').notNull().default('Alındı'),
    tracking: text('tracking').notNull().default(''),
    created: integer('created').notNull(),
    priority: text('priority').notNull().default('Normal'),
    internalNote: text('internal_note').notNull().default(''),
    assignedTo: text('assigned_to').notNull().default(''),
    paymentStatus: text('payment_status').notNull().default('Bekliyor'),
    stockBooked: integer('stock_booked').notNull().default(0),
    stockReleased: integer('stock_released').notNull().default(0),
    version: integer('version').notNull().default(0),
    changeToken: text('change_token').notNull().default(''),
  },
  (t) => [
    index('idx_orders_user_created').on(t.userId, t.created),
    index('idx_orders_created').on(t.created),
    uniqueIndex('idx_orders_number').on(t.number),
  ],
);
export const inventory = sqliteTable('inventory', {
  productId: text('product_id').primaryKey(),
  stock: integer('stock').notNull().default(0),
  reorder: integer('reorder').notNull().default(10),
  location: text('location').notNull().default(''),
  version: integer('version').notNull().default(0),
  changeToken: text('change_token').notNull().default(''),
  updated: integer('updated').notNull(),
});
export const activity = sqliteTable(
  'activity',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id').notNull(),
    actorName: text('actor_name').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id').notNull(),
    action: text('action').notNull(),
    detail: text('detail').notNull(),
    created: integer('created').notNull(),
  },
  (t) => [
    index('idx_activity_entity').on(t.entity, t.entityId, t.created),
    index('idx_activity_created').on(t.created),
  ],
);
export const authUsers = sqliteTable('auth_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  created: integer('created').notNull(),
});
export const authSessions = sqliteTable(
  'auth_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => authUsers.id, {
        onDelete: 'cascade',
      }),
    expires: integer('expires').notNull(),
  },
  (t) => [index('auth_sessions_user').on(t.userId), index('auth_sessions_expiry').on(t.expires)],
);
export const authAttempts = sqliteTable('auth_attempts', {
  key: text('key').primaryKey(),
  attempts: integer('attempts').notNull(),
  expires: integer('expires').notNull(),
});
