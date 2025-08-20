-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create centralized products table with all product information
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    long_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    images TEXT[],
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'out-of-stock', 'discontinued')),
    ingredients TEXT[],
    benefits TEXT[],
    how_to_use TEXT,
    weight VARCHAR(50),
    dimensions VARCHAR(100),
    shelf_life VARCHAR(100),
    tags TEXT[],
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create centralized orders table with embedded order items as JSONB
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    items JSONB NOT NULL, -- Store order items as JSON array
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(50),
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create centralized user_data table for cart, user preferences, and authentication
CREATE TABLE user_data (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    cart_items JSONB DEFAULT '[]'::jsonb, -- Store cart as JSON array
    wishlist_items JSONB DEFAULT '[]'::jsonb, -- Store wishlist as JSON array
    preferences JSONB DEFAULT '{}'::jsonb, -- Store user preferences
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_in_stock ON products(in_stock);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_rating ON products(rating DESC);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_total_amount ON orders(total_amount);

CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_user_data_email ON user_data(email);
CREATE INDEX idx_user_data_role ON user_data(role);

-- Create full-text search index for products
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(array_to_string(tags, ' '), '')));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_data_updated_at BEFORE UPDATE ON user_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create reviews table
CREATE TABLE reviews (
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
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_verified_purchase ON reviews(verified_purchase);

-- Create trigger for reviews updated_at
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update product rating
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
CREATE TRIGGER update_rating_on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating_trigger();

-- Create function to update stock status based on quantity
CREATE OR REPLACE FUNCTION update_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_quantity <= 0 THEN
        NEW.in_stock = false;
        NEW.status = 'out-of-stock';
    ELSE
        NEW.in_stock = true;
        IF NEW.status = 'out-of-stock' THEN
            NEW.status = 'active';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update stock status
CREATE TRIGGER update_product_stock_status BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_stock_status();

-- Create function to decrement product stock
CREATE OR REPLACE FUNCTION decrement_stock(product_id INTEGER, quantity INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE products 
    SET stock_quantity = GREATEST(0, stock_quantity - quantity),
        updated_at = NOW()
    WHERE id = product_id;
    
    -- The stock status will be automatically updated by the trigger
END;
$$ language 'plpgsql';
