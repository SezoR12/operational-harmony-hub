import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // --- App Config ---
  const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
  const dataEntryHash = process.env.DATA_ENTRY_PASSWORD
    ? await bcrypt.hash(process.env.DATA_ENTRY_PASSWORD, 10)
    : null;
  const gmReportToken = process.env.GM_REPORT_TOKEN || uuidv4().replace(/-/g, "");

  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      adminPasswordHash: adminHash,
      dataEntryPasswordHash: dataEntryHash,
      gmReportToken,
    },
  });

  console.log(`✅ App config created. GM Report Token: ${gmReportToken}`);

  // --- Factories ---
  const iceCream1 = await prisma.factory.upsert({
    where: { id: "fac-icecream-1" },
    update: {},
    create: {
      id: "fac-icecream-1",
      name: "مصنع آيس كريم 1",
      marketType: "B2C",
      planningStage: "market-led",
    },
  });

  const iceCream2 = await prisma.factory.upsert({
    where: { id: "fac-icecream-2" },
    update: {},
    create: {
      id: "fac-icecream-2",
      name: "مصنع آيس كريم 2",
      marketType: "B2C",
      planningStage: "market-led",
    },
  });

  const napkins = await prisma.factory.upsert({
    where: { id: "fac-napkins" },
    update: {},
    create: {
      id: "fac-napkins",
      name: "مصنع مناديل",
      marketType: "B2C",
      planningStage: "market-led",
    },
  });

  const cardboard = await prisma.factory.upsert({
    where: { id: "fac-cardboard" },
    update: {},
    create: {
      id: "fac-cardboard",
      name: "مصنع كرتون مضلج",
      marketType: "B2B",
      planningStage: "capacity-led",
    },
  });

  console.log("✅ Factories created");

  // --- Lines for Ice Cream 1 ---
  const ic1Lines = [
    { name: "خط آيس كريم كأس", type: "تعبئة", capacityPerHour: 500, hoursPerDay: 16 },
    { name: "خط آيس كريم كونو", type: "تعبئة", capacityPerHour: 400, hoursPerDay: 16 },
  ];

  for (const line of ic1Lines) {
    await prisma.line.upsert({
      where: { id: `line-ic1-${line.name.replace(/\s/g, "-")}` },
      update: {},
      create: {
        id: `line-ic1-${line.name.replace(/\s/g, "-")}`,
        factoryId: iceCream1.id,
        ...line,
        suitableProductIds: "[]",
      },
    });
  }

  // --- Lines for Ice Cream 2 ---
  const ic2Lines = [
    { name: "خط آيس كريم فاميلي", type: "تعبئة", capacityPerHour: 600, hoursPerDay: 16 },
    { name: "خط ساندويتش آيس كريم", type: "تعبئة", capacityPerHour: 350, hoursPerDay: 16 },
  ];

  for (const line of ic2Lines) {
    await prisma.line.upsert({
      where: { id: `line-ic2-${line.name.replace(/\s/g, "-")}` },
      update: {},
      create: {
        id: `line-ic2-${line.name.replace(/\s/g, "-")}`,
        factoryId: iceCream2.id,
        ...line,
        suitableProductIds: "[]",
      },
    });
  }

  // --- Lines for Napkins ---
  const napLines = [
    { name: "خط مناديل جيب", type: "تعبئة", capacityPerHour: 300, hoursPerDay: 16 },
    { name: "خط مناديل مطبخ", type: "تعبئة", capacityPerHour: 250, hoursPerDay: 16 },
  ];

  for (const line of napLines) {
    await prisma.line.upsert({
      where: { id: `line-nap-${line.name.replace(/\s/g, "-")}` },
      update: {},
      create: {
        id: `line-nap-${line.name.replace(/\s/g, "-")}`,
        factoryId: napkins.id,
        ...line,
        suitableProductIds: "[]",
      },
    });
  }

  // --- Lines for Cardboard ---
  const cbLines = [
    { name: "خط كرتون مموج", type: "تحويل", capacityPerHour: 1000, hoursPerDay: 16 },
    { name: "خط قص وتجعيد", type: "تشطيب", capacityPerHour: 800, hoursPerDay: 16 },
    { name: "خط طباعة", type: "طباعة", capacityPerHour: 600, hoursPerDay: 16 },
  ];

  for (const line of cbLines) {
    await prisma.line.upsert({
      where: { id: `line-cb-${line.name.replace(/\s/g, "-")}` },
      update: {},
      create: {
        id: `line-cb-${line.name.replace(/\s/g, "-")}`,
        factoryId: cardboard.id,
        ...line,
        suitableProductIds: "[]",
      },
    });
  }

  console.log("✅ Lines created");

  // --- Raw Materials ---
  const rawMaterials = [
    { id: "rm-milk", name: "حليب بودرة", unit: "كغم", unitCost: 4.5, currentStock: 2000, safetyStockDays: 7, leadTimeDays: 5, supplier: "مورد ألبان" },
    { id: "rm-sugar", name: "سكر", unit: "كغم", unitCost: 1.2, currentStock: 5000, safetyStockDays: 14, leadTimeDays: 3, supplier: "شركة سكر" },
    { id: "rm-cream", name: "كريمة نباتية", unit: "كغم", unitCost: 3.0, currentStock: 1000, safetyStockDays: 7, leadTimeDays: 7, supplier: "مورد كريمة" },
    { id: "rm-flavor", name: "نكهات", unit: "لتر", unitCost: 8.0, currentStock: 200, safetyStockDays: 30, leadTimeDays: 14, supplier: "شركة نكهات" },
    { id: "rm-cups", name: "أكواب آيس كريم", unit: "حبة", unitCost: 0.15, currentStock: 50000, safetyStockDays: 14, leadTimeDays: 10, supplier: "مورد تغليف" },
    { id: "rm-cones", name: "كونو", unit: "حبة", unitCost: 0.2, currentStock: 30000, safetyStockDays: 14, leadTimeDays: 10, supplier: "مورد كونو" },
    { id: "rm-pulp", name: "لب الورق", unit: "كغم", unitCost: 1.8, currentStock: 8000, safetyStockDays: 14, leadTimeDays: 7, supplier: "مورد ورق" },
    { id: "rm-facial-tissue", name: "ورق وجه", unit: "كغم", unitCost: 2.2, currentStock: 5000, safetyStockDays: 14, leadTimeDays: 7, supplier: "مورد ورق" },
    { id: "rm-kraft", name: "ورق كرافت", unit: "كغم", unitCost: 1.5, currentStock: 15000, safetyStockDays: 14, leadTimeDays: 10, supplier: "مورد كرافت" },
    { id: "rm-corrugated", name: "ورق مموج جاهز", unit: "متر مربع", unitCost: 2.5, currentStock: 20000, safetyStockDays: 10, leadTimeDays: 7, supplier: "مورد كرتون" },
    { id: "rm-ink", name: "حبر طباعة", unit: "لتر", unitCost: 5.0, currentStock: 100, safetyStockDays: 30, leadTimeDays: 14, supplier: "شركة أحبار" },
    { id: "rm-glue", name: "غراء", unit: "لتر", unitCost: 1.0, currentStock: 500, safetyStockDays: 20, leadTimeDays: 7, supplier: "مورد غراء" },
  ];

  for (const rm of rawMaterials) {
    await prisma.rawMaterial.upsert({
      where: { id: rm.id },
      update: {},
      create: rm,
    });
  }

  console.log("✅ Raw materials created");

  // --- Products ---
  // Ice Cream 1 Products
  const ic1Product1 = await prisma.product.upsert({
    where: { code: "IC1-CUP-100" },
    update: {},
    create: {
      id: "prod-ic1-cup",
      factoryId: iceCream1.id,
      name: "آيس كريم كأس 100مل",
      code: "IC1-CUP-100",
      unit: "حبة",
      priceCustomer: 1.5,
      priceWholesale: 1.0,
      priceSupermarket: 1.2,
      moq: 1000,
      setupTimeMinutes: 30,
      contributionMargin: 35,
    },
  });

  const ic1Product2 = await prisma.product.upsert({
    where: { code: "IC1-CONE-80" },
    update: {},
    create: {
      id: "prod-ic1-cone",
      factoryId: iceCream1.id,
      name: "آيس كريم كونو 80مل",
      code: "IC1-CONE-80",
      unit: "حبة",
      priceCustomer: 2.0,
      priceWholesale: 1.5,
      priceSupermarket: 1.7,
      moq: 500,
      setupTimeMinutes: 20,
      contributionMargin: 40,
    },
  });

  // Ice Cream 2 Products
  const ic2Product1 = await prisma.product.upsert({
    where: { code: "IC2-FAM-2L" },
    update: {},
    create: {
      id: "prod-ic2-family",
      factoryId: iceCream2.id,
      name: "آيس كريم فاميلي 2لتر",
      code: "IC2-FAM-2L",
      unit: "حبة",
      priceCustomer: 5.0,
      priceWholesale: 3.5,
      priceSupermarket: 4.0,
      moq: 200,
      setupTimeMinutes: 45,
      contributionMargin: 30,
    },
  });

  const ic2Product2 = await prisma.product.upsert({
    where: { code: "IC2-SND-100" },
    update: {},
    create: {
      id: "prod-ic2-sandwich",
      factoryId: iceCream2.id,
      name: "ساندويتش آيس كريم",
      code: "IC2-SND-100",
      unit: "حبة",
      priceCustomer: 1.8,
      priceWholesale: 1.2,
      priceSupermarket: 1.4,
      moq: 1000,
      setupTimeMinutes: 25,
      contributionMargin: 38,
    },
  });

  // Napkins Products
  const napProduct1 = await prisma.product.upsert({
    where: { code: "NAP-PKT-10" },
    update: {},
    create: {
      id: "prod-nap-pocket",
      factoryId: napkins.id,
      name: "مناديل جيب 10 مناديل",
      code: "NAP-PKT-10",
      unit: "كرتونة",
      priceCustomer: 12.0,
      priceWholesale: 8.0,
      priceSupermarket: 10.0,
      moq: 50,
      setupTimeMinutes: 40,
      contributionMargin: 25,
    },
  });

  const napProduct2 = await prisma.product.upsert({
    where: { code: "NAP-KIT-50" },
    update: {},
    create: {
      id: "prod-nap-kitchen",
      factoryId: napkins.id,
      name: "مناديل مطبخ 50 ورقة",
      code: "NAP-KIT-50",
      unit: "كرتونة",
      priceCustomer: 15.0,
      priceWholesale: 10.0,
      priceSupermarket: 12.0,
      moq: 50,
      setupTimeMinutes: 35,
      contributionMargin: 28,
    },
  });

  // Cardboard Products
  const cbProduct1 = await prisma.product.upsert({
    where: { code: "CART-BOX-40x30" },
    update: {},
    create: {
      id: "prod-cb-box",
      factoryId: cardboard.id,
      name: "صندوق كرتون 40×30×20سم",
      code: "CART-BOX-40x30",
      unit: "حبة",
      priceCustomer: 3.5,
      priceWholesale: 2.5,
      moq: 500,
      setupTimeMinutes: 60,
      contributionMargin: 20,
    },
  });

  const cbProduct2 = await prisma.product.upsert({
    where: { code: "CART-SHT-120x100" },
    update: {},
    create: {
      id: "prod-cb-sheet",
      factoryId: cardboard.id,
      name: "لوح كرتون مضلج 120×100سم",
      code: "CART-SHT-120x100",
      unit: "لوح",
      priceCustomer: 8.0,
      priceWholesale: 5.5,
      moq: 200,
      setupTimeMinutes: 45,
      contributionMargin: 22,
    },
  });

  console.log("✅ Products created");

  // --- BOM Items ---
  // Ice Cream Cup BOM
  const ic1CupBom = [
    { rawMaterialId: "rm-milk", quantity: 100, batchSize: 1000 },
    { rawMaterialId: "rm-sugar", quantity: 80, batchSize: 1000 },
    { rawMaterialId: "rm-cream", quantity: 50, batchSize: 1000 },
    { rawMaterialId: "rm-flavor", quantity: 5, batchSize: 1000 },
    { rawMaterialId: "rm-cups", quantity: 1000, batchSize: 1000 },
  ];

  for (const bom of ic1CupBom) {
    await prisma.bomItem.upsert({
      where: { id: `bom-ic1-cup-${bom.rawMaterialId}` },
      update: {},
      create: {
        id: `bom-ic1-cup-${bom.rawMaterialId}`,
        productId: ic1Product1.id,
        ...bom,
      },
    });
  }

  // Ice Cream Cone BOM
  const ic1ConeBom = [
    { rawMaterialId: "rm-milk", quantity: 80, batchSize: 1000 },
    { rawMaterialId: "rm-sugar", quantity: 60, batchSize: 1000 },
    { rawMaterialId: "rm-cream", quantity: 40, batchSize: 1000 },
    { rawMaterialId: "rm-flavor", quantity: 4, batchSize: 1000 },
    { rawMaterialId: "rm-cones", quantity: 1000, batchSize: 1000 },
  ];

  for (const bom of ic1ConeBom) {
    await prisma.bomItem.upsert({
      where: { id: `bom-ic1-cone-${bom.rawMaterialId}` },
      update: {},
      create: {
        id: `bom-ic1-cone-${bom.rawMaterialId}`,
        productId: ic1Product2.id,
        ...bom,
      },
    });
  }

  // Family Ice Cream BOM
  const ic2FamilyBom = [
    { rawMaterialId: "rm-milk", quantity: 300, batchSize: 200 },
    { rawMaterialId: "rm-sugar", quantity: 200, batchSize: 200 },
    { rawMaterialId: "rm-cream", quantity: 150, batchSize: 200 },
    { rawMaterialId: "rm-flavor", quantity: 8, batchSize: 200 },
  ];

  for (const bom of ic2FamilyBom) {
    await prisma.bomItem.upsert({
      where: { id: `bom-ic2-family-${bom.rawMaterialId}` },
      update: {},
      create: {
        id: `bom-ic2-family-${bom.rawMaterialId}`,
        productId: ic2Product1.id,
        ...bom,
      },
    });
  }

  // Napkin Pocket BOM
  const napPocketBom = [
    { rawMaterialId: "rm-facial-tissue", quantity: 100, batchSize: 50 },
    { rawMaterialId: "rm-pulp", quantity: 50, batchSize: 50 },
  ];

  for (const bom of napPocketBom) {
    await prisma.bomItem.upsert({
      where: { id: `bom-nap-pkt-${bom.rawMaterialId}` },
      update: {},
      create: {
        id: `bom-nap-pkt-${bom.rawMaterialId}`,
        productId: napProduct1.id,
        ...bom,
      },
    });
  }

  // Cardboard Box BOM
  const cbBoxBom = [
    { rawMaterialId: "rm-kraft", quantity: 200, batchSize: 500 },
    { rawMaterialId: "rm-corrugated", quantity: 500, batchSize: 500 },
    { rawMaterialId: "rm-glue", quantity: 10, batchSize: 500 },
  ];

  for (const bom of cbBoxBom) {
    await prisma.bomItem.upsert({
      where: { id: `bom-cb-box-${bom.rawMaterialId}` },
      update: {},
      create: {
        id: `bom-cb-box-${bom.rawMaterialId}`,
        productId: cbProduct1.id,
        ...bom,
      },
    });
  }

  // Cardboard Sheet BOM
  const cbSheetBom = [
    { rawMaterialId: "rm-kraft", quantity: 150, batchSize: 200 },
    { rawMaterialId: "rm-corrugated", quantity: 200, batchSize: 200 },
  ];

  for (const bom of cbSheetBom) {
    await prisma.bomItem.upsert({
      where: { id: `bom-cb-sht-${bom.rawMaterialId}` },
      update: {},
      create: {
        id: `bom-cb-sht-${bom.rawMaterialId}`,
        productId: cbProduct2.id,
        ...bom,
      },
    });
  }

  console.log("✅ BOM items created");

  // Update suitableProductIds for lines
  // Ice Cream 1 - Line 1 suitable for cups, Line 2 suitable for cones
  await prisma.line.update({
    where: { id: "line-ic1-خط-آيس-كريم-كأس" },
    data: { suitableProductIds: JSON.stringify([ic1Product1.id]) },
  });
  await prisma.line.update({
    where: { id: "line-ic1-خط-آيس-كريم-كونو" },
    data: { suitableProductIds: JSON.stringify([ic1Product2.id]) },
  });

  // Ice Cream 2
  await prisma.line.update({
    where: { id: "line-ic2-خط-آيس-كريم-فاميلي" },
    data: { suitableProductIds: JSON.stringify([ic2Product1.id]) },
  });
  await prisma.line.update({
    where: { id: "line-ic2-خط-ساندويتش-آيس-كريم" },
    data: { suitableProductIds: JSON.stringify([ic2Product2.id]) },
  });

  // Napkins
  await prisma.line.update({
    where: { id: "line-nap-خط-مناديل-جيب" },
    data: { suitableProductIds: JSON.stringify([napProduct1.id]) },
  });
  await prisma.line.update({
    where: { id: "line-nap-خط-مناديل-مطبخ" },
    data: { suitableProductIds: JSON.stringify([napProduct2.id]) },
  });

  // Cardboard - all lines suitable for both cardboard products
  await prisma.line.update({
    where: { id: "line-cb-خط-كرتون-مموج" },
    data: { suitableProductIds: JSON.stringify([cbProduct1.id, cbProduct2.id]) },
  });
  await prisma.line.update({
    where: { id: "line-cb-خط-قص-وتجعيد" },
    data: { suitableProductIds: JSON.stringify([cbProduct1.id, cbProduct2.id]) },
  });
  await prisma.line.update({
    where: { id: "line-cb-خط-طباعة" },
    data: { suitableProductIds: JSON.stringify([cbProduct1.id, cbProduct2.id]) },
  });

  console.log("✅ Line-product assignments done");

  // --- Set currentProductId for lines ---
  await prisma.line.update({
    where: { id: "line-ic1-خط-آيس-كريم-كأس" },
    data: { currentProductId: ic1Product1.id },
  });
  await prisma.line.update({
    where: { id: "line-ic1-خط-آيس-كريم-كونو" },
    data: { currentProductId: ic1Product2.id },
  });
  await prisma.line.update({
    where: { id: "line-ic2-خط-آيس-كريم-فاميلي" },
    data: { currentProductId: ic2Product1.id },
  });
  await prisma.line.update({
    where: { id: "line-ic2-خط-ساندويتش-آيس-كريم" },
    data: { currentProductId: ic2Product2.id },
  });
  await prisma.line.update({
    where: { id: "line-nap-خط-مناديل-جيب" },
    data: { currentProductId: napProduct1.id },
  });
  await prisma.line.update({
    where: { id: "line-nap-خط-مناديل-مطبخ" },
    data: { currentProductId: napProduct2.id },
  });
  console.log("✅ currentProductId set for all lines");

  // --- Sample Risks ---
  const sampleRisks = [
    { category: "سلسلة توريد", description: "نقص حليب بودرة بسبب تأخر الشحنات من المورد", probability: "محتمل", impact: "كبير", mitigationPlan: "التنسيق مع مورد بديل والحفاظ على مخزون أمان 14 يوم" },
    { category: "تشغيلي", description: "توقف خط الإنتاج الرئيسي في مصنع الكرتون", probability: "ممكن", impact: "كارثي", mitigationPlan: "جدولة صيانة دورية وتوفير قطع غيار أساسية" },
    { category: "مالي", description: "ارتفاع تكلفة المواد الخام بنسبة 20%", probability: "محتمل", impact: "متوسط", mitigationPlan: "التحوط بشراء كميات أكبر بعقود ثابتة" },
    { category: "استراتيجي", description: "دخول منافس جديد بسوق المناديل", probability: "ممكن", impact: "كبير", mitigationPlan: "تطوير منتجات متميزة وبرنامج ولاء عملاء" },
  ];

  for (const risk of sampleRisks) {
    await prisma.risk.create({
      data: {
        ...risk,
        classification: calculateRiskClass(risk.probability, risk.impact),
        status: "active",
      },
    });
  }
  console.log("✅ Sample risks created");

  // --- Sample Forecasts ---
  const sampleForecasts = [
    { productId: ic1Product1.id, period: "2026-Q3", horizon: "quarterly", optimistic: 150000, likely: 120000, pessimistic: 90000 },
    { productId: ic1Product2.id, period: "2026-Q3", horizon: "quarterly", optimistic: 80000, likely: 65000, pessimistic: 50000 },
    { productId: ic2Product1.id, period: "2026-Q3", horizon: "quarterly", optimistic: 60000, likely: 45000, pessimistic: 30000 },
    { productId: ic2Product2.id, period: "2026-Q3", horizon: "quarterly", optimistic: 100000, likely: 80000, pessimistic: 60000 },
    { productId: napProduct1.id, period: "2026-Q3", horizon: "quarterly", optimistic: 5000, likely: 4000, pessimistic: 3000 },
    { productId: napProduct2.id, period: "2026-Q3", horizon: "quarterly", optimistic: 4000, likely: 3000, pessimistic: 2000 },
    { productId: cbProduct1.id, period: "2026-Q3", horizon: "quarterly", optimistic: 30000, likely: 25000, pessimistic: 20000 },
    { productId: cbProduct2.id, period: "2026-Q3", horizon: "quarterly", optimistic: 15000, likely: 12000, pessimistic: 9000 },
  ];

  for (const f of sampleForecasts) {
    const existingForecast = await prisma.forecast.findFirst({
      where: { productId: f.productId, period: f.period },
    });
    if (!existingForecast) {
      await prisma.forecast.create({ data: f });
    }
  }
  console.log("✅ Sample forecasts created");

  // --- Sample Orders (cardboard) ---
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const orderDate = new Date(today);
    orderDate.setDate(orderDate.getDate() - i * 5);
    const reqDate = new Date(orderDate);
    reqDate.setDate(reqDate.getDate() + 14);
    const promDate = new Date(reqDate);
    promDate.setDate(promDate.getDate() - Math.floor(Math.random() * 3));

    await prisma.order.create({
      data: {
        productId: i % 2 === 0 ? cbProduct1.id : cbProduct2.id,
        customerName: ["شركة تعبئة", "مصنع ألبان", "شركة شحن", "مخازن كرم", "شركة مواد غذائية"][i],
        quantity: [1000, 500, 2000, 800, 1500][i],
        requestedDate: reqDate,
        promisedDate: promDate,
        ctpStatus: ["green", "green", "yellow", "green", "red"][i],
        status: i < 3 ? "confirmed" : i < 4 ? "delivered" : "draft",
      },
    });
  }
  console.log("✅ Sample orders created");

  // --- Sample Decisions ---
  const sampleDecisions = [
    { priority: "P0", title: "🔥 طلب شركة تعبئة بتصنيف CTP أصفر", description: "يتطلب موافقة على أوفرتايم لتلبية الطلب في الموعد المطلوب.", factoryId: cardboard.id },
    { priority: "P1", title: "⚠️ مخزون حليب بودرة أقل من الحد الآمن", description: "المخزون الحالي 2000 كغم، الحد الآمن 3500 كغم. المهلة 5 أيام.", factoryId: iceCream1.id },
    { priority: "P2", title: "📋 مراجعة أسعار المناديل للموسم القادم", description: "ارتفاع تكلفة لب الورق بنسبة 8% — يلزم تعديل الأسعار.", factoryId: napkins.id },
  ];

  for (const d of sampleDecisions) {
    await prisma.decisionItem.create({
      data: {
        ...d,
        status: "open",
      },
    });
  }
  console.log("✅ Sample decisions created");

  console.log("🎉 Seed complete!");

function calculateRiskClass(probability: string, impact: string): string {
  const matrix: Record<string, Record<string, string>> = {
    "نادراً": { "طفيف": "منخفض", "متوسط": "منخفض", "كبير": "متوسط", "كارثي": "مرتفع" },
    "ممكن": { "طفيف": "منخفض", "متوسط": "متوسط", "كبير": "مرتفع", "كارثي": "حرج" },
    "محتمل": { "طفيف": "متوسط", "متوسط": "مرتفع", "كبير": "حرج", "كارثي": "حرج" },
    "شبه مؤكد": { "طفيف": "متوسط", "متوسط": "مرتفع", "كبير": "حرج", "كارثي": "حرج" },
  };
  return matrix[probability]?.[impact] || "متوسط";
}
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
