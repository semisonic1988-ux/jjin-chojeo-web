export interface ProductPrice {
  id: string;
  platform: string;
  seller_name: string | null;
  base_price: number;
  sale_price: number;
  card_discounts: Record<string, { rate: number; max: number; min: number }>;
  coupons: Array<{ name: string; amount: number; min_purchase?: number }>;
  membership_benefits: Record<string, { free_shipping?: boolean; cashback?: number }>;
  free_shipping: boolean;
  shipping_fee: number;
  delivery_eta: string | null;
  product_url: string | null;
}

export interface RealPriceResult {
  platform: string;
  seller_name: string | null;
  sale_price: number;
  real_price: number;
  savings: number;
  applied_discounts: string[];
  free_shipping: boolean;
  shipping_fee: number;
  delivery_eta: string | null;
  product_url: string | null;
}

export function calculateRealPrice(
  price: ProductPrice,
  userCards: string[],
  userMemberships: string[]
): RealPriceResult {
  let currentPrice = price.sale_price;
  const appliedDiscounts: string[] = [];

  // 1) 카드 즉시할인
  let bestCardDiscount = 0;
  let bestCardName = "";

  for (const card of userCards) {
    const discount = price.card_discounts?.[card];
    if (discount && price.sale_price >= (discount.min || 0)) {
      const amount = Math.min(
        Math.floor(price.sale_price * (discount.rate / 100)),
        discount.max
      );
      if (amount > bestCardDiscount) {
        bestCardDiscount = amount;
        bestCardName = card;
      }
    }
  }

  if (bestCardDiscount > 0) {
    currentPrice -= bestCardDiscount;
    appliedDiscounts.push(bestCardName + "\uce74\ub4dc -" + bestCardDiscount.toLocaleString() + "\uc6d0");
  }

  // 2) 쿠폰 할인
  let bestCoupon = 0;
  let bestCouponName = "";

  for (const coupon of price.coupons || []) {
    if (price.sale_price >= (coupon.min_purchase || 0) && coupon.amount > bestCoupon) {
      bestCoupon = coupon.amount;
      bestCouponName = coupon.name;
    }
  }

  if (bestCoupon > 0) {
    currentPrice -= bestCoupon;
    appliedDiscounts.push(bestCouponName + " -" + bestCoupon.toLocaleString() + "\uc6d0");
  }

  // 3) 멤버십 혜택
  let isFreeShipping = price.free_shipping;
  const membershipMap: Record<string, string> = {
    coupang_wow: "wow",
    naver_plus: "\ub124\uc774\ubc84\ud50c\ub7ec\uc2a4",
    ssg_universe: "\uc720\ub2c8\ubc84\uc2a4",
    smile_club: "\uc2a4\ub9c8\uc77c\ud074\ub7fd",
  };

  for (const membership of userMemberships) {
    const benefitKey = membershipMap[membership];
    if (!benefitKey) continue;

    const benefit = price.membership_benefits?.[benefitKey] || price.membership_benefits?.[membership];
    if (!benefit) continue;

    if (benefit.cashback && benefit.cashback > 0) {
      const cashback = Math.floor(price.sale_price * (benefit.cashback / 100));
      currentPrice -= cashback;
      appliedDiscounts.push("\uba64\ubc84\uc2ed \uc801\ub9bd -" + cashback.toLocaleString() + "\uc6d0");
    }

    if (benefit.free_shipping && !price.free_shipping) {
      isFreeShipping = true;
      appliedDiscounts.push("\uba64\ubc84\uc2ed \ubb34\ub8cc\ubc30\uc1a1");
    }
  }

  // 4) 배송비
  if (!isFreeShipping) {
    currentPrice += price.shipping_fee || 0;
  }

  const realPrice = Math.max(currentPrice, 0);

  return {
    platform: price.platform,
    seller_name: price.seller_name,
    sale_price: price.sale_price,
    real_price: realPrice,
    savings: price.sale_price - realPrice + (isFreeShipping ? 0 : price.shipping_fee || 0),
    applied_discounts: appliedDiscounts,
    free_shipping: isFreeShipping,
    shipping_fee: isFreeShipping ? 0 : price.shipping_fee || 0,
    delivery_eta: price.delivery_eta,
    product_url: price.product_url,
  };
}

export function calculateAllPrices(
  prices: ProductPrice[],
  userCards: string[],
  userMemberships: string[]
): RealPriceResult[] {
  return prices
    .map((p) => calculateRealPrice(p, userCards, userMemberships))
    .sort((a, b) => a.real_price - b.real_price);
}
