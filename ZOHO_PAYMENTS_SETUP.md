# Zoho Payments Integration Guide

## 🚀 **Complete Zoho Payments Setup for Dhanya Naturals**

### **Step 1: Sign Up for Zoho Payments**

1. **Visit**: [Zoho Payments](https://www.zoho.com/in/payments/)
2. **Create Account** with your business details:
   - Business Name: Dhanya Naturals
   - Email: rajeshnambi2016@gmail.com
   - Business Type: E-commerce/Retail
   - Products: Natural & Organic Products

3. **Complete KYC Verification**:
   - Upload business documents
   - Provide bank account details
   - Verification takes 1-2 business days

### **Step 2: Get API Credentials**

After account approval:

1. **Go to**: Zoho Payments Dashboard → Settings → API & Webhooks
2. **Generate Credentials**:
   - Client ID
   - Client Secret
   - Webhook Secret

### **Step 3: Environment Variables**

Add these to your `.env.local` file:

```env
# Zoho Payments Configuration
ZOHO_CLIENT_ID=your_zoho_client_id_here
ZOHO_CLIENT_SECRET=your_zoho_client_secret_here
ZOHO_WEBHOOK_SECRET=your_zoho_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://dhanyanaturals.in
```

### **Step 4: Configure Webhooks in Zoho**

1. **Login to Zoho Payments Dashboard**
2. **Go to**: Settings → Webhooks
3. **Add Webhook URL**: `https://dhanyanaturals.in/api/payments/webhook`
4. **Select Events**:
   - ✅ payment.completed
   - ✅ payment.failed
   - ✅ payment.pending
   - ✅ payment.cancelled

### **Step 5: Test the Integration**

#### **Test in Development:**
1. **Set up test credentials** from Zoho (sandbox mode)
2. **Test payment flow**:
   - Add products to cart
   - Go to checkout
   - Select "Online Payment"
   - Complete test payment

#### **Production Testing:**
1. **Place a small test order** (₹1-10)
2. **Verify webhook reception**
3. **Check order status updates**
4. **Confirm email notifications**

### **Step 6: Supported Payment Methods**

Your integration supports:

✅ **UPI**: PhonePe, Google Pay, Paytm, BHIM
✅ **Credit Cards**: Visa, MasterCard, RuPay, American Express
✅ **Debit Cards**: All major banks
✅ **Net Banking**: 100+ banks
✅ **Wallets**: Paytm, MobiKwik, Freecharge
✅ **EMI**: Credit card EMI options

### **Step 7: Security Features**

🔒 **Built-in Security:**
- PCI DSS Level 1 Compliance
- 256-bit SSL encryption
- Two-factor authentication
- Fraud detection algorithms
- Secure tokenization

### **Step 8: Pricing Structure**

**Zoho Payments Charges:**
- **UPI**: 0.3% - 0.5%
- **Credit Cards**: 1.5% - 2.5%
- **Debit Cards**: 0.4% - 0.9%
- **Net Banking**: 0.3% - 0.9%
- **Wallets**: 1.0% - 2.0%

### **Step 9: Order Flow with Zoho Payments**

```
1. Customer selects "Online Payment" → 
2. Order data sent to Zoho API →
3. Customer redirected to Zoho payment page →
4. Customer completes payment →
5. Zoho sends webhook to your site →
6. Order status updated automatically →
7. Customer redirected to success page →
8. Confirmation email sent
```

### **Step 10: Dashboard & Analytics**

**Zoho Payments Dashboard provides:**
- ✅ Real-time transaction monitoring
- ✅ Payment analytics & reports
- ✅ Settlement tracking
- ✅ Refund management
- ✅ Customer payment history
- ✅ Revenue insights

### **Step 11: Go Live Checklist**

**Before going live:**

- [ ] Zoho account verified and approved
- [ ] API credentials configured in production
- [ ] Webhook endpoint tested and working
- [ ] Test transactions completed successfully
- [ ] SSL certificate active on domain
- [ ] Privacy policy and terms updated
- [ ] Customer support contact updated

### **Step 12: Customer Experience**

**What customers see:**

1. **Checkout Page**: Clear payment options with secure badges
2. **Payment Page**: Professional Zoho-hosted payment interface
3. **Success Page**: Order confirmation with payment details
4. **Email**: Automated confirmation with receipt

### **Step 13: Troubleshooting**

**Common Issues:**

1. **Payment Fails**:
   - Check API credentials
   - Verify webhook URL is accessible
   - Check Zoho dashboard for error logs

2. **Webhook Not Received**:
   - Test webhook URL manually
   - Check server logs
   - Verify webhook events are enabled

3. **Order Status Not Updated**:
   - Check database permissions
   - Verify orderService.updateOrderPaymentStatus function
   - Check webhook processing logs

### **Step 14: Support Contacts**

**Zoho Payments Support:**
- Email: payments-support@zohocorp.com
- Phone: +91-44-6619-8000
- Documentation: https://www.zoho.com/payments/help/

**Integration Support:**
- Your developer can refer to this guide
- API documentation: https://www.zoho.com/payments/api/

### **Step 15: Benefits for Your Business**

✅ **Instant Payments**: Funds settled within 24 hours
✅ **Better Conversion**: Multiple payment options increase sales
✅ **Professional Image**: Trusted payment gateway builds confidence
✅ **Automated Processing**: Reduces manual work
✅ **Better Cash Flow**: Faster payments vs COD
✅ **Analytics**: Understand customer payment preferences

## 🎯 **Next Steps**

1. **Sign up for Zoho Payments account**
2. **Complete KYC verification**
3. **Get API credentials and update environment variables**
4. **Configure webhooks**
5. **Test the integration**
6. **Go live!**

Your customers will now have a seamless, secure payment experience with multiple options beyond just Cash on Delivery!
