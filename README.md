<div align="center">
<img src="./public/logo.png" alt="Dhanya Naturals Logo" width="100"/>
</div>

# Dhanya Naturals - E-Commerce Platform

<div align="center">


<br/><br/>
  
![Dhanya Naturals](https://img.shields.io/badge/Dhanya-Naturals-4CAF50?style=for-the-badge&logo=leaf&logoColor=white)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)]()

*A modern, full-featured e-commerce platform for natural and organic products*

**Professional E-Commerce Solution | Built with Latest Technologies**

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Routes](#-api-routes)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 About

Dhanya Naturals is a professionally developed, comprehensive e-commerce platform built with cutting-edge web technologies. It delivers a seamless shopping experience for natural and organic products, featuring real-time inventory management, secure payment processing through Zoho Gateway, and automated email notifications via Resend.

**Key Business Value:**
- 🚀 Fast, responsive, and SEO-optimized
- 🔒 Enterprise-grade security
- 📈 Scalable architecture
- 💰 Multiple payment options for Indian customers
- 📧 Automated email workflows
- 📊 Comprehensive admin dashboard

---

## 🛠️ Tech Stack

### **Frontend**

<div>
  
![Next.js](https://img.shields.io/badge/Next.js-16.0-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

</div>

### **Backend & Database**

<div>

![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

### **UI Components & Styling**

<div>

![Radix UI](https://img.shields.io/badge/Radix_UI-Components-161618?style=for-the-badge&logo=radix-ui&logoColor=white)
![Shadcn/ui](https://img.shields.io/badge/shadcn/ui-Components-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide-Icons-F56565?style=for-the-badge&logo=lucide&logoColor=white)

</div>

### **Payment & Communication**

<div>

![Zoho](https://img.shields.io/badge/Zoho-Payments-C8202C?style=for-the-badge&logo=zoho&logoColor=white)
![Resend](https://img.shields.io/badge/Resend-Email-000000?style=for-the-badge&logo=resend&logoColor=white)

</div>

### **Developer Tools**

<div>

![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-Linting-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Git](https://img.shields.io/badge/Git-Version_Control-F05032?style=for-the-badge&logo=git&logoColor=white)

</div>

---

## ✨ Features

### 🛒 **E-Commerce Core**
- 🔐 Secure user authentication (Email/Password & Google OAuth)
- 🛍️ Shopping cart with real-time updates
- 💳 Multiple payment options (Online & Cash on Delivery)
- 📦 Order tracking and management
- ⭐ Product reviews and ratings
- ❤️ Wishlist functionality

### 👨‍💼 **Admin Dashboard**
- 📊 Real-time analytics and insights
- 📦 Inventory management
- 🛒 Order processing and status updates
- 👥 Customer management
- 📧 Email notification management

### 💰 **Payment Features**
- 💳 Zoho Payment Gateway integration
- 🔒 Secure payment processing
- 📱 UPI, Cards, Net Banking support
- 💵 Cash on Delivery option
- 🧾 Automatic invoice generation

### 📧 **Email Notifications**
- ✅ Order confirmation emails
- 📦 Order status updates
- 🚚 Shipping notifications
- 👨‍💼 Admin order alerts

### 🎨 **UI/UX Features**
- 🌓 Dark/Light mode support
- 📱 Fully responsive design
- ⚡ Optimized performance
- 🎭 Smooth animations and transitions
- 🎊 Confetti celebrations on successful orders
- 🔍 Advanced product search and filtering

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Zoho Payments account (for production)
- Resend account (for emails)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/dhanyanaturals.git
cd dhanyanaturals
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

See [Environment Variables](#-environment-variables) section below for details.

4. **Run database migrations**

```bash
# If using Supabase CLI
supabase db push

# Or manually run migrations
psql -U your_user -d your_database -f supabase/migrations/*.sql
```

5. **Start the development server**

```bash
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

### **Core Configuration**

```bash
# App URL (required for webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production domain
```

### **Supabase Configuration**

```bash
# Client-side (public)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server-side only (keep secret!)
SUPABASE_URL=your_supabase_url  # For API routes and webhooks
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For admin operations
```

### **Zoho Payments Configuration**

```bash
NEXT_PUBLIC_ZOHO_ACCOUNT_ID=your_zoho_account_id
NEXT_PUBLIC_ZOHO_API_KEY=your_zoho_api_key

# OAuth Credentials (for Zoho API access)
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REDIRECT_URI=http://localhost:3000/api/zoho/callback
ZOHO_REFRESH_TOKEN=your_refresh_token  # Generated after first OAuth flow

# Webhook Security
ZOHO_WEBHOOK_SECRET=your_webhook_secret  # For signature verification
```

### **Email Configuration (Resend)**

```bash
RESEND_API_KEY=your_resend_api_key
```

### **Important Setup Notes**

1. **Webhook Configuration**: 
   - Set up webhook endpoint in Zoho dashboard: `/api/webhooks/zoho-payment`
   - See [docs/WEBHOOK_SETUP.md](docs/WEBHOOK_SETUP.md) for detailed instructions
   - Critical for handling payment race conditions

2. **Supabase Service Role Key**:
   - Required for server-side webhook operations
   - Keep this secret and never expose to client

3. **Zoho OAuth Setup**:
   - Follow the OAuth flow to get refresh token
   - Access `/api/zoho/auth` to initiate OAuth
   - Token is used for payment verification and webhook processing

4. **Production Deployment**:
   - Update `NEXT_PUBLIC_APP_URL` to your production domain
   - Configure Zoho webhook URL in their dashboard
   - Ensure all secrets are properly secured

---
## 📁 Project Structure

```
dhanyanaturals/
├── app/                      # Next.js 13+ App Directory
│   ├── api/                 # API Routes
│   │   └── emails/         # Email API endpoints
│   ├── admin/              # Admin dashboard
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout flow
│   ├── products/           # Product pages
│   ├── auth/               # Authentication
│   └── page.tsx            # Home page
├── components/              # React components
│   ├── ui/                 # Shadcn/ui components
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ZohoPaymentWidget.tsx
├── contexts/               # React contexts
│   ├── AuthContext.tsx
│   └── CartContext.tsx
├── lib/                    # Utility functions
│   ├── supabase.ts        # Supabase client & services
│   ├── types.ts           # TypeScript types
│   ├── resend.ts          # Email service
│   └── utils.ts           # Helper functions
├── public/                 # Static assets
└── styles/                 # Global styles
```

---

## 🔌 API Routes

### **Email APIs**
- `POST /api/emails/order-placed` - Send order confirmation email
- `POST /api/emails/order-status` - Send order status update email

### **Payment APIs**
- `POST /api/payments/verify` - Verify payment status with Zoho
- `POST /api/webhooks/zoho-payment` - Handle Zoho payment webhooks (server-to-server)
- `GET /api/webhooks/zoho-payment` - Webhook health check

### **Zoho OAuth APIs**
- `GET /api/zoho/auth` - Initiate Zoho OAuth flow
- `GET /api/zoho/callback` - Handle OAuth callback
- `GET /api/zoho/token-status` - Check token status (admin only)

### **Testing Email API**
```bash
curl -X POST http://localhost:3000/api/emails/order-placed \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@example.com",
    "orderId": "12345",
    "customerName": "John Doe",
    "total": 599.99,
    "items": [
      {"name": "Neem Soap", "qty": 2, "price": 150}
    ]
  }'
```

---

## 🎯 Key Features Implementation

### **Authentication Flow**
- Email/Password authentication via Supabase
- Google OAuth integration
- Protected routes with middleware
- Session management with HTTP-only cookies

### **Payment Processing**
- Zoho Payment Gateway integration
- Real-time payment status updates
- **Server-side webhook notifications** - Eliminates race conditions
- Automatic order confirmation even if browser is closed
- Payment recovery modal for failed transactions
- Idempotent webhook processing with audit trail

### **State Management**
- React Context API for global state
- Optimistic UI updates for better UX
- Real-time cart synchronization

### **Email System**
- Transactional emails via Resend
- HTML email templates
- Order confirmations and updates
- Admin notifications

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React Framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Shadcn/ui](https://ui.shadcn.com/) - UI Components
- [Vercel](https://vercel.com/) - Deployment Platform
- [Resend](https://resend.com/) - Email Service

---

---

## 📊 Performance Metrics

- ⚡ **Lighthouse Score:** 95+ (Performance)
- 🎯 **SEO Optimized:** Meta tags, structured data
- 📱 **Mobile First:** Fully responsive design
- 🔒 **Security:** HTTPS, secure payment gateway
- 🚀 **Load Time:** < 2s on 4G networks

---

## 🛡️ Security Features

- ✅ Supabase Row Level Security (RLS)
- ✅ HTTP-only cookies for session management
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF tokens
- ✅ Secure payment processing via Zoho
- ✅ Environment variables for sensitive data

---

## 📞 Maintenance & Support

For ongoing maintenance, feature requests, or technical issues, please contact the development team through the email addresses listed above.

**Recommended Maintenance:**
- Regular database backups (automated via Supabase)
- Monthly security updates
- Performance monitoring via Vercel Analytics
- Email delivery monitoring via Resend dashboard

---

<div align="center">

**Professional E-Commerce Solution for Dhanya Naturals**
*Developed with modern technologies and best practices*
</div>

