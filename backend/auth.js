import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./config/db.js";
import { user } from "./db/schema.js";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    trustedOrigins: ["http://localhost:5175"],
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "employee"
            },
            companyId: {
                type: "string",
                required: false
            },
            requiresPasswordChange: {
                type: "boolean",
                defaultValue: false
            }
        }
    },
    // hooks: {
    //     after: {
    //         changePassword: async (ctx) => {
    //             if (ctx.user.requiresPasswordChange) {
    //                 // Update using Drizzle
    //                 await db.update(user)
    //                     .set({ requiresPasswordChange: false })
    //                     .where(eq(user.email, ctx.user.email));
    //             }
    //         }
    //     }
    // }
});
