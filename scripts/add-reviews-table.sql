-- Add reviews functionality to existing database

-- Create reviews table if not exists
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    helpful_count INTEGER DEFAULT 0,
    verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id) -- Prevent duplicate reviews from same user
);

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_verified_purchase ON reviews(verified_purchase);

-- Create trigger for reviews updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Drop existing function first to avoid parameter conflicts
DROP FUNCTION IF EXISTS calculate_product_rating(INTEGER);

-- Update the calculate_product_rating function
CREATE OR REPLACE FUNCTION calculate_product_rating(target_product_id INTEGER)
RETURNS VOID AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    -- Calculate average rating and count from reviews
    SELECT 
        COALESCE(AVG(rating), 0)::DECIMAL(3,2),
        COUNT(*)
    INTO avg_rating, review_count
    FROM reviews 
    WHERE product_id = target_product_id;
    
    -- Update product with calculated values
    UPDATE products 
    SET 
        rating = avg_rating,
        reviews_count = review_count,
        updated_at = NOW()
    WHERE id = target_product_id;
END;
$$ language 'plpgsql';

-- Drop existing trigger function to avoid conflicts
DROP FUNCTION IF EXISTS update_product_rating_trigger();

-- Create trigger to update product rating when reviews change
CREATE OR REPLACE FUNCTION update_product_rating_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_product_rating(OLD.product_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_product_rating(NEW.product_id);
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- Create triggers for automatic rating updates
DROP TRIGGER IF EXISTS update_rating_on_review_change ON reviews;
CREATE TRIGGER update_rating_on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating_trigger();

-- Create function to increment helpful count
CREATE OR REPLACE FUNCTION increment_helpful_count(review_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE reviews 
    SET helpful_count = helpful_count + 1,
        updated_at = NOW()
    WHERE id = review_id;
END;
$$ language 'plpgsql';

-- Enable Row Level Security on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reviews
-- Policy 1: Anyone can read reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (true);

-- Policy 2: Users can only insert their own reviews
CREATE POLICY "Users can insert their own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy 3: Users can only update their own reviews  
CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy 4: Users can only delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (auth.uid()::text = user_id);

-- Verify tables exist
SELECT 
    'reviews' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) >= 0 THEN '✓ Created successfully' ELSE '✗ Creation failed' END as status
FROM reviews;
