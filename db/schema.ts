import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const planners = sqliteTable('planners', { owner: text('owner').primaryKey(), payload: text('payload').notNull(), revision: integer('revision').notNull().default(0) });
export const rooms = sqliteTable('rooms', { owner: text('owner').primaryKey(), passwordHash: text('password_hash').notNull().unique(), apiHash: text('api_hash').unique() });
