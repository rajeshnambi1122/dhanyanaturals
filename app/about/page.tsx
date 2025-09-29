import Image from "next/image";
import { Leaf, Heart, Users, Award, CheckCircle, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen glass-background py-6">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-6 animate-fade-in">
            About Dhanya Naturals
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto animate-slide-up">
            Crafting natural wellness solutions with traditional wisdom and modern care. 
            Our journey began with a simple belief - nature holds the key to healthy living.
          </p>
        </div>

        {/* Story Section */}
        <div className="glass-card p-8 mb-16 animate-scale-in">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Heart className="h-8 w-8 text-green-600" />
                Our Story
              </h2>
              <p className="text-gray-600 mb-6">
                Founded with a passion for natural wellness, Dhanya Naturals emerged from a deep 
                understanding of traditional Ayurvedic practices and their timeless benefits. Our 
                journey started in the coastal town of Tiruchendur, where ancient wisdom meets 
                modern innovation.
              </p>
              <p className="text-gray-600 mb-6">
                Every product we create is a testament to our commitment to purity, quality, and 
                the healing power of nature. We believe that true beauty and wellness come from 
                embracing what nature has generously provided us.
              </p>
              <p className="text-gray-600">
                From our humble beginnings to becoming a trusted name in natural products, our 
                mission remains unchanged - to bring you the finest organic and natural solutions 
                for a healthier, more beautiful life.
              </p>
            </div>
            <div className="glass-card p-6">
              <div className="aspect-square relative overflow-hidden rounded-xl">
                <Image
                  src="/logo.png"
                  alt="Dhanya Naturals Story"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 text-center hover-lift">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">100% Natural</h3>
              <p className="text-gray-600">
                We use only the finest natural ingredients, free from harmful chemicals and artificial additives.
              </p>
            </div>
            <div className="glass-card p-8 text-center hover-lift">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Quality First</h3>
              <p className="text-gray-600">
                Every product undergoes rigorous quality checks to ensure you receive only the best.
              </p>
            </div>
            <div className="glass-card p-8 text-center hover-lift">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Customer Care</h3>
              <p className="text-gray-600">
                Your wellness journey is our priority. We're here to support you every step of the way.
              </p>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="glass-card p-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-green-600" />
              Our Mission
            </h3>
            <p className="text-gray-600 mb-4">
              To provide authentic, natural, and effective wellness products that enhance your 
              daily life while honoring traditional wisdom and sustainable practices.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-gray-600">Promote natural wellness</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-gray-600">Support sustainable practices</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-gray-600">Preserve traditional knowledge</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Team Section */}
        <div className="glass-card p-8 text-center">
          <h2 className="text-3xl font-bold mb-6 gradient-text">Our Commitment</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-8">
            At Dhanya Naturals, we're more than just a brand - we're a family dedicated to your 
            wellness journey. Our team of passionate experts works tirelessly to bring you 
            products that truly make a difference in your life.
          </p>
          <div className="flex justify-center items-center gap-6 text-green-600">
            <div className="text-center">
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm text-gray-500">Natural</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-gray-500">Happy Customers</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-3xl font-bold">2+</div>
              <div className="text-sm text-gray-500">Years Experience</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}