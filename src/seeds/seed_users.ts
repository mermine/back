import { Role, MaritalStatus, ServiceEnum } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { db } from "@/lib/prisma_client";
import { hashSync } from "bcrypt";

const ROLES = [Role.ADMIN, Role.EMPOYEE, Role.MANAGER];
const MARITAL_STATUSES = Object.values(MaritalStatus);
const SERVICES = Object.values(ServiceEnum);

export async function seedUsers() {
  try {
    const usersCount = await db.user.count();

    if (usersCount > 0) {
      console.log("⚠️ Users data already exists. Skipping insert.");
      return;
    }

    // Generate 50 fake users
    const usersData = Array.from({ length: 50 }).map(() => {
      const birthDate = faker.date.birthdate({ min: 18, max: 65, mode: "age" });

      return {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashSync("123456789", 10),
        role: faker.helpers.arrayElement(ROLES),
        phone: faker.phone.number(),
        dateOfBirth: birthDate.toISOString(),
        nationality: faker.location.country(),
        cinNumber: faker.number.int({ min: 10000000, max: 99999999 }),
        cnssNumber: faker.number.int({ min: 10000000, max: 99999999 }),
        maritalStatus: faker.helpers.arrayElement(MARITAL_STATUSES),
        jobTitle: faker.person.jobTitle(),
        service: faker.helpers.arrayElement(SERVICES),
      };
    });

    // Insert users
    await db.user.createMany({
      data: usersData,
    });

    console.log("✅ 50 users seeded successfully.");
    return usersData.map((u) => ({
      email: u.email,
      role: u.role,
    }));
  } catch (error) {
    console.error("❌ Seeding error:", error);
    return [];
  }
}
