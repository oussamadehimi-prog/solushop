import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_PRODUCT_IMAGE_TYPES,
  getProductStoragePath,
  MAX_PRODUCT_IMAGE_SIZE,
  removeProductImages,
  uploadProductImage,
} from "@/lib/supabase-storage";
import { slugify } from "@/lib/utils";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2),
  categoryId: z.string().min(1),
  brand: z.string().trim().max(100).optional().or(z.literal("")),
  sku: z.string().trim().min(1).max(80),
  price: z.coerce.number().positive(),
  oldPrice: z.coerce.number().nonnegative().nullable().optional(),
  promoPrice: z.coerce.number().nonnegative().nullable().optional(),
  stock: z.coerce.number().int().nonnegative(),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
  active: z.boolean().default(true),
  image: z.string().trim().max(500).optional().or(z.literal("")),
});

type ProductInput = z.infer<typeof productSchema>;

async function authorized() {
  return Boolean(await getAdminSession());
}

function productData(data: ProductInput) {
  return {
    name: data.name,
    description: data.description,
    categoryId: data.categoryId,
    brand: data.brand || null,
    sku: data.sku,
    price: data.price,
    oldPrice: data.oldPrice ?? null,
    promoPrice: data.promoPrice ?? null,
    stock: data.stock,
    lowStockThreshold: data.lowStockThreshold,
    active: data.active,
  };
}

function getFileExtension(file: File) {
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const originalName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${randomUUID()}-${originalName || "image"}.${extension}`;
}

function getFiles(form: FormData) {
  return form
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function validateFiles(files: File[]) {
  const invalidType = files.find((file) => !ALLOWED_PRODUCT_IMAGE_TYPES.has(file.type));
  if (invalidType) {
    return "Formats acceptés : JPG, JPEG, PNG et WEBP.";
  }

  const tooLarge = files.find((file) => file.size > MAX_PRODUCT_IMAGE_SIZE);
  if (tooLarge) {
    return "Chaque image doit faire au maximum 5 Mo.";
  }

  return null;
}

async function parseRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const value = (name: string) => {
      const entry = form.get(name);
      return typeof entry === "string" ? entry : null;
    };
    const data = {
      id: typeof value("id") === "string" ? value("id") : undefined,
      name: value("name"),
      description: value("description"),
      categoryId: value("categoryId"),
      brand: value("brand"),
      sku: value("sku"),
      price: value("price"),
      oldPrice: value("oldPrice") || null,
      promoPrice: value("promoPrice") || null,
      stock: value("stock"),
      lowStockThreshold: value("lowStockThreshold") || "5",
      active: value("active") === "on",
      image: "",
    };

    return {
      data: productSchema.safeParse(data),
      files: getFiles(form),
      removeImageIds: form
        .getAll("removeImageIds")
        .filter((id): id is string => typeof id === "string"),
      primaryImageId:
        typeof value("primaryImageId") === "string" ? value("primaryImageId") : null,
    };
  }

  const body = await request.json();
  return {
    data: productSchema.safeParse(body),
    files: [] as File[],
    removeImageIds: [] as string[],
    primaryImageId: null,
  };
}

async function cleanupUploadedFiles(paths: string[]) {
  if (paths.length === 0) return;
  try {
    await removeProductImages(paths);
  } catch (error) {
    console.error("Supabase Storage cleanup failed", error);
  }
}

export async function GET(request: Request) {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() || undefined;
  const products = await prisma.product.findMany({
    where: search
      ? { OR: [{ name: { contains: search } }, { sku: { contains: search } }] }
      : undefined,
    include: { category: true, images: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const parsedRequest = await parseRequest(request);
  if (!parsedRequest.data.success || parsedRequest.data.data.id) {
    return NextResponse.json({ error: "Données produit invalides." }, { status: 400 });
  }

  const fileError = validateFiles(parsedRequest.files);
  if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });

  const data = parsedRequest.data.data;
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) return NextResponse.json({ error: "Catégorie introuvable." }, { status: 400 });

  const uploadedPaths: string[] = [];
  try {
    const product = await prisma.product.create({
      data: {
        ...productData(data),
        slug: `${slugify(data.name)}-${Date.now().toString(36)}`,
      },
    });

    const uploadedImages = [];
    for (const file of parsedRequest.files) {
      const path = `products/${product.id}/${getFileExtension(file)}`;
      uploadedPaths.push(path);
      uploadedImages.push({
        url: await uploadProductImage(path, file),
        alt: data.name,
        isPrimary: uploadedImages.length === 0,
      });
    }

    if (uploadedImages.length > 0 || data.image) {
      await prisma.productImage.createMany({
        data:
          uploadedImages.length > 0
            ? uploadedImages.map((image) => ({ ...image, productId: product.id }))
            : [{ productId: product.id, url: data.image!, alt: data.name, isPrimary: true }],
      });
    }

    return NextResponse.json(
      { product: await prisma.product.findUnique({ where: { id: product.id }, include: { images: true } }) },
      { status: 201 },
    );
  } catch (error) {
    await cleanupUploadedFiles(uploadedPaths);
    console.error("Admin product creation failed", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Le SKU existe déjà." }, { status: 409 });
    }
    return NextResponse.json({ error: "Impossible de créer le produit." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const parsedRequest = await parseRequest(request);
  if (!parsedRequest.data.success || !parsedRequest.data.data.id) {
    return NextResponse.json({ error: "Données produit invalides." }, { status: 400 });
  }

  const fileError = validateFiles(parsedRequest.files);
  if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });

  const data = parsedRequest.data.data;
  const id = data.id;
  if (!id) return NextResponse.json({ error: "Produit invalide." }, { status: 400 });
  const existing = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!existing) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });

  const removeIds = new Set(
    parsedRequest.removeImageIds.filter((imageId) =>
      existing.images.some((image) => image.id === imageId),
    ),
  );
  const uploadedPaths: string[] = [];

  try {
    const newImages: Array<{ url: string; alt: string }> = [];
    for (const file of parsedRequest.files) {
      const path = `products/${id}/${getFileExtension(file)}`;
      uploadedPaths.push(path);
      newImages.push({ url: await uploadProductImage(path, file), alt: data.name });
    }

    const retained = existing.images.filter((image) => !removeIds.has(image.id));
    const primaryId =
      parsedRequest.primaryImageId && retained.some((image) => image.id === parsedRequest.primaryImageId)
        ? parsedRequest.primaryImageId
        : retained.find((image) => image.isPrimary)?.id ?? retained[0]?.id ?? null;
    const hasPrimary = Boolean(primaryId) || newImages.length > 0;

    const product = await prisma.$transaction(async (transaction) => {
      await transaction.product.update({ where: { id }, data: productData(data) });
      if (removeIds.size > 0) {
        await transaction.productImage.deleteMany({ where: { id: { in: [...removeIds] }, productId: id } });
      }
      if (newImages.length > 0) {
        await transaction.productImage.createMany({
          data: newImages.map((image, index) => ({
            ...image,
            productId: id,
            isPrimary: !primaryId && index === 0,
          })),
        });
      }
      if (hasPrimary) {
        await transaction.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
        if (primaryId) {
          await transaction.productImage.update({ where: { id: primaryId }, data: { isPrimary: true } });
        } else if (newImages.length > 0) {
          const firstNew = await transaction.productImage.findFirst({
            where: { productId: id, url: newImages[0].url },
          });
          if (firstNew) await transaction.productImage.update({ where: { id: firstNew.id }, data: { isPrimary: true } });
        }
      }
      return transaction.product.findUnique({ where: { id }, include: { images: true } });
    });

    const removedPaths = existing.images
      .filter((image) => removeIds.has(image.id))
      .map((image) => getProductStoragePath(image.url))
      .filter((path): path is string => Boolean(path));
    try {
      await removeProductImages(removedPaths);
    } catch (error) {
      console.error("Old product image cleanup failed", error);
    }

    return NextResponse.json({ product });
  } catch (error) {
    await cleanupUploadedFiles(uploadedPaths);
    console.error("Admin product update failed", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Le SKU existe déjà." }, { status: 409 });
    }
    return NextResponse.json({ error: "Impossible de modifier le produit." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Produit invalide." }, { status: 400 });

  const linked = await prisma.orderItem.count({ where: { productId: parsed.data.id } });
  if (linked > 0) {
    const product = await prisma.product.update({ where: { id: parsed.data.id }, data: { active: false } });
    return NextResponse.json({ product, archived: true });
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.id }, include: { images: true } });
  if (!product) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  const paths = product.images
    .map((image) => getProductStoragePath(image.url))
    .filter((path): path is string => Boolean(path));

  try {
    await removeProductImages(paths);
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: product.id } }),
      prisma.product.delete({ where: { id: product.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin product deletion failed", error);
    return NextResponse.json({ error: "Impossible de supprimer le produit et ses images." }, { status: 500 });
  }
}
