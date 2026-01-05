import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./config/db.js";
import { user } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { bearer } from "better-auth/plugins";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    trustedOrigins: ["http://localhost:5175"],
    emailAndPassword: {
        enabled: true
    },
    plugins: [
        bearer()
    ],
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
            },
            phone: {
                type: "string",
                required: false
            },
            branchId: {
                type: "string",
                required: false
            },
            nic: {
                type: "string",
                required: false
            },
            address: {
                type: "string",
                required: false
            },
            epfNo: {
                type: "string",
                required: false
            },
            status: {
                type: "string",
                required: false,
                defaultValue: "Active"
            },
            permissions: {
                type: "string",
                required: false
            } // Storing as JSON string
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
