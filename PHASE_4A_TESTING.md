# Phase 4a: Test & Validate Phase 2 Features

**Objective**: Validate Stripe webhook integration, admin draws workflow, and subscription lifecycle end-to-end.

**Prerequisites**:
- ✅ Stripe test account (keys configured in `.env.local`)
- ✅ App running locally (`npm run dev`)
- ✅ Database seeded with charities + initial profiles
- ✅ Test cards available (4242 4242 4242 4242 for success)

---

## **1. STRIPE WEBHOOK TESTING**

### **1.1 Webhook Signature Verification**

**Test Objective**: Confirm webhook handler validates Stripe signature header correctly.

**Setup**:
1. Get your `STRIPE_WEBHOOK_SECRET` from Stripe Dashboard:
   - Dashboard → Developers → Webhooks
   - Find endpoint: `http://localhost:3000/api/stripe/webhook`
   - Copy **Signing secret** (starts with `whsec_test_`)
   - Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_KEY`

2. Start ngrok (expose localhost to Stripe):
   ```powershell
   # Install: https://ngrok.com/download
   ngrok http 3000
   ```
   - Copy forwarding URL: `https://abc123.ngrok.io`

3. Update Stripe endpoint:
   - Dashboard → Developers → Webhooks → Your endpoint
   - Change URL to: `https://abc123.ngrok.io/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

**Test Case 1.1.1: Invalid Signature**
- Send fake POST to webhook:
  ```powershell
  $headers = @{"stripe-signature" = "invalid_sig"}
  Invoke-WebRequest -Uri "http://localhost:3000/api/stripe/webhook" `
    -Method POST `
    -Headers $headers `
    -Body '{"id": "test"}'
  ```
- **Expected**: 401 Unauthorized (signature validation fails)

**Test Case 1.1.2: Valid Signature with Test Event**
- Use Stripe CLI to send test event:
  ```powershell
  # Install: https://stripe.com/docs/stripe-cli
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  # Copy signing secret, add to .env.local
  
  stripe trigger checkout.session.completed
  ```
- **Expected**: 200 OK, webhook logs event processing

---

### **1.2 Checkout Session Completion Flow**

**Test Objective**: Verify checkout completion event syncs Stripe customer/subscription to profiles table.

**Setup**:
1. Open app on `http://localhost:3000`
2. Sign up test user:
   - Email: `test-user@example.com`
   - Password: `TestPass123!`
   - Verify email (check console logs for verification link if dev mode)
   - Log in

3. Navigate to `/dashboard/subscription`

**Test Case 1.2.1: Start Checkout → Complete Payment**
- Click **"Start Subscription Checkout"** button
- Redirected to Stripe checkout page
- Enter test card: `4242 4242 4242 4242`
- Email: auto-filled
- Name: "Test User"
- Click **"Subscribe"**
- **Expected**: 
  - Redirected to `/dashboard/subscription?checkout=success`
  - Page shows: Stripe Customer ID (cs_test_...) + Subscription ID (sub_test_...)
  - Webhook logs: `checkout.session.completed` processed
  - DB check (via Supabase Studio):
    ```sql
    SELECT id, stripe_customer_id, stripe_subscription_id, subscription_status 
    FROM profiles WHERE email = 'test-user@example.com';
    -- Expected: stripe_customer_id filled, subscription_status = 'active'
    ```

**Test Case 1.2.2: Cancel Checkout**
- Start checkout again (different test user or same user if subscription_status allows)
- Click **"Back"** on Stripe page (before entering card)
- **Expected**: Redirected to `/dashboard/subscription?checkout=cancelled`
- DB check: `stripe_customer_id` should remain null/unchanged

---

### **1.3 Subscription Status Sync**

**Test Objective**: Verify subscription status updates propagate from Stripe webhook to profiles table.

**Prerequisites**: Active subscription from Test Case 1.2.1

**Test Case 1.3.1: Subscription Status = Active**
- Check DB: `subscription_status = 'active'`
- Dashboard `/dashboard` displays "Subscriber: active" in status label
- Draws page `/dashboard/draws` **is accessible** (not blocked)

**Test Case 1.3.2: Cancel Subscription**
- Go to `/dashboard/subscription` → Click **"Manage Billing"**
- Opens Stripe billing portal
- Click **"Cancel plan"** → Confirm cancellation
- Wait 5–10 seconds for webhook sync
- **Expected**:
  - Webhook logs: `customer.subscription.deleted` event
  - DB: `subscription_status = 'canceled'`
  - Dashboard: Status changes to "Subscriber: canceled" (red indicator)
  - Draws page: **Blocked** with message "Active subscription required"

**Test Case 1.3.3: Reactivate Subscription**
- From `/dashboard/subscription`, click **"Start Subscription Checkout"** again
- Complete payment with new card or Stripe billing portal
- Wait 5–10 seconds for webhook
- **Expected**:
  - DB: `subscription_status = 'active'`
  - Draws page: Now accessible again

---

### **1.4 Subscription Period End Date Sync**

**Test Objective**: Confirm webhook syncs Stripe billing cycle end date to `subscription_current_period_end`.

**During Checkout & Active Subscription**:
- Check DB:
  ```sql
  SELECT subscription_status, subscription_current_period_end FROM profiles 
  WHERE id = 'user-id-here';
  -- Expected: current_period_end is ~30 days in future (IST timestamp)
  ```

---

## **2. ADMIN DRAWS TESTING**

### **2.1 Admin Access Control**

**Test Objective**: Verify only admin-role users can access `/dashboard/admin/draws`.

**Setup**:
1. Create two test users (in Supabase Studio):
   ```sql
   -- Create regular user in auth (via signup flow)
   -- Then in profiles table:
   UPDATE profiles SET role = 'user' WHERE email = 'regular@example.com';
   
   -- Create admin user:
   INSERT INTO profiles (id, email, full_name, role) 
   VALUES ('admin-uuid', 'admin@example.com', 'Admin Test', 'admin');
   ```

**Test Case 2.1.1: Regular User Access Denied**
- Log in as `regular@example.com`
- Try navigate to `/dashboard/admin/draws`
- **Expected**: 403 Forbidden or redirect to `/dashboard`

**Test Case 2.1.2: Admin Access Allowed**
- Log in as `admin@example.com`
- Navigate to `/dashboard/admin/draws`
- **Expected**: Page loads, shows:
  - Create Draw form
  - Assign Winner form
  - Recent Draws list (empty if first time)

---

### **2.2 Create Draw**

**Test Objective**: Verify draw creation stores all fields correctly.

**Test Case 2.2.1: Valid Draw Creation**
- Log in as admin
- Navigate to `/dashboard/admin/draws`
- Fill form:
  - **Draw Date**: Tomorrow (or future date)
  - **Draw Type**: `random` (or `algorithmic`)
  - **Prize Pool**: `100000` (₹100,000)
  - **Numbers**: `1,2,3,4,5,6,7,8,9,10` (CSV, min 5 numbers)
- Click **"Create Draw"**
- **Expected**:
  - Success message (or redirect refresh)
  - Recent Draws list shows new entry with:
    - Date + Type + Prize Pool
    - Status = `pending` (red badge initially)
  - DB check:
    ```sql
    SELECT id, draw_date, type, prize_pool, status, numbers FROM draws 
    ORDER BY created_at DESC LIMIT 1;
    -- Expected: status = 'pending', numbers array populated
    ```

**Test Case 2.2.2: Validation - Invalid Input**
- Try create with:
  - Empty date → Error: "Draw date required"
  - Past date → Error: "Draw date must be in future"
  - Fewer than 5 numbers → Error: "Minimum 5 numbers"
  - Invalid prize pool (negative, text) → Error: "Invalid prize pool"
- **Expected**: Form shows error, draw not created

---

### **2.3 Publish Draw**

**Test Objective**: Verify draw status transitions from `pending` to `published`.

**Prerequisite**: Draw created in Test Case 2.2.1

**Test Case 2.3.1: Publish Draw**
- In Recent Draws list, find draw with status `pending`
- Click **"Publish"** button
- **Expected**:
  - Button disappears or becomes disabled
  - Status badge changes to `published` (green)
  - DB: `status = 'published'`
  - Draw now visible on `/draws` (public page) to all users

**Test Case 2.3.2: Verify Public Visibility**
- Log out or open incognito window
- Navigate to `/draws` (public page)
- **Expected**: Published draw appears in list with prize pool info

---

### **2.4 Assign Winner**

**Test Objective**: Verify winner assignment creates winner record with correct fields.

**Setup**:
1. Published draw from Test Case 2.3.1
2. Test user with active subscription (from Section 1.2.1)

**Test Case 2.4.1: Valid Winner Assignment**
- Log in as admin → `/dashboard/admin/draws`
- In Assign Winner form, fill:
  - **Draw**: Select published draw
  - **User**: Select test user from dropdown
  - **Match Tier**: `5` (all correct)
  - **Prize Amount**: `50000` (₹50,000)
- Click **"Assign Winner"**
- **Expected**:
  - Success message
  - DB check:
    ```sql
    SELECT id, draw_id, user_id, match_tier, prize_amount, status FROM winners 
    WHERE draw_id = 'draw-id-here' ORDER BY created_at DESC LIMIT 1;
    -- Expected: All fields populated, status = 'pending'
    ```

**Test Case 2.4.2: Validation - Invalid Tier**
- Try assign with **Match Tier**: `2` (invalid, only 3/4/5 allowed)
- **Expected**: Error message, winner not created

**Test Case 2.4.3: Verify Winner Record Linkage**
- As test user (not admin), go to `/dashboard/draws`
- **Expected**: Draw appears, and if modal/detail view exists, shows:
  - Current winner assigned
  - Prize amount

---

## **3. SUBSCRIPTION LIFECYCLE TESTING**

### **3.1 Signup Flow**

**Test Objective**: Verify new user registration creates profile with correct defaults.

**Test Case 3.1.1: Complete Signup**
- Navigate to `/auth/signup`
- Fill form:
  - Full Name: `John Golfer`
  - Email: `john@example.com`
  - Password: `SecurePass123!`
  - Confirm Password: `SecurePass123!`
- Click **"Sign Up"**
- **Expected**:
  - Redirected to login page with message: "Check email to verify"
  - DB check:
    ```sql
    SELECT id, email, full_name, role, subscription_status, subscription_current_period_end 
    FROM profiles WHERE email = 'john@example.com';
    -- Expected: 
    --   role = 'user'
    --   subscription_status = 'inactive' (no subscription yet)
    --   subscription_current_period_end = NULL
    ```

**Test Case 3.1.2: Verify Email & Login**
- Check console logs or dev email service for verification link
- Click link or paste token into verification page
- **Expected**: Email marked verified in Supabase auth
- Log in with credentials from 3.1.1
- **Expected**: Redirected to `/dashboard`

---

### **3.2 Subscription Activation (Checkout)**

**Test Objective**: Verify subscription activation via checkout flow.

**Prerequisite**: User from Test Case 3.1.2 logged in

**Test Case 3.2.1: Pre-Checkout State**
- Navigate to `/dashboard/subscription`
- **Expected**: Shows:
  - Status: "Inactive account" (gray badge)
  - Button: **"Start Subscription Checkout"**
  - No Stripe Customer ID / Subscription ID

**Test Case 3.2.2: Complete Checkout**
- Click **"Start Subscription Checkout"**
- Enter test card: `4242 4242 4242 4242`
- Complete payment
- Redirected to `/dashboard/subscription?checkout=success`
- **Expected**:
  - Stripe Customer ID displayed (cs_test_...)
  - Stripe Subscription ID displayed (sub_test_...)
  - Status: "Subscriber: active" (green badge)
  - "Manage Billing" button visible

---

### **3.3 Billing Portal Integration**

**Test Objective**: Verify billing portal access and invoice view.

**Prerequisite**: Active subscription from Test Case 3.2.2

**Test Case 3.3.1: Open Billing Portal**
- Click **"Manage Billing"** button
- **Expected**: 
  - Opens Stripe customer portal in new tab
  - Shows: Invoice history, payment methods, subscription details, cancel option

**Test Case 3.3.2: View Invoice**
- In Stripe portal, click on latest invoice
- **Expected**: Shows:
  - Amount: Plan price (₹999 or configured amount)
  - Date: Today
  - Status: Paid

---

### **3.4 Charity Assignment in Subscription Flow**

**Test Objective**: Verify charity percentage persists during subscription.

**Setup**:
1. User with active subscription from Test Case 3.2.2
2. Charities exist in DB (seeded in Phase 2)

**Test Case 3.4.1: Assign Charity**
- Go to `/dashboard/charity`
- Select charity: "Clean Water Alliance"
- Set percentage: `25%` (25% of subscription goes to charity)
- Save
- **Expected**:
  - DB: `charity_percentage = 25`, `charity_id = cleaned-water-alliance-id`
  - Dashboard `/dashboard` shows: "Supporting Charity: Clean Water Alliance"

**Test Case 3.4.2: Update Charity During Active Subscription**
- Change charity to "Global Education Fund", percentage `50%`
- **Expected**:
  - Profile updated without affecting subscription status
  - Next billing cycle allocations will use new percentage

---

### **3.5 Subscription Status Transitions (State Machine)**

**Test Objective**: Verify all possible subscription states and transitions.

**State Diagram**:
```
            ↓___create checkout___↓
        [inactive] ────────────→ [active]
            ↑                         ↓
            └─────cancel────────[canceled]
                    ↓ (re-checkout)
                 [active]
```

**Test Cases**:

| State | Trigger | Expected Next State | User Can... |
|-------|---------|---------------------|-------------|
| `inactive` | Not subscribed yet | `inactive` | View dashboard, not draws |
| `inactive` → `active` | Complete checkout | `active` | Enter draws, view scores |
| `active` → `past_due` | Payment fails (via Stripe test card) | `past_due` | View draws (locked), see "Update payment" message |
| `active` → `canceled` | Cancel via billing portal | `canceled` | Cannot enter draws, see "Reactivate subscription" |
| `canceled` → `active` | Restart checkout | `active` | Re-enter draws |

**Test Case 3.5.1: Trigger `past_due` (Optional - Advanced)**
- Create new test user + activate subscription
- Use Stripe dashboard to manually set subscription to `past_due`
- Webhook fires → DB syncs
- Go to `/dashboard/subscription`
- **Expected**: Status shows "Subscriber: past_due" (amber badge)
- Draws page: Locked with "Payment overdue. Update billing" message

---

## **4. INTEGRATION TESTS (Cross-Feature)**

### **4.1 Complete User Journey: Signup → Subscribe → Draw → Win**

**Test Case 4.1.1: Full Happy Path**

1. **Signup**: Register new user `journey@example.com`
2. **Email Verification**: Verify email
3. **First Login**: Log in, see dashboard
4. **Golf Score**: Submit score on `/dashboard/scores` (e.g., 36 Stableford)
5. **Check Eligibility**: Verify latest scores tracked (`/dashboard/scores`)
6. **Subscribe**: Go to `/dashboard/subscription` → checkout → complete
7. **Assign Charity**: `/dashboard/charity` → select "Forest Conservation" → 30%
8. **Entry Check**: Navigate `/dashboard/draws` → view current draw, see "Enter Draw" CTA
9. **Admin Assign Winner**: (As admin) Assign this user as winner for published draw
10. **Winner Verification**: (As user) Return to `/dashboard/draws`, verify winner status displayed

**Expected Outcomes**:
- ✅ All pages load without timeouts
- ✅ All DB transitions logged correctly
- ✅ Stripe webhook syncs all events
- ✅ User sees all status updates in real-time

---

## **5. ERROR HANDLING & EDGE CASES**

### **5.1 Network Failures**

**Test Case 5.1.1: Webhook Delivery Timeout**
- Disconnect internet mid-checkout
- Stripe retries webhook delivery (60-90 seconds later)
- Reconnect before retry
- **Expected**: Webhook eventually succeeds, profile syncs

### **5.1.2: Database Unavailable During Webhook**
- Take Supabase offline (or simulate with connection error)
- Send webhook event
- **Expected**: 500 error, Stripe retries webhook
- Bring Supabase back online
- Webhook succeeds on retry, data syncs

### **5.2 Timezone Rendering (IST)**

**Test Objective**: Verify all timestamps display in IST (UTC+05:30).

**Test Case 5.2.1: Subscription Period End in IST**
- Go to `/dashboard/subscription`
- Check "Last updated" timestamp and subscription end date
- **Expected**: Times match IST (may be +05:30 offset visible in DB)
- Example: 3:30 PM IST vs 10:00 AM UTC

**Test Case 5.2.2: Draw Date & Score Date in IST**
- Admin creates draw with date "2026-04-15"
- User submits score with date "2026-03-20"
- Go to `/dashboard/scores` and admin `/dashboard/admin/draws`
- **Expected**: All dates display in IST (no UTC offset visible to user)

---

## **6. PERFORMANCE UNDER LOAD (Optional)**

### **6.1 Query Timeout Verification**

**Test Case 6.1.1: Simulate Slow DB**
- Stop Supabase connection briefly (simulate network lag)
- Navigate to `/dashboard` or `/dashboard/admin/draws`
- **Expected**: 
  - Page waits up to 5 seconds for data
  - After 5s timeout: Renders with fallback/error message
  - No infinite loading state

---

## **7. TEST RESULT SUMMARY TEMPLATE**

Copy this for each test session:

```markdown
## Test Session: [Date/Time]

**Tester**: [Name]
**Environment**: Local (`npm run dev`)
**Stripe Keys**: [Test/Live + last 4 digits]

### Results By Section:

| Section | Test Case | Status | Notes |
|---------|-----------|--------|-------|
| 1. Webhook | 1.1.1 Invalid Sig | ✅ PASS | Returned 401 as expected |
| 1. Webhook | 1.1.2 Valid Sig | ✅ PASS | Event processed |
| 1. Webhook | 1.2.1 Checkout → Payment | ✅ PASS | Profile synced: cs_test_xxx |
| 1. Webhook | 1.2.2 Cancel | ✅ PASS | Redirected to cancel page |
| 1. Webhook | 1.3.1 Status Active | ✅ PASS | Draws page accessible |
| 1. Webhook | 1.3.2 Cancel Sub | ✅ PASS | Status changed to 'canceled' |
| 2. Draws | 2.1.1 Regular User Denied | ✅ PASS | 403 returned |
| 2. Draws | 2.2.1 Create Draw | ✅ PASS | Draw created with status='pending' |
| 2. Draws | 2.3.1 Publish Draw | ✅ PASS | Status='published', visible on /draws |
| 2. Draws | 2.4.1 Assign Winner | ✅ PASS | Winner record created |
| 3. Lifecycle | 3.1.1 Signup | ✅ PASS | Profile created, role='user' |
| 3. Lifecycle | 3.2.1 Checkout | ✅ PASS | Subscription active, stripe_customer_id synced |
| 3. Lifecycle | 3.4.1 Charity Assign | ✅ PASS | Charity linked, % saved |
| 4. Integration | 4.1.1 Full Journey | ✅ PASS | All steps completed |

### Issues Found:
- [List any failures]

### Blockers:
- [Any external dependency issues]

### Recommendations:
- [Improvements or follow-up tests]
```

---

## **Next Steps After Testing**

- ✅ All tests pass → Move to **Phase 4b: Deployment & CI/CD**
- ⚠️ Tests fail → Document issue + file for Phase 4c: Hardening

