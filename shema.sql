-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.User (
  id text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  passwordHash text NOT NULL,
  role text NOT NULL DEFAULT 'CUSTOMER'::text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT User_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Address (
  id text NOT NULL,
  userId text NOT NULL,
  fullName text NOT NULL,
  phone text,
  wilaya text NOT NULL,
  commune text NOT NULL,
  address text NOT NULL,
  isDefault boolean NOT NULL DEFAULT false,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Address_pkey PRIMARY KEY (id),
  CONSTRAINT Address_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.Category (
  id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  image text,
  active boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Category_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Product (
  id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL,
  shortDescription text,
  price double precision NOT NULL,
  oldPrice double precision,
  promoPrice double precision,
  sku text NOT NULL,
  brand text,
  stock integer NOT NULL DEFAULT 0,
  lowStockThreshold integer NOT NULL DEFAULT 5,
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  categoryId text NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT Product_pkey PRIMARY KEY (id),
  CONSTRAINT Product_categoryId_fkey FOREIGN KEY (categoryId) REFERENCES public.Category(id)
);
CREATE TABLE public.ProductImage (
  id text NOT NULL,
  productId text NOT NULL,
  url text NOT NULL,
  alt text,
  isPrimary boolean NOT NULL DEFAULT false,
  CONSTRAINT ProductImage_pkey PRIMARY KEY (id),
  CONSTRAINT ProductImage_productId_fkey FOREIGN KEY (productId) REFERENCES public.Product(id)
);
CREATE TABLE public.ProductVariant (
  id text NOT NULL,
  productId text NOT NULL,
  name text NOT NULL,
  value text NOT NULL,
  price double precision,
  stock integer NOT NULL DEFAULT 0,
  CONSTRAINT ProductVariant_pkey PRIMARY KEY (id),
  CONSTRAINT ProductVariant_productId_fkey FOREIGN KEY (productId) REFERENCES public.Product(id)
);
CREATE TABLE public.Cart (
  id text NOT NULL,
  userId text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT Cart_pkey PRIMARY KEY (id),
  CONSTRAINT Cart_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.CartItem (
  id text NOT NULL,
  cartId text NOT NULL,
  productId text NOT NULL,
  variant text,
  quantity integer NOT NULL DEFAULT 1,
  price double precision NOT NULL,
  CONSTRAINT CartItem_pkey PRIMARY KEY (id),
  CONSTRAINT CartItem_cartId_fkey FOREIGN KEY (cartId) REFERENCES public.Cart(id),
  CONSTRAINT CartItem_productId_fkey FOREIGN KEY (productId) REFERENCES public.Product(id)
);
CREATE TABLE public.Order (
  id text NOT NULL,
  number text NOT NULL,
  userId text,
  status text NOT NULL DEFAULT 'PENDING'::text,
  subtotal double precision NOT NULL,
  shippingFee double precision NOT NULL,
  discount double precision NOT NULL DEFAULT 0,
  total double precision NOT NULL,
  source text,
  campaign text,
  ad text,
  customerName text NOT NULL,
  phone text NOT NULL,
  email text,
  wilaya text NOT NULL,
  commune text NOT NULL,
  address text NOT NULL,
  note text,
  paymentMethod text NOT NULL DEFAULT 'COD'::text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rejectionReason text,
  CONSTRAINT Order_pkey PRIMARY KEY (id),
  CONSTRAINT Order_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.OrderItem (
  id text NOT NULL,
  orderId text NOT NULL,
  productId text NOT NULL,
  variant text,
  quantity integer NOT NULL,
  price double precision NOT NULL,
  total double precision NOT NULL,
  CONSTRAINT OrderItem_pkey PRIMARY KEY (id),
  CONSTRAINT OrderItem_orderId_fkey FOREIGN KEY (orderId) REFERENCES public.Order(id),
  CONSTRAINT OrderItem_productId_fkey FOREIGN KEY (productId) REFERENCES public.Product(id)
);
CREATE TABLE public.Payment (
  id text NOT NULL,
  orderId text NOT NULL,
  method text NOT NULL DEFAULT 'COD'::text,
  status text NOT NULL DEFAULT 'PENDING'::text,
  reference text,
  paidAt timestamp without time zone,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Payment_pkey PRIMARY KEY (id),
  CONSTRAINT Payment_orderId_fkey FOREIGN KEY (orderId) REFERENCES public.Order(id)
);
CREATE TABLE public.Promotion (
  id text NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  value double precision NOT NULL,
  startDate timestamp without time zone NOT NULL,
  endDate timestamp without time zone NOT NULL,
  active boolean NOT NULL DEFAULT true,
  productIds text NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Promotion_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Coupon (
  id text NOT NULL,
  code text NOT NULL,
  type text NOT NULL,
  value double precision NOT NULL,
  minOrder double precision,
  usageLimit integer,
  usedCount integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  startDate timestamp without time zone,
  endDate timestamp without time zone,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Coupon_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Review (
  id text NOT NULL,
  userId text NOT NULL,
  productId text NOT NULL,
  rating integer NOT NULL,
  comment text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Review_pkey PRIMARY KEY (id),
  CONSTRAINT Review_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id),
  CONSTRAINT Review_productId_fkey FOREIGN KEY (productId) REFERENCES public.Product(id)
);
CREATE TABLE public.ShippingRate (
  id text NOT NULL,
  wilaya text NOT NULL,
  cost double precision NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ShippingRate_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Notification (
  id text NOT NULL,
  userId text,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info'::text,
  read boolean NOT NULL DEFAULT false,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Notification_pkey PRIMARY KEY (id),
  CONSTRAINT Notification_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.CampaignEvent (
  id text NOT NULL,
  userId text,
  productId text,
  type text NOT NULL,
  source text,
  campaign text,
  ad text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT CampaignEvent_pkey PRIMARY KEY (id),
  CONSTRAINT CampaignEvent_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id),
  CONSTRAINT CampaignEvent_productId_fkey FOREIGN KEY (productId) REFERENCES public.Product(id)
);