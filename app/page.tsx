"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { calculateAllPrices, RealPriceResult, ProductPrice } from "@/lib/price-calculator";

const PLATFORM_NAMES: Record<string, string> = {
  coupang: "\ucfe0\ud321",
  "11st": "11\ubc88\uac00",
  gmarket: "G\ub9c8\ucf13",
  ssg: "SSG",
};

const PLATFORM_COLORS: Record<string, string> = {
  coupang: "text-red-400",
  "11st": "text-rose-400",
  gmarket: "text-green-400",
  ssg: "text-amber-400",
};

const ALL_CARDS = ["\uc2e0\ud55c", "\uc0bc\uc131", "\ud604\ub300", "KB", "\ud558\ub098", "\ub86f\ub370", "\uc6b0\ub9ac", "NH"];
const ALL_MEMBERSHIPS = [
  { id: "coupang_wow", label: "\ucfe0\ud321 \ub85c\ucf13\uc640\uc6b0" },
  { id: "naver_plus", label: "\ub124\uc774\ubc84\ud50c\ub7ec\uc2a4" },
  { id: "ssg_universe", label: "SSG \uc720\ub2c8\ubc84\uc2a4" },
  { id: "smile_club", label: "\uc2a4\ub9c8\uc77c\ud074\ub7fd" },
];

interface Product {
  id: string;
  name: string;
  brand: string;
  model_number: string;
  category: string;
  attributes: Record<string, unknown>;
}

interface UsedListing {
  platform: string;
  price: number;
  condition_grade: string;
  location: string;
  listing_url: string;
  posted_at: string;
}

interface PriceStats {
  current_lowest: number;
  all_time_lowest: number;
  avg_30d: number;
  volatility: number;
  trend: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [prices, setPrices] = useState<RealPriceResult[]>([]);
  const [usedListings, setUsedListings] = useState<UsedListing[]>([]);
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const [loading, setLoading] = useState(false);

  const [userCards, setUserCards] = useState<string[]>(["\uc2e0\ud55c", "\uc0bc\uc131"]);
  const [userMemberships, setUserMemberships] = useState<string[]>(["coupang_wow", "naver_plus"]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts(searchQuery?: string) {
    setLoading(true);
    let q = supabase.from("products").select("*").order("brand");
    if (searchQuery && searchQuery.trim()) {
      q = q.ilike("name", "%" + searchQuery + "%");
    }
    const { data } = await q.limit(20);
    setProducts(data || []);
    setLoading(false);
  }

  async function selectProduct(product: Product) {
    setSelectedProduct(product);
    setLoading(true);

    const { data: priceData } = await supabase
      .from("product_prices")
      .select("*")
      .eq("product_id", product.id)
      .eq("is_available", true)
      .order("sale_price");

    if (priceData && priceData.length > 0) {
      const realPrices = calculateAllPrices(priceData as ProductPrice[], userCards, userMemberships);
      setPrices(realPrices);
    } else {
      setPrices([]);
    }

    const { data: usedData } = await supabase
      .from("used_listings")
      .select("*")
      .eq("product_id", product.id)
      .eq("is_sold", false)
      .order("price")
      .limit(5);
    setUsedListings(usedData || []);

    const { data: statsData } = await supabase
      .from("price_stats")
      .select("*")
      .eq("product_id", product.id)
      .single();
    setPriceStats(statsData);

    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSelectedProduct(null);
    setPrices([]);
    loadProducts(query);
  }

  function toggleCard(card: string) {
    setUserCards((prev) => prev.includes(card) ? prev.filter((c) => c !== card) : [...prev, card]);
  }

  function toggleMembership(id: string) {
    setUserMemberships((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  }

  useEffect(() => {
    if (selectedProduct) {
      selectProduct(selectedProduct);
    }
  }, [userCards, userMemberships]);

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "\ubc29\uae08 \uc804";
    if (hours < 24) return hours + "\uc2dc\uac04 \uc804";
    return Math.floor(hours / 24) + "\uc77c \uc804";
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1
              className="text-xl font-extrabold text-emerald-400 cursor-pointer"
              onClick={() => { setSelectedProduct(null); setPrices([]); setQuery(""); loadProducts(); }}
            >
              {"\uc9c4\ucd5c\uc800"}
            </h1>
            <p className="text-xs text-gray-500">{"\ub098\ub9cc\uc758 \uc2e4\uc9c8 \ucd5c\uc800\uac00"}</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300 hover:bg-gray-700 transition"
          >
            {"\u2699\ufe0f \ub0b4 \ud560\uc778 \uc124\uc815"}
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={"\uc0c1\ud488\uba85, \ubaa8\ub378\uba85 \uac80\uc0c9 (\uc608: \uc5d0\uc5b4\ud31f)"}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <button type="submit" className="px-4 py-2.5 bg-emerald-500 text-gray-950 rounded-xl text-sm font-bold hover:bg-emerald-400 transition">
            {"\uac80\uc0c9"}
          </button>
        </form>
      </header>

      {showSettings && (
        <div className="mx-4 mt-4 p-4 bg-gray-900 border border-gray-700 rounded-2xl">
          <h3 className="text-sm font-bold text-gray-200 mb-3">{"\ud83d\udcb3 \ubcf4\uc720 \uce74\ub4dc"}</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_CARDS.map((card) => (
              <button key={card} onClick={() => toggleCard(card)}
                className={"px-3 py-1.5 rounded-full text-xs font-medium border transition " +
                  (userCards.includes(card) ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-gray-800 border-gray-700 text-gray-400")}>
                {userCards.includes(card) ? "\u2713 " : ""}{card}
              </button>
            ))}
          </div>
          <h3 className="text-sm font-bold text-gray-200 mb-3">{"\ud83c\udfab \uac00\uc785 \uba64\ubc84\uc2ed"}</h3>
          <div className="flex flex-wrap gap-2">
            {ALL_MEMBERSHIPS.map((m) => (
              <button key={m.id} onClick={() => toggleMembership(m.id)}
                className={"px-3 py-1.5 rounded-full text-xs font-medium border transition " +
                  (userMemberships.includes(m.id) ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-gray-800 border-gray-700 text-gray-400")}>
                {userMemberships.includes(m.id) ? "\u2713 " : ""}{m.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">{"\uc124\uc815\uc744 \ubc14\uafb8\uba74 \uc2e4\uc9c8 \ucd5c\uc800\uac00\uac00 \uc790\ub3d9\uc73c\ub85c \ub2e4\uc2dc \uacc4\uc0b0\ub3fc\uc694"}</p>
        </div>
      )}

      <main className="px-4 mt-4">
        {loading && <div className="text-center py-12 text-gray-500">{"\uac80\uc0c9 \uc911..."}</div>}

        {!selectedProduct && !loading && (
          <>
            <p className="text-xs text-gray-500 mb-3">{products.length + "\uac1c \uc0c1\ud488"}</p>
            <div className="space-y-2">
              {products.map((product) => (
                <button key={product.id} onClick={() => selectProduct(product)}
                  className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-gray-100">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{product.brand} · {product.model_number}</p>
                    </div>
                    <div className="flex gap-1">
                      {product.attributes && (product.attributes as Record<string, unknown>).anc && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">ANC</span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                        {product.category === "headphone" ? "\ud5e4\ub4dc\ud3f0" : "\uc774\uc5b4\ud3f0"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              {products.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">{"\uac80\uc0c9 \uacb0\uacfc\uac00 \uc5c6\uc5b4\uc694"}</div>
              )}
            </div>
          </>
        )}

        {selectedProduct && !loading && (
          <>
            <button onClick={() => { setSelectedProduct(null); setPrices([]); }}
              className="text-sm text-gray-400 mb-4 hover:text-gray-200 transition">
              {"\u2190 \ubaa9\ub85d\uc73c\ub85c"}
            </button>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
              <h2 className="text-lg font-bold text-gray-100">{selectedProduct.name}</h2>
              <p className="text-xs text-gray-500 mt-1">{selectedProduct.brand} · {selectedProduct.model_number}</p>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
              <span className="text-sm">{"\ud83c\udff7\ufe0f"}</span>
              <div>
                <p className="text-xs font-bold text-emerald-400">{"\ub0b4 \ud560\uc778 \uc801\uc6a9 \uc911"}</p>
                <p className="text-[10px] text-gray-400">
                  {userCards.join(" · ") + " | " + userMemberships.map((m) => ALL_MEMBERSHIPS.find((am) => am.id === m)?.label).join(" · ")}
                </p>
              </div>
            </div>

            {priceStats && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500">{"\ud604\uc7ac \ucd5c\uc800"}</p>
                  <p className="text-sm font-extrabold text-emerald-400">{"\u20a9" + priceStats.current_lowest?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500">{"\uc5ed\ub300 \ucd5c\uc800"}</p>
                  <p className="text-sm font-extrabold text-yellow-400">{"\u20a9" + priceStats.all_time_lowest?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500">{"30\uc77c \ud3c9\uade0"}</p>
                  <p className="text-sm font-extrabold text-gray-300">{"\u20a9" + priceStats.avg_30d?.toLocaleString()}</p>
                </div>
              </div>
            )}

            <h3 className="text-sm font-bold text-gray-200 mb-2 flex items-center gap-1">
              <span className="text-emerald-400">{"\uc2e0\ud488"}</span> {"\uc2e4\uc9c8 \ucd5c\uc800\uac00"}
              <span className="text-[10px] text-gray-500 ml-auto">{prices.length + "\uac1c \ud310\ub9e4\ucc98"}</span>
            </h3>

            <div className="space-y-2 mb-6">
              {prices.map((p, i) => (
                <div key={i} className={"bg-gray-900 border rounded-xl p-4 relative " + (i === 0 ? "border-emerald-500/50" : "border-gray-800")}>
                  {i === 0 && (
                    <div className="absolute -top-px left-5 bg-emerald-500 text-gray-950 text-[10px] font-extrabold px-2 py-0.5 rounded-b-md">
                      {"\ub0b4 \ucd5c\uc800\uac00"}
                    </div>
                  )}
                  <div className={"flex justify-between items-start " + (i === 0 ? "mt-2" : "")}>
                    <div>
                      <span className={"text-sm font-bold " + (PLATFORM_COLORS[p.platform] || "text-gray-200")}>
                        {PLATFORM_NAMES[p.platform] || p.platform}
                      </span>
                      {p.seller_name && <span className="text-[10px] text-gray-500 ml-2">{p.seller_name}</span>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 line-through">{"\u20a9" + p.sale_price.toLocaleString()}</p>
                      <p className={"text-lg font-extrabold " + (i === 0 ? "text-emerald-400" : "text-gray-100")}>
                        {"\u20a9" + p.real_price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {p.applied_discounts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.applied_discounts.map((d, j) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{d}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-[10px] text-gray-500">
                      {(p.free_shipping ? "\ubb34\ub8cc\ubc30\uc1a1" : "\ubc30\uc1a1\ube44 \u20a9" + p.shipping_fee.toLocaleString()) + (p.delivery_eta ? " · " + p.delivery_eta : "")}
                    </span>
                    {p.savings > 0 && (
                      <span className="text-[10px] font-bold text-red-400">{Math.round((p.savings / p.sale_price) * 100) + "% \uc808\uc57d"}</span>
                    )}
                  </div>

                  {p.product_url && (
                    <a href={p.product_url} target="_blank" rel="noopener noreferrer"
                      className="mt-3 block text-center py-2 rounded-lg bg-gray-800 text-xs text-gray-300 hover:bg-gray-700 transition">
                      {(PLATFORM_NAMES[p.platform] || p.platform) + "\uc5d0\uc11c \ubcf4\uae30 \u2192"}
                    </a>
                  )}
                </div>
              ))}

              {prices.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">{"\uc544\uc9c1 \uac00\uaca9 \ub370\uc774\ud130\uac00 \uc5c6\uc5b4\uc694"}</div>
              )}
            </div>

            {usedListings.length > 0 && (
              <>
                <h3 className="text-sm font-bold text-gray-200 mb-2 flex items-center gap-1">
                  <span className="text-orange-400">{"\uc911\uace0"}</span> {"\ub9e4\ubb3c"}
                  <span className="text-[10px] text-gray-500 ml-auto">{usedListings.length + "\uac1c"}</span>
                </h3>
                <div className="space-y-2">
                  {usedListings.map((u, i) => (
                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-200">{u.platform}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            {u.condition_grade + "\uae09"}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">{u.location + " · " + timeAgo(u.posted_at)}</p>
                      </div>
                      <p className="text-lg font-extrabold text-orange-400">{"\u20a9" + u.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
