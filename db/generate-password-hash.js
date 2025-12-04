// Script para generar hashes de bcrypt para usuarios de prueba
// Ejecutar con: node prisma/generate-password-hash.js

import { hash } from "bcrypt";

async function generateHashes() {
  const password = "test123";
  const saltRounds = 10;

  console.log('🔐 Generando hashes de bcrypt para contraseña: "test123"\n');

  // Generar dos hashes diferentes (bcrypt genera un salt único cada vez)
  const adminHash = await hash(password, saltRounds);
  const staffHash = await hash(password, saltRounds);

  console.log("📋 Hash para Admin:");
  console.log(adminHash);
  console.log("\n📋 Hash para Staff (Psicólogo):");
  console.log(staffHash);

  console.log(
    '\n\n✅ Copia estos hashes y reemplaza "$2b$10$YourHashHere" en el archivo prisma/seed-users.sql'
  );
  console.log("\n💡 Para ejecutar el SQL:");
  console.log(
    "   1. docker exec -it postgres-db psql -U admin -d proyecto_final_db"
  );
  console.log("   2. Copia y pega el contenido de prisma/seed-users.sql");
  console.log(
    "   3. O ejecuta: docker exec -i postgres-db psql -U admin -d proyecto_final_db < prisma/seed-users.sql"
  );
}

generateHashes().catch(console.error);
