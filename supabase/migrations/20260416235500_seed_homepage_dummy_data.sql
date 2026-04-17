-- Seed dummy homepage content so freshly-provisioned environments (or a
-- project that lost its UI-entered data) have something to show.
-- Everything is idempotent via ON CONFLICT DO NOTHING against unique keys.

-- ---------------------------------------------------------------------------
-- site_settings: tagline + promo copy for the homepage
-- ---------------------------------------------------------------------------
INSERT INTO site_settings (key, value) VALUES
    ('tagline', 'India''s Top Cashback & Coupon Destination'),
    ('promo_title', 'Earn Extra ₹100 on Your First Purchase'),
    ('promo_description', 'Sign up today and get bonus cashback on your first order from any store!')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- banners: 3 hero-carousel slides (free Unsplash stock photos, no auth).
-- ---------------------------------------------------------------------------
INSERT INTO banners (title, image_url, mobile_image_url, link, display_order, is_active) VALUES
    ('Biggest Cashback Sale', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80', '/stores', 1, true),
    ('Shop Electronics & Save', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', '/category/electronics', 2, true),
    ('Fashion Deals Up To 80% Off', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80', '/category/fashion', 3, true)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- categories: enough to populate the "Shop by Categories" section.
-- ---------------------------------------------------------------------------
INSERT INTO categories (name, slug, icon, color, display_order, is_active) VALUES
    ('Electronics',       'electronics',       'smartphone',  'bg-blue-100 text-blue-700',     1, true),
    ('Fashion',           'fashion',           'shirt',       'bg-pink-100 text-pink-700',     2, true),
    ('Travel',            'travel',            'plane',       'bg-cyan-100 text-cyan-700',     3, true),
    ('Food & Grocery',    'food-grocery',      'utensils',    'bg-orange-100 text-orange-700', 4, true),
    ('Banking & Finance', 'banking-finance',   'landmark',    'bg-green-100 text-green-700',   5, true),
    ('Beauty & Health',   'beauty-health',     'sparkles',    'bg-purple-100 text-purple-700', 6, true),
    ('Mobile Recharge',   'mobile-recharge',   'phone',       'bg-indigo-100 text-indigo-700', 7, true),
    ('Entertainment',     'entertainment',     'film',        'bg-red-100 text-red-700',       8, true)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- subcategories: one or two per category so CategoryPage isn't empty.
-- ---------------------------------------------------------------------------
INSERT INTO subcategories (category_id, name, slug, icon, display_order, is_active)
SELECT c.id, s.name, s.slug, s.icon, s.display_order, true
FROM categories c
JOIN (VALUES
    ('electronics',     'Mobiles',          'mobiles',          'smartphone',    1),
    ('electronics',     'Laptops',          'laptops',          'laptop',        2),
    ('fashion',         'Men',              'men',              'shirt',         1),
    ('fashion',         'Women',            'women',            'shirt',         2),
    ('travel',          'Flights',          'flights',          'plane',         1),
    ('travel',          'Hotels',           'hotels',           'hotel',         2),
    ('food-grocery',    'Supermarket',      'supermarket',      'shopping-cart', 1),
    ('food-grocery',    'Restaurants',      'restaurants',      'utensils',      2),
    ('banking-finance', 'Credit Cards',     'credit-cards',     'credit-card',   1),
    ('banking-finance', 'Demat Accounts',   'demat-accounts',   'trending-up',   2),
    ('beauty-health',   'Makeup',           'makeup',           'sparkles',      1),
    ('beauty-health',   'Skincare',         'skincare',         'sparkles',      2)
) AS s(cat_slug, name, slug, icon, display_order) ON s.cat_slug = c.slug
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- sponsors: 5 logos for the "Our Partners" strip.
-- ---------------------------------------------------------------------------
INSERT INTO sponsors (name, logo_url, website_url, display_order, is_active) VALUES
    ('Amazon',       'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',           'https://www.amazon.in',   1, true),
    ('Flipkart',     'https://upload.wikimedia.org/wikipedia/commons/5/57/Flipkart_logo.svg',         'https://www.flipkart.com',2, true),
    ('Myntra',       'https://upload.wikimedia.org/wikipedia/commons/f/fe/Myntra_logo.png',           'https://www.myntra.com',  3, true),
    ('MakeMyTrip',   'https://upload.wikimedia.org/wikipedia/commons/c/c6/Makemytrip-logo.svg',       'https://www.makemytrip.com', 4, true),
    ('Swiggy',       'https://upload.wikimedia.org/wikipedia/commons/1/12/Swiggy_logo.svg',           'https://www.swiggy.com',  5, true)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Mark the first 8 stores as trending so the "Trending Stores" section
-- isn't empty. Safe no-op if there are fewer than 8 stores.
-- ---------------------------------------------------------------------------
UPDATE stores
SET is_trending = true, is_new = true
WHERE id IN (SELECT id FROM stores ORDER BY created_at DESC LIMIT 8);

-- ---------------------------------------------------------------------------
-- deals: attach one dummy deal per trending store so "Today's Top Deals" and
-- "Top Coupons" are populated. Skip gracefully if stores haven't been synced.
-- ---------------------------------------------------------------------------
INSERT INTO deals (store_id, title, description, coupon_code, cashback_percent, discount_text, is_exclusive, is_verified, is_active)
SELECT
    s.id,
    s.name || ' – Extra ₹' || (100 + ((row_number() OVER (ORDER BY s.created_at DESC)) * 25)) || ' cashback',
    'Limited-time offer. Use this coupon at checkout on ' || s.name || ' to unlock exclusive bonus cashback.',
    CASE WHEN row_number() OVER (ORDER BY s.created_at DESC) % 2 = 0 THEN 'CASH' || (100 + ((row_number() OVER (ORDER BY s.created_at DESC)) * 10)) ELSE NULL END,
    s.cashback_percent,
    'Flat ₹' || (50 + ((row_number() OVER (ORDER BY s.created_at DESC)) * 25)) || ' off',
    (row_number() OVER (ORDER BY s.created_at DESC)) <= 3,
    true,
    true
FROM stores s
WHERE s.is_active = true
ORDER BY s.created_at DESC
LIMIT 6
ON CONFLICT DO NOTHING;
