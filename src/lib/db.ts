import { neon } from "@neondatabase/serverless";

/**
 * Returns a Neon serverless SQL client if connection variables are set.
 * Returns null if environment variables are not available (e.g. during initial builds or local tests).
 */
export const getSqlClient = () => {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return null;
  }
  
  try {
    return neon(databaseUrl);
  } catch (error) {
    console.error("Failed to initialize database client:", error);
    return null;
  }
};
