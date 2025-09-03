-- Clear existing data
TRUNCATE TABLE user_data, orders, products RESTART IDENTITY CASCADE;

-- Insert sample products with comprehensive data
INSERT INTO products (
    name, description, long_description, price, original_price, category, 
    image_url, rating, reviews_count, stock_quantity, in_stock, featured,
    ingredients, benefits, how_to_use, weight, dimensions, shelf_life, tags
) VALUES
(
    'Neem & Turmeric Soap',
    'Natural antibacterial soap with neem and turmeric. Perfect for acne-prone skin and daily cleansing.',
    'Our Neem & Turmeric Soap is carefully handcrafted using traditional methods passed down through generations. This powerful combination of neem and turmeric provides natural antibacterial properties while being gentle on your skin. Perfect for daily use, this soap helps fight acne, reduces inflammation, and gives your skin a natural, healthy glow. Made with premium organic ingredients and free from harsh chemicals.',
    12.99, 15.99, 'soaps',
    '/placeholder.svg?height=500&width=500',
    4.8, 124, 45, true, true,
    ARRAY['Neem extract', 'Turmeric powder', 'Coconut oil', 'Olive oil', 'Shea butter', 'Essential oils'],
    ARRAY['Fights acne and blemishes', 'Natural antibacterial properties', 'Reduces inflammation', 'Gives natural glow', 'Suitable for all skin types'],
    'Wet your skin with warm water. Gently massage the soap to create a rich lather. Apply to face and body, avoiding the eye area. Rinse thoroughly with water. Use twice daily for best results.',
    '100g', '7cm x 5cm x 2cm', '24 months from manufacture date',
    ARRAY['antibacterial', 'acne', 'natural', 'handmade', 'organic', 'bestseller']
),
(
    'Herbal Hair Oil',
    'Nourishing hair oil with 15 traditional herbs. Promotes hair growth and prevents hair fall.',
    'This premium herbal hair oil is a blend of 15 carefully selected traditional herbs known for their hair nourishing properties. Regular use promotes healthy hair growth, reduces hair fall, and adds natural shine to your hair. Our time-tested formula has been used for generations and is now available in a convenient modern packaging.',
    24.99, 29.99, 'hair-care',
    '/placeholder.svg?height=500&width=500',
    4.9, 89, 23, true, true,
    ARRAY['Coconut oil', 'Amla', 'Bhringraj', 'Fenugreek', 'Curry leaves', 'Hibiscus', 'Brahmi', 'Neem', 'Rosemary'],
    ARRAY['Promotes hair growth', 'Reduces hair fall', 'Strengthens hair roots', 'Adds natural shine', 'Prevents premature graying', 'Nourishes scalp'],
    'Apply oil to scalp and hair. Massage gently for 5-10 minutes. Leave for at least 30 minutes or overnight. Wash with mild shampoo. Use 2-3 times per week for best results.',
    '200ml', '15cm x 5cm x 5cm', '18 months from manufacture date',
    ARRAY['hair growth', 'herbal', 'traditional', 'natural', 'ayurvedic', 'premium']
),
(
    'Ayurvedic Face Pack',
    'Deep cleansing face pack with natural clay and herbs. Suitable for all skin types.',
    'This traditional Ayurvedic face pack combines the power of natural clay with time-tested herbs to provide deep cleansing and nourishment to your skin. Regular use helps remove impurities, tighten pores, and give you a radiant complexion. Formulated according to ancient Ayurvedic principles for modern skincare needs.',
    18.99, 22.99, 'skin-care',
    '/placeholder.svg?height=500&width=500',
    4.7, 156, 0, false, false,
    ARRAY['Fullers earth', 'Turmeric', 'Sandalwood', 'Rose water', 'Neem powder', 'Multani mitti'],
    ARRAY['Deep cleansing', 'Removes impurities', 'Natural glow', 'Tightens pores', 'Suitable for all skin types', 'Anti-aging properties'],
    'Mix 2 tablespoons of face pack with rose water or milk to form a smooth paste. Apply evenly on clean face and neck. Leave for 15-20 minutes until dry. Rinse with lukewarm water. Use 2-3 times per week.',
    '100g', '8cm x 8cm x 3cm', '36 months from manufacture date',
    ARRAY['face pack', 'ayurvedic', 'deep cleansing', 'natural', 'clay', 'herbal']
),
(
    'Organic Shampoo Bar',
    'Eco-friendly solid shampoo bar. Zero waste packaging and gentle on hair.',
    'Our organic shampoo bar is the perfect eco-friendly alternative to liquid shampoos. Made with natural ingredients and free from harsh chemicals, this concentrated bar lasts longer than traditional shampoos while being gentle on your hair and the environment. Perfect for travel and reducing plastic waste.',
    16.99, 19.99, 'shampoos',
    '/placeholder.svg?height=500&width=500',
    4.6, 98, 67, true, true,
    ARRAY['Coconut oil', 'Shea butter', 'Essential oils', 'Natural surfactants', 'Argan oil', 'Vitamin E'],
    ARRAY['Eco-friendly', 'Long lasting', 'Gentle cleansing', 'Chemical-free', 'Travel-friendly', 'Zero waste'],
    'Wet hair thoroughly. Rub the shampoo bar directly on wet hair or lather in hands first. Massage into scalp and hair. Rinse thoroughly. Store in a dry place between uses.',
    '80g', '6cm x 6cm x 2cm', '24 months from manufacture date',
    ARRAY['eco-friendly', 'zero waste', 'organic', 'solid shampoo', 'sustainable', 'travel']
),
(
    'Pure Amla Powder',
    '100% pure amla powder for hair and skin. Rich in Vitamin C and antioxidants.',
    'Our pure amla powder is made from fresh amla fruits that are carefully dried and ground to preserve maximum nutrients. Rich in Vitamin C and antioxidants, this versatile powder can be used for hair masks, face packs, and even consumed as a health supplement. No additives or preservatives.',
    14.99, 17.99, 'herbal-powders',
    '/placeholder.svg?height=500&width=500',
    4.5, 67, 89, false,
    ARRAY['100% Pure Amla powder'],
    ARRAY['Rich in Vitamin C', 'Hair strengthening', 'Skin brightening', 'Natural antioxidants', 'Boosts immunity', 'Anti-aging'],
    'For hair: Mix 2-3 tablespoons with water or oil to form a paste. Apply to hair and scalp. Leave for 30 minutes, then wash. For skin: Mix with rose water and apply as face mask for 15 minutes.',
    '200g', '10cm x 10cm x 8cm', '24 months from manufacture date',
    ARRAY['vitamin c', 'antioxidants', 'pure', 'amla', 'herbal', 'multipurpose']
),
(
    'Rose Essential Oil',
    'Premium rose essential oil extracted from fresh rose petals. Perfect for aromatherapy and skincare.',
    'Our premium rose essential oil is extracted from carefully selected fresh rose petals using traditional steam distillation methods. This pure, concentrated oil captures the essence of roses and offers numerous benefits for both aromatherapy and skincare applications. A little goes a long way with this luxurious oil.',
    32.99, 39.99, 'essential-oils',
    '/placeholder.svg?height=500&width=500',
    4.9, 45, 12, false,
    ARRAY['100% Pure rose essential oil'],
    ARRAY['Aromatherapy', 'Skin rejuvenation', 'Stress relief', 'Natural fragrance', 'Anti-aging properties', 'Mood enhancement'],
    'For aromatherapy: Add 3-5 drops to diffuser or oil burner. For skincare: Mix 1-2 drops with carrier oil before applying to skin. For bath: Add 5-8 drops to warm bath water.',
    '10ml', '3cm x 3cm x 8cm', '36 months from manufacture date',
    ARRAY['premium', 'aromatherapy', 'skincare', 'pure', 'rose', 'luxury']
),
(
    'Lavender Soap',
    'Calming lavender soap for relaxation and gentle cleansing.',
    'Handcrafted with pure lavender essential oil, this soap provides a calming and relaxing experience while gently cleansing your skin. Perfect for evening use to help you unwind after a long day.',
    13.99, 16.99, 'soaps',
    '/placeholder.svg?height=500&width=500',
    4.7, 78, 34, false,
    ARRAY['Lavender essential oil', 'Coconut oil', 'Olive oil', 'Shea butter', 'Natural colorants'],
    ARRAY['Calming and relaxing', 'Gentle cleansing', 'Aromatherapy benefits', 'Moisturizing', 'Natural fragrance'],
    'Use during evening bath or shower. Lather gently and enjoy the calming aroma. Rinse thoroughly.',
    '100g', '7cm x 5cm x 2cm', '24 months from manufacture date',
    ARRAY['lavender', 'calming', 'aromatherapy', 'relaxing', 'evening', 'natural']
),
(
    'Tea Tree Shampoo',
    'Clarifying tea tree shampoo for oily hair and scalp issues.',
    'Our tea tree shampoo is specially formulated to address oily hair and scalp concerns. The natural antifungal and antibacterial properties of tea tree oil help maintain a healthy scalp.',
    19.99, 24.99, 'shampoos',
    '/placeholder.svg?height=500&width=500',
    4.4, 92, 28, false,
    ARRAY['Tea tree oil', 'Aloe vera', 'Coconut-derived surfactants', 'Peppermint oil', 'Vitamin E'],
    ARRAY['Clarifies oily hair', 'Antifungal properties', 'Refreshing sensation', 'Scalp health', 'Natural cleansing'],
    'Apply to wet hair, massage into scalp, leave for 2-3 minutes, then rinse thoroughly. Use 2-3 times per week.',
    '250ml', '18cm x 6cm x 6cm', '18 months from manufacture date',
    ARRAY['tea tree', 'clarifying', 'oily hair', 'antifungal', 'scalp care', 'refreshing']
);

-- Insert sample orders with embedded items as JSONB
INSERT INTO orders (
    customer_name, customer_email, customer_phone, items, total_amount, status,
    shipping_address, payment_method, tracking_number
) VALUES
(
    'Sarah Johnson',
    'sarah.johnson@email.com',
    '+1-555-0123',
    '[
        {
            "product_id": 1,
            "product_name": "Neem & Turmeric Soap",
            "quantity": 2,
            "price": 12.99,
            "total": 25.98
        },
        {
            "product_id": 2,
            "product_name": "Herbal Hair Oil",
            "quantity": 1,
            "price": 24.99,
            "total": 24.99
        }
    ]'::jsonb,
    58.96,
    'delivered',
    '{
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
    }'::jsonb,
    'Credit Card',
    'TRK123456789'
),
(
    'Mike Chen',
    'mike.chen@email.com',
    '+1-555-0124',
    '[
        {
            "product_id": 4,
            "product_name": "Organic Shampoo Bar",
            "quantity": 3,
            "price": 16.99,
            "total": 50.97
        }
    ]'::jsonb,
    56.96,
    'shipped',
    '{
        "street": "456 Oak Ave",
        "city": "Los Angeles",
        "state": "CA",
        "zipCode": "90210",
        "country": "USA"
    }'::jsonb,
    'PayPal',
    'TRK123456790'
),
(
    'Emily Davis',
    'emily.davis@email.com',
    '+1-555-0125',
    '[
        {
            "product_id": 6,
            "product_name": "Rose Essential Oil",
            "quantity": 1,
            "price": 32.99,
            "total": 32.99
        },
        {
            "product_id": 1,
            "product_name": "Neem & Turmeric Soap",
            "quantity": 1,
            "price": 12.99,
            "total": 12.99
        }
    ]'::jsonb,
    51.97,
    'processing',
    '{
        "street": "789 Pine St",
        "city": "Chicago",
        "state": "IL",
        "zipCode": "60601",
        "country": "USA"
    }'::jsonb,
    'Credit Card',
    NULL
),
(
    'John Wilson',
    'john.wilson@email.com',
    '+1-555-0126',
    '[
        {
            "product_id": 5,
            "product_name": "Pure Amla Powder",
            "quantity": 2,
            "price": 14.99,
            "total": 29.98
        }
    ]'::jsonb,
    35.97,
    'pending',
    '{
        "street": "321 Elm St",
        "city": "Houston",
        "state": "TX",
        "zipCode": "77001",
        "country": "USA"
    }'::jsonb,
    'Bank Transfer',
    NULL
);

-- Insert sample user data with cart, wishlist, and roles
INSERT INTO user_data (user_id, name, email, role, cart_items, wishlist_items, preferences) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Admin User',
    'admin@dhanyanaturals.com',
    'admin',
    '[]'::jsonb,
    '[]'::jsonb,
    '{
        "newsletter": true,
        "notifications": {
            "email": true,
            "sms": false
        },
        "preferred_categories": ["soaps", "hair-care"],
        "currency": "USD",
        "language": "en"
    }'::jsonb
),
(
    'user-123e4567-e89b-12d3-a456-426614174000',
    'John Customer',
    'john.customer@example.com',
    'customer',
    '[
        {
            "product_id": 1,
            "quantity": 1,
            "added_at": "2024-01-15T10:30:00Z"
        },
        {
            "product_id": 3,
            "quantity": 2,
            "added_at": "2024-01-15T11:15:00Z"
        }
    ]'::jsonb,
    '[
        {
            "product_id": 6,
            "added_at": "2024-01-14T15:20:00Z"
        },
        {
            "product_id": 2,
            "added_at": "2024-01-13T09:45:00Z"
        }
    ]'::jsonb,
    '{
        "newsletter": true,
        "notifications": {
            "email": true,
            "sms": false
        },
        "preferred_categories": ["soaps", "hair-care"],
        "currency": "USD",
        "language": "en"
    }'::jsonb
),
(
    'user-456e7890-e12c-34d5-b678-901234567890',
    'Sarah Wilson',
    'sarah.wilson@example.com',
    'customer',
    '[
        {
            "product_id": 4,
            "quantity": 1,
            "added_at": "2024-01-16T14:20:00Z"
        }
    ]'::jsonb,
    '[
        {
            "product_id": 1,
            "added_at": "2024-01-15T12:30:00Z"
        }
    ]'::jsonb,
    '{
        "newsletter": false,
        "notifications": {
            "email": true,
            "sms": true
        },
        "preferred_categories": ["shampoos", "essential-oils"],
        "currency": "USD",
        "language": "en"
    }'::jsonb
);

-- Update product ratings and review counts based on sample data
UPDATE products SET rating = 4.8, reviews_count = 124 WHERE id = 1;
UPDATE products SET rating = 4.9, reviews_count = 89 WHERE id = 2;
UPDATE products SET rating = 4.7, reviews_count = 156 WHERE id = 3;
UPDATE products SET rating = 4.6, reviews_count = 98 WHERE id = 4;
UPDATE products SET rating = 4.5, reviews_count = 67 WHERE id = 5;
UPDATE products SET rating = 4.9, reviews_count = 45 WHERE id = 6;
UPDATE products SET rating = 4.7, reviews_count = 78 WHERE id = 7;
UPDATE products SET rating = 4.4, reviews_count = 92 WHERE id = 8;
