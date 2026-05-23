import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = ["Food & Dining", "Transport", "Shopping", "Utilities", "Entertainment", "Health", "Travel", "Education"];

function randomBetween(min, max) {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString().split("T")[0];
}

const descriptions = {
  "Food & Dining":   ["Lunch at Subway", "Coffee & pastry", "Grocery run", "Pizza night", "Sushi dinner", "Breakfast burrito", "Thai takeout", "Farmers market"],
  "Transport":       ["Uber ride", "Monthly transit pass", "Gas fill-up", "Parking fee", "Lyft to airport", "Toll charges", "Bike rental"],
  "Shopping":        ["Amazon order", "New shoes", "IKEA furniture", "Clothing haul", "Office supplies", "Electronics accessory", "Books"],
  "Utilities":       ["Electricity bill", "Internet bill", "Water bill", "Phone bill", "Streaming subscription", "Cloud storage"],
  "Entertainment":   ["Movie tickets", "Concert tickets", "Netflix subscription", "Video game", "Museum visit", "Sports event"],
  "Health":          ["Gym membership", "Pharmacy", "Doctor copay", "Vitamins & supplements", "Dental cleaning", "Eye exam"],
  "Travel":          ["Hotel stay", "Flight booking", "Airbnb", "Travel insurance", "Car rental", "Luggage fees"],
  "Education":       ["Online course", "Textbook", "Workshop fee", "Udemy subscription", "Conference ticket"],
};

function randomDesc(category) {
  const opts = descriptions[category];
  return opts[Math.floor(Math.random() * opts.length)];
}

function generateExpenses(userId, workspaceId, count) {
  return Array.from({ length: count }, () => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    return {
      userId,
      workspaceId,
      date: randomDate(90),
      amount: randomBetween(4.5, 450),
      category,
      description: randomDesc(category),
    };
  });
}

async function main() {
  // Fetch users 1 and 2
  const [user1, user2] = await Promise.all([
    prisma.user.findUnique({ where: { email: "testuser1@spendwise.dev" }, include: { workspaceMemberships: true } }),
    prisma.user.findUnique({ where: { email: "testuser2@spendwise.dev" }, include: { workspaceMemberships: true } }),
  ]);

  if (!user1 || !user2) {
    console.error("Could not find test users — make sure they're registered first.");
    process.exit(1);
  }

  const ws1 = user1.workspaceMemberships[0].workspaceId;
  const ws2 = user2.workspaceMemberships[0].workspaceId;

  console.log(`Seeding User 1 (${user1.email}) → workspace ${ws1}`);
  console.log(`Seeding User 2 (${user2.email}) → workspace ${ws2}`);

  // 30 expenses for user 1, 25 for user 2
  const expenses1 = generateExpenses(user1.id, ws1, 30);
  const expenses2 = generateExpenses(user2.id, ws2, 25);

  const r1 = await prisma.expense.createMany({ data: expenses1 });
  const r2 = await prisma.expense.createMany({ data: expenses2 });

  console.log(`✅ Created ${r1.count} expenses for Test User 1`);
  console.log(`✅ Created ${r2.count} expenses for Test User 2`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
