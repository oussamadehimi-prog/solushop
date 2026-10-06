import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.campaignEvent.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shippingRate.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin Boutique",
      email: "admin@shop.com",
      phone: "+213555000111",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.category.createMany({
    data: [
      { name: "Audio", slug: "audio", description: "Casques, enceintes et audio", image: "/images/categories/audio.jpg" },
      { name: "Smartphone", slug: "smartphone", description: "Téléphones premium", image: "/images/categories/smartphone.jpg" },
      { name: "Maison", slug: "maison", description: "Produits du quotidien", image: "/images/categories/maison.jpg" },
      { name: "Mode", slug: "mode", description: "Vêtements et accessoires", image: "/images/categories/mode.jpg" },
      { name: "Sport", slug: "sport", description: "Accessoires pour le sport", image: "/images/categories/sport.jpg" },
    ],
  });

  const categoryList = await prisma.category.findMany();

  const products = [
    {
      name: "Casque Bluetooth Pro X",
      slug: "casque-bluetooth-pro-x",
      description: "Casque sans fil avec réduction de bruit active, autonomie 30h et appel mains libres.",
      shortDescription: "Audio premium",
      price: 14900,
      oldPrice: 18900,
      promoPrice: 14900,
      sku: "HP-001",
      brand: "Horizon",
      stock: 38,
      active: true,
      featured: true,
      categoryId: categoryList[0].id,
      images: {
        create: [
          { url: "/images/products/headphones-1.jpg", alt: "Casque 1", isPrimary: true },
          { url: "/images/products/headphones-2.jpg", alt: "Casque 2" },
        ],
      },
      variants: {
        create: [
          { name: "Couleur", value: "Noir", price: 14900, stock: 20 },
          { name: "Couleur", value: "Blanc", price: 15400, stock: 18 },
        ],
      },
    },
    {
      name: "Smartphone Nova 12",
      slug: "smartphone-nova-12",
      description: "Téléphone polyvalent, écran AMOLED 6.7, 128 Go, appareil photo triple, batterie 5000mAh.",
      shortDescription: "Performance et photo",
      price: 42900,
      oldPrice: 49900,
      promoPrice: 42900,
      sku: "SN-012",
      brand: "NovaTech",
      stock: 22,
      active: true,
      featured: true,
      categoryId: categoryList[1].id,
      images: {
        create: [
          { url: "/images/products/phone-1.jpg", alt: "Téléphone 1", isPrimary: true },
          { url: "/images/products/phone-2.jpg", alt: "Téléphone 2" },
        ],
      },
      variants: {
        create: [
          { name: "Mémoire", value: "128 Go", price: 42900, stock: 12 },
          { name: "Mémoire", value: "256 Go", price: 46900, stock: 10 },
        ],
      },
    },
    {
      name: "Lampe Connectée Glow",
      slug: "lampe-connectee-glow",
      description: "Lampe intelligente avec contrôle vocal, intensité réglable et ambiance personnalisable.",
      shortDescription: "Ambiance moderne",
      price: 9800,
      oldPrice: 12000,
      promoPrice: 9800,
      sku: "HM-101",
      brand: "GlowHome",
      stock: 30,
      active: true,
      featured: false,
      categoryId: categoryList[2].id,
      images: {
        create: [
          { url: "/images/products/lamp-1.jpg", alt: "Lampe 1", isPrimary: true },
          { url: "/images/products/lamp-2.jpg", alt: "Lampe 2" },
        ],
      },
      variants: {
        create: [
          { name: "Couleur", value: "Blanc", price: 9800, stock: 15 },
          { name: "Couleur", value: "Noir", price: 10200, stock: 15 },
        ],
      },
    },
    {
      name: "T-shirt Premium Cotton",
      slug: "t-shirt-premium-cotton",
      description: "T-shirt premium en coton biologique pour un confort daily avec coupe moderne.",
      shortDescription: "Style quotidien",
      price: 3900,
      oldPrice: 5200,
      promoPrice: 3900,
      sku: "MD-201",
      brand: "UrbanFit",
      stock: 88,
      active: true,
      featured: false,
      categoryId: categoryList[3].id,
      images: {
        create: [
          { url: "/images/products/tshirt-1.jpg", alt: "T-shirt 1", isPrimary: true },
          { url: "/images/products/tshirt-2.jpg", alt: "T-shirt 2" },
        ],
      },
      variants: {
        create: [
          { name: "Taille", value: "S", price: 3900, stock: 20 },
          { name: "Taille", value: "M", price: 3900, stock: 24 },
          { name: "Taille", value: "L", price: 3900, stock: 22 },
          { name: "Taille", value: "XL", price: 3900, stock: 22 },
        ],
      },
    },
    {
      name: "Bouteille d'eau Sport 750ml",
      slug: "bouteille-eau-sport-750ml",
      description: "Bouteille légère, isolante et anti-fuite parfaite pour les entraînements et déplacements.",
      shortDescription: "Hydratation active",
      price: 2200,
      oldPrice: 3000,
      promoPrice: 2200,
      sku: "SP-301",
      brand: "Motion",
      stock: 64,
      active: true,
      featured: false,
      categoryId: categoryList[4].id,
      images: {
        create: [
          { url: "/images/products/bottle-1.jpg", alt: "Bouteille 1", isPrimary: true },
          { url: "/images/products/bottle-2.jpg", alt: "Bouteille 2" },
        ],
      },
      variants: {
        create: [
          { name: "Couleur", value: "Bleu", price: 2200, stock: 32 },
          { name: "Couleur", value: "Noir", price: 2200, stock: 32 },
        ],
      },
    },
    {
      name: "Enceinte Portable Mini",
      slug: "enceinte-portable-mini",
      description: "Son puissant, résistance IPX7 et batterie longue durée pour un usage intérieur et extérieur.",
      shortDescription: "Musique nomade",
      price: 16900,
      oldPrice: 20900,
      promoPrice: 16900,
      sku: "HP-002",
      brand: "EchoWave",
      stock: 18,
      active: true,
      featured: false,
      categoryId: categoryList[0].id,
      images: {
        create: [
          { url: "/images/products/speaker-1.jpg", alt: "Enceinte 1", isPrimary: true },
          { url: "/images/products/speaker-2.jpg", alt: "Enceinte 2" },
        ],
      },
      variants: {
        create: [
          { name: "Couleur", value: "Rouge", price: 16900, stock: 10 },
          { name: "Couleur", value: "Noir", price: 16900, stock: 8 },
        ],
      },
    },
    {
      name: "Chargeur Rapide 65W",
      slug: "chargeur-rapide-65w",
      description: "Chargeur compact USB-C avec alimentation rapide, compatible multi-appareils.",
      shortDescription: "Charge rapide",
      price: 4400,
      oldPrice: 5600,
      promoPrice: 4400,
      sku: "AC-001",
      brand: "Voltix",
      stock: 72,
      active: true,
      featured: false,
      categoryId: categoryList[1].id,
      images: {
        create: [
          { url: "/images/products/charger-1.jpg", alt: "Chargeur 1", isPrimary: true },
          { url: "/images/products/charger-2.jpg", alt: "Chargeur 2" },
        ],
      },
      variants: {
        create: [
          { name: "Type", value: "USB-C", price: 4400, stock: 42 },
          { name: "Type", value: "USB-A", price: 4200, stock: 30 },
        ],
      },
    },
    {
      name: "Sac à Dos Urbain",
      slug: "sac-a-dos-urbain",
      description: "Sac à dos polyvalent avec espace ordinateur portable, waterproof et compartiments pratiques.",
      shortDescription: "Tous les jours",
      price: 7200,
      oldPrice: 9000,
      promoPrice: 7200,
      sku: "MD-301",
      brand: "NorthPack",
      stock: 40,
      active: true,
      featured: false,
      categoryId: categoryList[3].id,
      images: {
        create: [
          { url: "/images/products/bag-1.jpg", alt: "Sac 1", isPrimary: true },
          { url: "/images/products/bag-2.jpg", alt: "Sac 2" },
        ],
      },
      variants: {
        create: [
          { name: "Couleur", value: "Noir", price: 7200, stock: 20 },
          { name: "Couleur", value: "Gris", price: 7200, stock: 20 },
        ],
      },
    },
    {
      name: "Coffret de Cuisine Deluxe",
      slug: "coffret-cuisine-deluxe",
      description: "Ensemble de casseroles, poêles et ustensiles pour des repas élégants à la maison.",
      shortDescription: "Cuisine premium",
      price: 12900,
      oldPrice: 15000,
      promoPrice: 12900,
      sku: "HM-200",
      brand: "Maison Plus",
      stock: 26,
      active: true,
      featured: false,
      categoryId: categoryList[2].id,
      images: {
        create: [
          { url: "/images/products/kitchen-1.jpg", alt: "Cuisine 1", isPrimary: true },
          { url: "/images/products/kitchen-2.jpg", alt: "Cuisine 2" },
        ],
      },
      variants: {
        create: [
          { name: "Pack", value: "Standard", price: 12900, stock: 12 },
          { name: "Pack", value: "Pro", price: 15900, stock: 14 },
        ],
      },
    },
    {
      name: "Ballon de Fitness Elite",
      slug: "ballon-fitness-elite",
      description: "Ballon de yoga premium, anti-déchirure, idéal pour entrainements et étirements.",
      shortDescription: "Fitness maison",
      price: 5100,
      oldPrice: 6800,
      promoPrice: 5100,
      sku: "SP-401",
      brand: "CoreFit",
      stock: 51,
      active: true,
      featured: false,
      categoryId: categoryList[4].id,
      images: {
        create: [
          { url: "/images/products/yoga-1.jpg", alt: "Ballon 1", isPrimary: true },
          { url: "/images/products/yoga-2.jpg", alt: "Ballon 2" },
        ],
      },
      variants: {
        create: [
          { name: "Taille", value: "M", price: 5100, stock: 25 },
          { name: "Taille", value: "L", price: 5300, stock: 26 },
        ],
      },
    },
    {
      name: "Montre Sport Connect",
      slug: "montre-sport-connect",
      description: "Montre connectée avec suivi sportif, santé, notifications et autonomie jusqu’à 10 jours.",
      shortDescription: "Performance & santé",
      price: 23900,
      oldPrice: 28900,
      promoPrice: 23900,
      sku: "SP-501",
      brand: "PulseX",
      stock: 15,
      active: true,
      featured: true,
      categoryId: categoryList[4].id,
      images: {
        create: [
          { url: "/images/products/watch-1.jpg", alt: "Montre 1", isPrimary: true },
          { url: "/images/products/watch-2.jpg", alt: "Montre 2" },
        ],
      },
      variants: {
        create: [
          { name: "Bracelet", value: "Noir", price: 23900, stock: 7 },
          { name: "Bracelet", value: "Gris", price: 24900, stock: 8 },
        ],
      },
    },
    {
      name: "Écouteurs Intra Auriculaire",
      slug: "ecouteurs-intra-auriculaire",
      description: "Écouteurs compacts offrant un son immersif et un confort parfait pour les trajets.",
      shortDescription: "Portable & discret",
      price: 6900,
      oldPrice: 8800,
      promoPrice: 6900,
      sku: "HP-003",
      brand: "AirBeat",
      stock: 44,
      active: true,
      featured: false,
      categoryId: categoryList[0].id,
      images: {
        create: [
          { url: "/images/products/earbuds-1.jpg", alt: "Écouteurs 1", isPrimary: true },
          { url: "/images/products/earbuds-2.jpg", alt: "Écouteurs 2" },
        ],
      },
      variants: {
        create: [
          { name: "Couleur", value: "Blanc", price: 6900, stock: 20 },
          { name: "Couleur", value: "Noir", price: 6900, stock: 24 },
        ],
      },
    },
    {
      name: "Smartwatch Luxe S7",
      slug: "smartwatch-luxe-s7",
      description: "Montre connectée premium avec écran OLED, suivi de sommeil et design élégant.",
      shortDescription: "Style premium",
      price: 28900,
      oldPrice: 34900,
      promoPrice: 28900,
      sku: "SW-007",
      brand: "Luma",
      stock: 11,
      active: true,
      featured: true,
      categoryId: categoryList[4].id,
      images: {
        create: [
          { url: "/images/products/smartwatch-1.jpg", alt: "Smartwatch 1", isPrimary: true },
          { url: "/images/products/smartwatch-2.jpg", alt: "Smartwatch 2" },
        ],
      },
      variants: {
        create: [
          { name: "Bracelet", value: "Argent", price: 28900, stock: 6 },
          { name: "Bracelet", value: "Or", price: 32900, stock: 5 },
        ],
      },
    },
    {
      name: "Télévision 4K 55''",
      slug: "television-4k-55",
      description: "Grande image 4K, processeur intelligent, audio immersif et smart TV intégré.",
      shortDescription: "Confort visuel",
      price: 63900,
      oldPrice: 78900,
      promoPrice: 63900,
      sku: "HM-305",
      brand: "VisionMax",
      stock: 13,
      active: true,
      featured: true,
      categoryId: categoryList[2].id,
      images: {
        create: [
          { url: "/images/products/tv-1.jpg", alt: "TV 1", isPrimary: true },
          { url: "/images/products/tv-2.jpg", alt: "TV 2" },
        ],
      },
      variants: {
        create: [
          { name: "Taille", value: "55''", price: 63900, stock: 8 },
          { name: "Taille", value: "65''", price: 78900, stock: 5 },
        ],
      },
    },
  ];

  for (const item of products) {
    await prisma.product.create({ data: item });
  }

  const createdProducts = await prisma.product.findMany();

  await prisma.review.createMany({
    data: [
      { userId: admin.id, productId: createdProducts[0].id, rating: 5, comment: "Excellent produit, très bon son.", approved: true },
      { userId: admin.id, productId: createdProducts[1].id, rating: 4, comment: "Très bon appareil, batterie solide.", approved: true },
      { userId: admin.id, productId: createdProducts[3].id, rating: 5, comment: "Confortable et beau design.", approved: true },
    ],
  });

  await prisma.shippingRate.createMany({
    data: [
      { wilaya: "Alger", cost: 400 },
      { wilaya: "Bouira", cost: 500 },
      { wilaya: "Blida", cost: 450 },
      { wilaya: "Oran", cost: 700 },
      { wilaya: "Constantine", cost: 600 },
    ],
  });

  await prisma.coupon.createMany({
    data: [
      { code: "WELCOME10", type: "percentage", value: 10, minOrder: 5000, usageLimit: 100, active: true },
      { code: "SAVE200", type: "fixed", value: 200, minOrder: 10000, usageLimit: 50, active: true },
    ],
  });

  await prisma.promotion.createMany({
    data: [
      {
        name: "Promo été",
        type: "percentage",
        value: 15,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        active: true,
        productIds: createdProducts.slice(0, 4).map((p) => p.id).join(","),
      },
    ],
  });

  const orderNumber = `CMD-${String(10001).padStart(5, "0")}`;
  const order = await prisma.order.create({
    data: {
      number: orderNumber,
      userId: null,
      status: "DELIVERED",
      subtotal: 44600,
      shippingFee: 400,
      discount: 700,
      total: 44200,
      source: "facebook",
      campaign: "summer2026",
      ad: "product01",
      customerName: "Client de démonstration",
      phone: "+213555000222",
      email: null,
      wilaya: "Alger",
      commune: "Hydra",
      address: "12 Rue de la Liberté",
      note: "Livraison rapide",
      paymentMethod: "COD",
      items: {
        create: [
          { productId: createdProducts[0].id, variant: "Noir", quantity: 1, price: 14900, total: 14900 },
          { productId: createdProducts[1].id, variant: "128 Go", quantity: 1, price: 42900, total: 42900 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      method: "COD",
      status: "PENDING",
      reference: "PAY-1001",
    },
  });

  await prisma.notification.createMany({
    data: [
      { userId: admin.id, title: "Nouvelle commande", message: "Une nouvelle commande a été reçue.", type: "order" },
    ],
  });

  await prisma.campaignEvent.createMany({
    data: [
      { userId: null, productId: createdProducts[0].id, type: "VISIT", source: "facebook", campaign: "summer2026", ad: "product01" },
      { userId: null, productId: createdProducts[1].id, type: "ADD_TO_CART", source: "instagram", campaign: "summer2026", ad: "product02" },
      { userId: null, productId: createdProducts[0].id, type: "ORDER", source: "facebook", campaign: "summer2026", ad: "product01" },
    ],
  });

  console.log("Database seeded with demo store data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
