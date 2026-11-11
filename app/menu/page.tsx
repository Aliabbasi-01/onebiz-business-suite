
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ImagePlus,
  Package,
  CheckCircle2,
  Eye,
  EyeOff,
  BriefcaseBusiness,
  Boxes,
  Wrench,
} from "lucide-react";

import {
  getProductsByBusinessType,
  saveBusinessProducts,
  type Product,
  type ProductType,
} from "@/lib/products";

import {
  getBusinessModules,
  type BusinessModules,
} from "@/lib/business-modules";

type BusinessType =
  | "restaurant"
  | "cafe"
  | "pizza"
  | "salon"
  | "retail"
  | "grocery"
  | "other";

type FormState = {
  name: string;
  type: ProductType;
  price: string;
  purchasePrice: string;
  category: string;
  description: string;
  image: string;
  available: boolean;
  sku: string;
  unit: string;
  trackInventory: boolean;
  stockQuantity: string;
  lowStockThreshold: string;
  barcode: string;
  expiryDate: string;
  durationMinutes: string;
  assignedStaff: string;
  batchNumber: string;
};

const validBusinessTypes: BusinessType[] = [
  "restaurant",
  "cafe",
  "pizza",
  "salon",
  "retail",
  "grocery",
  "other",
];

const categoryOptions: Record<BusinessType, string[]> = {
  restaurant: ["Burgers", "Pizza", "Sides", "Drinks", "Desserts", "Other"],
  cafe: ["Coffee", "Tea", "Snacks", "Drinks", "Desserts", "Other"],
  pizza: ["Pizza", "Sides", "Deals", "Drinks", "Desserts", "Other"],
  salon: [
    "Haircut",
    "Facial",
    "Hair Color",
    "Hair Care",
    "Skin Care",
    "Retail Products",
    "Other",
  ],
  retail: ["Clothing", "Electronics", "Accessories", "Home", "Beauty", "Other"],
  grocery: [
    "Fruits",
    "Vegetables",
    "Dairy",
    "Beverages",
    "Snacks",
    "Household",
    "Other",
  ],
  other: ["General", "Services", "Accessories", "Other"],
};

const emptyForm: FormState = {
  name: "",
  type: "Product",
  price: "",
  purchasePrice: "",
  category: "Other",
  description: "",
  image: "",
  available: true,
  sku: "",
  unit: "Piece",
  trackInventory: false,
  stockQuantity: "0",
  lowStockThreshold: "0",
  barcode: "",
  expiryDate: "",
  durationMinutes: "30",
  assignedStaff: "",
  batchNumber: "",
};

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [businessType, setBusinessType] =
    useState<BusinessType>("other");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeType, setActiveType] =
    useState<"All" | ProductType>("All");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const modules: BusinessModules = getBusinessModules(businessType);

  const hasBothTypes = modules.products && modules.services;

  const itemTitle = modules.menu
    ? "Menu Item"
    : modules.products && modules.services
      ? "Product / Service"
      : modules.services
        ? "Service"
        : "Product";

  const pageTitle = modules.menu
    ? "Menu Management"
    : hasBothTypes
      ? "Products & Services"
      : modules.services
        ? "Services"
        : "Products";

  const addButtonLabel = modules.menu
    ? "Add Menu Item"
    : modules.services && !modules.products
      ? "Add Service"
      : "Add New Item";

  useEffect(() => {
    const storedBusinessType = localStorage.getItem(
      "onebiz_business_type"
    );

    const currentBusinessType: BusinessType =
      storedBusinessType &&
      validBusinessTypes.includes(storedBusinessType as BusinessType)
        ? (storedBusinessType as BusinessType)
        : "other";

    setBusinessType(currentBusinessType);

    const businessProducts =
      getProductsByBusinessType(currentBusinessType);

    setProducts(businessProducts);

    const defaults = categoryOptions[currentBusinessType];

    const existing = businessProducts
      .map((product) => product.category)
      .filter(Boolean);

    setCategories(Array.from(new Set([...defaults, ...existing])));

    setLoaded(true);
  }, []);

  function updateProducts(updated: Product[]) {
    setProducts(updated);
    saveBusinessProducts(businessType, updated);
  }

  function getItemTypeLabel(type: ProductType) {
    if (modules.menu) return "Menu Item";
    return type;
  }

  function openAddModal() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      type: modules.services && !modules.products
        ? "Service"
        : "Product",
      category: categories[0] || "Other",
      trackInventory: modules.inventory,
    });

    setNewCategory("");
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      type: modules.menu
        ? "Product"
        : product.type || "Product",
      price: String(product.price),
      purchasePrice:
        product.purchasePrice !== undefined
          ? String(product.purchasePrice)
          : "",
      category: product.category,
      description: product.description,
      image: product.image,
      available: product.available,
      sku: product.sku || "",
      unit: product.unit || "Piece",
      trackInventory: product.trackInventory ?? false,
      stockQuantity: String(product.stockQuantity ?? 0),
      lowStockThreshold: String(product.lowStockThreshold ?? 0),
      barcode: product.barcode || "",
      expiryDate: product.expiryDate || "",
      durationMinutes: String(product.durationMinutes ?? 30),
      assignedStaff: product.assignedStaff?.join(", ") || "",
      batchNumber: product.batchNumber || "",
    });

    setNewCategory("");
    setShowModal(true);
  }

  function handleImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        image: String(reader.result),
      }));
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const price = Number(form.price);

    const purchasePrice =
      form.purchasePrice.trim() === ""
        ? undefined
        : Number(form.purchasePrice);
    const stockQuantity = Number(form.stockQuantity);
    const lowStockThreshold = Number(form.lowStockThreshold);

    if (!form.name.trim() || !Number.isFinite(price) || price <= 0) {
      alert("Please enter a name and a valid selling price.");
      return;
    }

    if (
      purchasePrice !== undefined &&
      (!Number.isFinite(purchasePrice) || purchasePrice < 0)
    ) {
      alert("Please enter a valid purchase price.");
      return;
    }
    if (
      !Number.isFinite(stockQuantity) ||
      stockQuantity < 0 ||
      !Number.isFinite(lowStockThreshold) ||
      lowStockThreshold < 0
    ) {
      alert("Please enter valid stock quantities.");
      return;
    }
    if (form.type === "Service" && Number(form.durationMinutes) <= 0) {
      alert("Service duration must be greater than zero.");
      return;
    }

    const category = newCategory.trim() || form.category;

    const existingProduct = products.find(
      (product) => product.id === editingId
    );

    // Restaurant, cafe and pizza always save as Product internally.
    // This keeps existing POS and KOT compatibility.
    const finalType: ProductType = modules.menu
      ? "Product"
      : modules.services && !modules.products
        ? "Service"
        : modules.products && !modules.services
          ? "Product"
          : form.type;

    const product: Product = {
      id: editingId || crypto.randomUUID(),
      name: form.name.trim(),
      price,
      category,
      description: form.description.trim(),
      image: form.image,
      available: form.available,
      createdAt:
        existingProduct?.createdAt || new Date().toISOString(),

      type: finalType,
      purchasePrice:
        finalType === "Product" ? purchasePrice : undefined,
      trackInventory:
        finalType === "Service" || !modules.inventory
          ? false
          : form.trackInventory,
      sku: form.sku.trim(),
      unit: form.unit,
      stockQuantity:
        finalType === "Product" && form.trackInventory
          ? stockQuantity
          : undefined,
      lowStockThreshold:
        finalType === "Product" && form.trackInventory
          ? lowStockThreshold
          : undefined,
      barcode: form.barcode.trim(),
      expiryDate: form.expiryDate,
      durationMinutes:
        finalType === "Service" ? Number(form.durationMinutes) || 30 : undefined,
      assignedStaff:
        finalType === "Service"
          ? form.assignedStaff.split(",").map((name) => name.trim()).filter(Boolean)
          : undefined,
      batchNumber: form.batchNumber.trim(),
      businessType,
    };

    const updated = editingId
      ? products.map((item) =>
          item.id === editingId ? product : item
        )
      : [product, ...products];

    if (newCategory.trim()) {
      setCategories((current) =>
        Array.from(new Set([...current, category]))
      );
    }

    updateProducts(updated);

    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setNewCategory("");
  }

  function deleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    updateProducts(
      products.filter((product) => product.id !== id)
    );
  }

  function toggleAvailability(product: Product) {
    updateProducts(
      products.map((item) =>
        item.id === product.id
          ? { ...item, available: !item.available }
          : item
      )
    );
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        (product.sku || "").toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === "All" ||
        product.category === activeCategory;

      const matchesType =
        activeType === "All" ||
        (product.type || "Product") === activeType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [products, search, activeCategory, activeType]);

  const availableCount = products.filter(
    (product) => product.available
  ).length;

  const serviceCount = products.filter(
    (product) => product.type === "Service"
  ).length;

  const inventoryCount = products.filter(
    (product) =>
      (product.type || "Product") === "Product" &&
      product.trackInventory
  ).length;

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
        Loading {pageTitle.toLowerCase()}...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600">
              <Package size={17} />
              {modules.menu ? "RESTAURANT MENU" : "BUSINESS CATALOG"}
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {pageTitle}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {modules.menu
                ? "Manage your food and drink menu in one place."
                : hasBothTypes
                  ? "Manage the products and services your business offers."
                  : modules.services
                    ? "Manage the services your business offers."
                    : "Manage the products your business sells."}
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
          >
            <Plus size={19} />
            {addButtonLabel}
          </button>
        </div>

        {/* Stats */}
        <div
          className={`grid grid-cols-2 gap-4 ${
            hasBothTypes ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          <StatCard
            icon={<Package size={21} />}
            label={modules.menu ? "Total Menu Items" : "Total Items"}
            value={products.length}
            color="indigo"
          />

          <StatCard
            icon={<CheckCircle2 size={21} />}
            label="Available"
            value={availableCount}
            color="green"
          />

          {modules.services && (
            <StatCard
              icon={<BriefcaseBusiness size={21} />}
              label="Services"
              value={serviceCount}
              color="blue"
            />
          )}

          {modules.inventory && (
            <StatCard
              icon={<Boxes size={21} />}
              label="Stock Tracked"
              value={inventoryCount}
              color="orange"
            />
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                modules.menu
                  ? "Search menu items..."
                  : "Search by name or SKU..."
              }
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
            />
          </div>

          {hasBothTypes && (
            <div className="flex flex-wrap gap-2">
              {(["All", "Product", "Service"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setActiveType(type);
                    setActiveCategory("All");
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    activeType === type
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {type === "All" ? "All Items" : `${type}s`}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", ...categories].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === category
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <Package size={30} />
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              {products.length === 0
                ? `Your ${modules.menu ? "menu" : "catalog"} is empty`
                : "No items found"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              {products.length === 0
                ? `Add your first ${itemTitle.toLowerCase()} to get started.`
                : "Try another search or category."}
            </p>

            {products.length === 0 && (
              <button
                onClick={openAddModal}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={17} className="mr-1 inline" />
                {addButtonLabel}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const type = product.type || "Product";

              return (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gray-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        {type === "Service" ? (
                          <Wrench size={34} />
                        ) : (
                          <ImagePlus size={34} />
                        )}
                        <span className="text-xs">No image uploaded</span>
                      </div>
                    )}

                    <span className="absolute left-3 top-3 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                      {getItemTypeLabel(type)}
                    </span>

                    <span
                      className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
                        product.available
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.available ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-gray-900">
                          {product.name}
                        </h3>

                        <p className="mt-1 text-xs font-medium text-indigo-600">
                          {product.category}
                        </p>
                      </div>

                      <p className="whitespace-nowrap font-bold text-gray-900">
                        Rs {product.price.toLocaleString("en-PK")}
                      </p>
                    </div>

                    <p className="min-h-10 text-sm text-gray-500">
                      {product.description || "No description added."}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {product.sku && (
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          SKU: {product.sku}
                        </span>
                      )}

                      {type === "Product" && modules.inventory && (
                        <span className="rounded-md bg-orange-50 px-2 py-1 text-xs text-orange-700">
                          {product.trackInventory
                            ? `Stock tracked • ${product.unit || "Piece"}`
                            : "No stock tracking"}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
                      <button
                        onClick={() => toggleAvailability(product)}
                        title="Toggle availability"
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                      >
                        {product.available ? (
                          <>
                            <EyeOff size={15} /> Disable
                          </>
                        ) : (
                          <>
                            <Eye size={15} /> Enable
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => openEditModal(product)}
                        className="flex items-center justify-center rounded-lg bg-indigo-50 px-3 py-2 text-indigo-600 hover:bg-indigo-100"
                        title="Edit item"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="flex items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
                        title="Delete item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId
                    ? "Edit Item"
                    : modules.menu
                      ? "Add Menu Item"
                      : modules.services && !modules.products
                        ? "Add Service"
                        : "Add New Item"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {modules.menu
                    ? "Add a food or drink item to your restaurant menu."
                    : "Add an item to your business catalog."}
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-5">

              {/* Item Type: Only shown when both are enabled */}
              {hasBothTypes && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Item Type *
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {(["Product", "Service"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            type,
                            trackInventory:
                              type === "Service"
                                ? false
                                : current.trackInventory,
                          }))
                        }
                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${
                          form.type === type
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {type === "Product" ? (
                          <Package size={18} />
                        ) : (
                          <Wrench size={18} />
                        )}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Image
                </label>

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-indigo-400"
                >
                  {form.image ? (
                    <img
                      src={form.image}
                      alt="Item preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImagePlus size={30} className="mx-auto mb-2" />
                      <p className="text-sm font-semibold">Upload Image</p>
                      <p className="mt-1 text-xs">PNG, JPG (Max 2 MB)</p>
                    </div>
                  )}
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  {modules.menu
                    ? "Menu Item Name *"
                    : `${form.type} Name *`}
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder={
                    modules.menu
                      ? "e.g. Chicken Burger, Zinger Pizza"
                      : form.type === "Product"
                        ? "e.g. Shampoo, T-Shirt"
                        : "e.g. Haircut, Facial"
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Selling Price (Rs) *
                  </label>

                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                    placeholder="650"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                {form.type === "Product" && !modules.menu && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Purchase Price (Rs)
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.purchasePrice}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          purchasePrice: event.target.value,
                        })
                      }
                      placeholder="Optional"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Category
                  </label>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {!modules.menu && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      SKU / Item Code
                    </label>

                    <input
                      value={form.sku}
                      onChange={(event) =>
                        setForm({ ...form, sku: event.target.value })
                      }
                      placeholder="e.g. PRD-001"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Custom Category */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Or Create New Category
                </label>

                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="e.g. Breakfast, Hair Treatment"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Unit and Inventory */}
              {form.type === "Product" && modules.inventory && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Unit
                    </label>

                    <select
                      value={form.unit}
                      onChange={(event) =>
                        setForm({ ...form, unit: event.target.value })
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    >
                      {[
                        "Piece",
                        "Kg",
                        "Gram",
                        "G",
                        "Liter",
                        "Litre",
                        "ML",
                        "Pack",
                        "Packet",
                        "Box",
                        "Dozen",
                        "Bottle",
                        "Pair",
                      ].map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.trackInventory && (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="text-sm font-semibold text-gray-700">
                        Current stock
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={form.stockQuantity}
                          onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })}
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                        />
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        Low stock alert
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={form.lowStockThreshold}
                          onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })}
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                        />
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        Expiry date
                        <input
                          type="date"
                          value={form.expiryDate}
                          onChange={(event) => setForm({ ...form, expiryDate: event.target.value })}
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                        />
                      </label>
                      {businessType === "grocery" && (
                        <label className="text-sm font-semibold text-gray-700">
                          Batch number
                          <input
                            value={form.batchNumber}
                            onChange={(event) => setForm({ ...form, batchNumber: event.target.value })}
                            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                          />
                        </label>
                      )}
                    </div>
                  )}
                  {!modules.menu && (
                    <label className="block text-sm font-semibold text-gray-700">
                      Barcode
                      <input
                        value={form.barcode}
                        onChange={(event) => setForm({ ...form, barcode: event.target.value })}
                        placeholder="Scan or enter barcode"
                        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                      />
                    </label>
                  )}

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 p-4">
                    <input
                      type="checkbox"
                      checked={form.trackInventory}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          trackInventory: event.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-indigo-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Track Inventory
                      </p>
                      <p className="text-xs text-gray-500">
                        Enable this if you want to manage stock for this product.
                      </p>
                    </div>
                  </label>
                </>
              )}

              {/* Description */}
              {form.type === "Service" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Duration (minutes)
                    <input
                      type="number"
                      min="1"
                      value={form.durationMinutes}
                      onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="text-sm font-semibold text-gray-700">
                    Assigned staff (names)
                    <input
                      value={form.assignedStaff}
                      onChange={(event) => setForm({ ...form, assignedStaff: event.target.value })}
                      placeholder="Separate names with commas"
                      className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    />
                  </label>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Description
                </label>

                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Short description..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Availability */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 p-4">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      available: event.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-indigo-600"
                />

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Available for Sale
                  </p>
                  <p className="text-xs text-gray-500">
                    Available items can be sold through POS.
                  </p>
                </div>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {editingId ? "Update Item" : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "indigo" | "green" | "blue" | "orange";
}) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${styles[color]}`}
      >
        {icon}
      </div>

      <p className="text-sm text-gray-500">{label}</p>

      <h2 className="mt-1 text-2xl font-bold text-gray-900">
        {value}
      </h2>
    </div>
  );
}
