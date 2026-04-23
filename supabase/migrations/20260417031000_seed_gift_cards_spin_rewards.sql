-- Seed demo gift cards and spin-wheel rewards so a fresh environment has
-- working backend features out of the box (and so verify-postback-flow.mjs
-- actually exercises gift-card + spin flows instead of skipping them).

INSERT INTO public.gift_cards (name, brand, description, image_url, denominations, discount_percent, category, is_active)
VALUES
    ('Amazon Pay', 'Amazon', 'Amazon Pay e-gift card', NULL,
     '[100, 250, 500, 1000, 2000]'::jsonb, 0, 'shopping', true),
    ('Flipkart Gift Card', 'Flipkart', 'Flipkart gift card', NULL,
     '[100, 250, 500, 1000, 2000]'::jsonb, 0, 'shopping', true),
    ('Myntra Gift Card', 'Myntra', 'Myntra gift card', NULL,
     '[250, 500, 1000]'::jsonb, 0, 'fashion', true),
    ('Zomato Gift Card', 'Zomato', 'Zomato e-gift card', NULL,
     '[100, 250, 500]'::jsonb, 0, 'food', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.spin_rewards (name, reward_type, reward_value, probability, color, is_active)
VALUES
    ('₹1 Cashback',   'cashback', 1,   40, '#10B981', true),
    ('₹5 Cashback',   'cashback', 5,   25, '#3B82F6', true),
    ('₹10 Cashback',  'cashback', 10,  15, '#8B5CF6', true),
    ('₹25 Cashback',  'cashback', 25,  10, '#F59E0B', true),
    ('₹50 Cashback',  'cashback', 50,   5, '#EF4444', true),
    ('₹100 Cashback', 'cashback', 100,  3, '#EC4899', true),
    ('Better luck!',  'nothing',  0,    2, '#6B7280', true)
ON CONFLICT DO NOTHING;
