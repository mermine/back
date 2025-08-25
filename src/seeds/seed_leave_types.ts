import { LeaveTypeEnum } from "@prisma/client";
import { db } from "@/lib/prisma_client";

type SeedLeaveType = {
  type: LeaveTypeEnum;
  name: string;
  description?: string;
};

const DEFAULT_LEAVE_TYPES: SeedLeaveType[] = [
  {
    type: LeaveTypeEnum.ANNUAL,
    name: "Annual Leave",
    description: "Paid time off accrued annually.",
  },
  {
    type: LeaveTypeEnum.SICK,
    name: "Sick Leave",
    description: "Leave for illness or medical reasons.",
  },
  {
    type: LeaveTypeEnum.MATERNITY,
    name: "Maternity Leave",
    description: "Leave for maternity-related reasons.",
  },
  {
    type: LeaveTypeEnum.PATERNITY,
    name: "Paternity Leave",
    description: "Leave for paternity-related reasons.",
  },
  {
    type: LeaveTypeEnum.UNPAID,
    name: "Unpaid Leave",
    description: "Leave without pay.",
  },
  {
    type: LeaveTypeEnum.OTHER,
    name: "Other",
    description: "Other leave type.",
  },
];

export async function seedLeaveTypes() {
  try {
    // Ensure idempotency: create a record for each enum type if it doesn't exist yet
    for (const lt of DEFAULT_LEAVE_TYPES) {
      const found = await db.leaveType.findFirst({ where: { type: lt.type } });
      if (!found) {
        await db.leaveType.create({
          data: {
            type: lt.type,
            name: lt.name,
            description: lt.description,
          },
        });
        console.log(`✅ Seeded leave type: ${lt.type}`);
      } else {
        console.log(`↪️ Leave type already exists: ${lt.type}`);
      }
    }
  } catch (err) {
    console.error("❌ Failed seeding leave types:", err);
  }
}
