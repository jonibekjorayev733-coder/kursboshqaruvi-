# 🔌 REAL PAYMENT API REFERENCE

## Backend Payment Gateway Service

### File: `backend/payment_gateways.py`

Complete API reference for all payment gateway integrations.

---

## Stripe Payment Service

### Class: `StripePaymentService`

#### Method: `create_payment_intent()`

```python
@staticmethod
def create_payment_intent(
    amount: float,              # Amount in cents (50000 = 500 UZS)
    student_id: int,            # Student making payment
    course_id: int,             # Course being paid for
    currency: str = "uzs"       # Currency code
) -> Dict[str, Any]:
```

**Returns:**
```python
{
    "success": True,
    "client_secret": "pi_1..._secret_xyz",
    "payment_intent_id": "pi_1...",
    "amount": 50000,
    "currency": "uzs",
    "status": "requires_payment_method"
}
```

**Error Response:**
```python
{
    "success": False,
    "error": "Card declined",
    "code": "card_declined"
}
```

---

#### Method: `confirm_payment()`

```python
@staticmethod
def confirm_payment(
    payment_intent_id: str      # Intent ID from create_payment_intent
) -> Dict[str, Any]:
```

**Returns on Success:**
```python
{
    "success": True,
    "status": "succeeded",
    "amount": 50000,
    "currency": "uzs",
    "charges": [
        {
            "id": "ch_1...",
            "card_brand": "visa",
            "card_last4": "4242"
        }
    ]
}
```

**Returns on Failure:**
```python
{
    "success": False,
    "error": "Invalid payment intent",
    "status": "failed"
}
```

---

## Click Payment Service

### Class: `ClickPaymentService`

#### Method: `create_invoice()` (Async)

```python
@staticmethod
async def create_invoice(
    amount: float,              # Amount in main currency
    student_id: int,            # Student making payment
    course_id: int,             # Course being paid for
    phone: str,                 # Phone number for payment
    description: str = ""       # Payment description
) -> Dict[str, Any]:
```

**Returns on Success:**
```python
{
    "success": True,
    "invoice_id": "INV_12345",
    "payment_url": "https://click.uz/pay/INV_12345",
    "amount": 50000
}
```

**Returns on Error:**
```python
{
    "success": False,
    "error": "Invalid merchant ID"
}
```

---

#### Method: `verify_payment()` (Async)

```python
@staticmethod
async def verify_payment(
    transaction_id: str         # Transaction ID to verify
) -> Dict[str, Any]:
```

**Returns on Success:**
```python
{
    "success": True,
    "status": "completed",
    "amount": 50000,
    "created_at": "2024-04-16T10:30:00Z"
}
```

**Returns on Error:**
```python
{
    "success": False,
    "error": "Transaction not found"
}
```

---

## Payme Payment Service

### Class: `PaymePaymentService`

#### Method: `create_receipt()` (Async)

```python
@staticmethod
async def create_receipt(
    amount: float,              # Amount in main currency
    student_id: int,            # Student making payment
    course_id: int,             # Course being paid for
    phone: str,                 # Phone number for payment
    description: str = ""       # Payment description
) -> Dict[str, Any]:
```

**Returns on Success:**
```python
{
    "success": True,
    "receipt_id": "RCP_67890",
    "url": "https://checkout.paycom.uz/pay/RCP_67890",
    "amount": 50000
}
```

**Returns on Error:**
```python
{
    "success": False,
    "error": "Merchant not found"
}
```

---

#### Method: `get_payment_status()` (Async)

```python
@staticmethod
async def get_payment_status(
    receipt_id: str             # Receipt ID to check
) -> Dict[str, Any]:
```

**Returns on Success:**
```python
{
    "success": True,
    "status": 2,                # 2 = paid, 1 = pending, 0 = failed
    "amount": 50000,
    "paid": True                # Boolean for easy checking
}
```

**Returns on Error:**
```python
{
    "success": False,
    "error": "Receipt not found"
}
```

---

## Google Pay Service

### Class: `GooglePayService`

#### Method: `create_payment_request()`

```python
@staticmethod
def create_payment_request(
    amount: float,              # Amount to pay
    currency: str = "UZS",      # Currency code
    description: str = ""       # Payment description
) -> Dict[str, Any]:
```

**Returns:**
```python
{
    "apiVersion": 2,
    "apiVersionMinor": 0,
    "allowedPaymentMethods": [
        {
            "type": "CARD",
            "parameters": {
                "allowedAuthMethods": ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                "allowedCardNetworks": ["MASTERCARD", "VISA"]
            },
            "tokenizationSpecification": {
                "type": "PAYMENT_GATEWAY",
                "parameters": {
                    "gateway": "stripe",
                    "gatewayMerchantId": "pk_test_..."
                }
            }
        }
    ],
    "merchantInfo": {
        "merchantId": "MERCHANT_ID",
        "merchantName": "EduGrow Platform"
    },
    "transactionInfo": {
        "totalPriceStatus": "FINAL",
        "totalPrice": "50000",
        "currencyCode": "UZS",
        "countryCode": "UZ"
    }
}
```

---

## Unified Payment Processor

### Class: `PaymentProcessor`

#### Method: `process_payment()` (Async)

Routes payment to the correct gateway based on method.

```python
@staticmethod
async def process_payment(
    method: str,                # 'stripe', 'click', 'payme', 'googlepay'
    amount: float,              # Amount to pay
    student_id: int,            # Student ID
    course_id: int,             # Course ID
    phone: Optional[str] = None,    # Phone for Click/Payme
    card_token: Optional[str] = None,   # Token for Stripe
    description: str = ""       # Payment description
) -> Dict[str, Any]:
```

**Example Calls:**

**Stripe:**
```python
result = await PaymentProcessor.process_payment(
    method="stripe",
    amount=50000,
    student_id=1,
    course_id=1
)
# Returns: { "success": True, "client_secret": "...", ... }
```

**Click:**
```python
result = await PaymentProcessor.process_payment(
    method="click",
    amount=50000,
    student_id=1,
    course_id=1,
    phone="+998901234567",
    description="Course payment"
)
# Returns: { "success": True, "invoice_id": "...", "payment_url": "...", ... }
```

**Payme:**
```python
result = await PaymentProcessor.process_payment(
    method="payme",
    amount=50000,
    student_id=1,
    course_id=1,
    phone="+998901234567",
    description="Course payment"
)
# Returns: { "success": True, "receipt_id": "...", "url": "...", ... }
```

**Google Pay:**
```python
result = await PaymentProcessor.process_payment(
    method="googlepay",
    amount=50000,
    student_id=1,
    course_id=1,
    description="Course payment"
)
# Returns: Google Pay payment request object
```

---

#### Method: `verify_payment()` (Async)

Verifies payment with the appropriate gateway.

```python
@staticmethod
async def verify_payment(
    method: str,                # 'stripe', 'click', 'payme', etc.
    payment_id: str,            # Payment/transaction ID
    transaction_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
```

**Example Verification:**

```python
# Stripe
result = await PaymentProcessor.verify_payment(
    method="stripe",
    payment_id="pi_1..."
)

# Click
result = await PaymentProcessor.verify_payment(
    method="click",
    payment_id="TXN_12345"
)

# Payme
result = await PaymentProcessor.verify_payment(
    method="payme",
    payment_id="RCP_67890"
)
```

---

## REST API Endpoints

### File: `backend/main.py`

---

## Stripe Endpoints

### POST `/payments/real/stripe/create-intent`

Create a Stripe payment intent for card payment.

**Request:**
```json
{
    "student_id": 1,
    "course_id": 1,
    "amount": 50000
}
```

**Response (200):**
```json
{
    "client_secret": "pi_1..._secret_...",
    "payment_intent_id": "pi_1...",
    "amount": 50000,
    "currency": "UZS",
    "status": "pending"
}
```

**Error Response (400):**
```json
{
    "detail": "Student or course not found"
}
```

---

### POST `/payments/real/stripe/confirm`

Confirm a Stripe payment after processing.

**Request:**
```json
{
    "payment_intent_id": "pi_1...",
    "student_id": 1,
    "course_id": 1
}
```

**Response (200):**
```json
{
    "success": true,
    "payment_id": 123,
    "status": "paid",
    "amount": 50000,
    "message": "Payment successful! Real money has been received."
}
```

**Error Response (400):**
```json
{
    "detail": "Payment verification failed"
}
```

---

## Click Endpoints

### POST `/payments/real/click/create-invoice`

Create a Click payment invoice.

**Request:**
```json
{
    "student_id": 1,
    "course_id": 1,
    "amount": 50000,
    "phone": "+998901234567"
}
```

**Response (200):**
```json
{
    "invoice_id": "INV_12345",
    "payment_url": "https://click.uz/pay/INV_12345",
    "amount": 50000,
    "phone": "+998901234567",
    "message": "Click invoice created. Redirect user to payment_url"
}
```

**Error Response (400):**
```json
{
    "detail": "Invalid merchant credentials"
}
```

---

### POST `/payments/real/click/verify`

Verify a Click payment.

**Request:**
```json
{
    "transaction_id": "TXN_12345",
    "student_id": 1,
    "course_id": 1
}
```

**Response (200) - Paid:**
```json
{
    "success": true,
    "payment_id": 123,
    "status": "paid",
    "message": "Click payment verified! Real money received."
}
```

**Response (200) - Not yet paid:**
```json
{
    "success": false,
    "status": "pending",
    "message": "Payment not yet completed"
}
```

---

## Payme Endpoints

### POST `/payments/real/payme/create-receipt`

Create a Payme payment receipt.

**Request:**
```json
{
    "student_id": 1,
    "course_id": 1,
    "amount": 50000,
    "phone": "+998901234567"
}
```

**Response (200):**
```json
{
    "receipt_id": "RCP_67890",
    "payment_url": "https://checkout.paycom.uz/pay/RCP_67890",
    "amount": 50000,
    "phone": "+998901234567",
    "message": "Payme receipt created. User can pay from their wallet."
}
```

---

### POST `/payments/real/payme/check-status`

Check a Payme payment status.

**Request:**
```json
{
    "receipt_id": "RCP_67890",
    "student_id": 1,
    "course_id": 1
}
```

**Response (200) - Paid:**
```json
{
    "success": true,
    "payment_id": 123,
    "status": "paid",
    "message": "Payme payment confirmed! Real money received."
}
```

**Response (200) - Not yet paid:**
```json
{
    "success": false,
    "status": "pending",
    "message": "Payment not yet completed"
}
```

---

## Google Pay Endpoint

### GET `/payments/real/google-pay/config`

Get Google Pay payment configuration.

**Query Parameters:**
```
student_id=1
course_id=1
```

**Response (200):**
```json
{
    "apiVersion": 2,
    "apiVersionMinor": 0,
    "allowedPaymentMethods": [...],
    "merchantInfo": {...},
    "transactionInfo": {
        "totalPriceStatus": "FINAL",
        "totalPrice": "50000",
        "currencyCode": "UZS",
        "countryCode": "UZ"
    }
}
```

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Payment processed |
| 400 | Bad Request | Check input parameters |
| 401 | Unauthorized | Check API keys |
| 404 | Not Found | Student/course doesn't exist |
| 500 | Server Error | Contact support |

---

## Data Models

### Payment Database Model

```python
class Payment(Base):
    __tablename__ = "payment"
    
    id: int                                 # Primary key
    student_id: int                         # ForeignKey
    course_id: int                          # ForeignKey
    amount: float                           # Payment amount
    status: str                             # "paid", "pending", "failed"
    payment_method: str                     # "stripe", "click", "payme", "googlepay"
    payment_details: dict                   # JSON: transaction ID, card last4, etc.
    created_at: datetime                    # When payment initiated
    updated_at: datetime                    # When payment confirmed
```

### Payment Details Structure

**Stripe:**
```json
{
    "payment_intent_id": "pi_1...",
    "charges": [
        {
            "id": "ch_1...",
            "card_brand": "visa",
            "card_last4": "4242"
        }
    ]
}
```

**Click:**
```json
{
    "transaction_id": "TXN_12345",
    "phone": "+998901234567",
    "method": "Click",
    "processedAt": "2024-04-16T10:30:00Z"
}
```

**Payme:**
```json
{
    "receipt_id": "RCP_67890",
    "phone": "+998901234567",
    "method": "Payme",
    "processedAt": "2024-04-16T10:30:00Z"
}
```

---

## Complete Request/Response Examples

### Example 1: Full Stripe Payment Flow

**Step 1: Create Intent**
```bash
curl -X POST http://localhost:8001/payments/real/stripe/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "course_id": 1,
    "amount": 50000
  }'
```

**Response:**
```json
{
    "client_secret": "pi_1IqfK7..._secret_wO2...",
    "payment_intent_id": "pi_1IqfK7...",
    "amount": 50000,
    "currency": "UZS",
    "status": "pending"
}
```

**Step 2: Confirm Payment**
```bash
curl -X POST http://localhost:8001/payments/real/stripe/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "payment_intent_id": "pi_1IqfK7...",
    "student_id": 1,
    "course_id": 1
  }'
```

**Response:**
```json
{
    "success": true,
    "payment_id": 42,
    "status": "paid",
    "amount": 50000,
    "message": "Payment successful! Real money has been received."
}
```

---

### Example 2: Full Click Payment Flow

**Step 1: Create Invoice**
```bash
curl -X POST http://localhost:8001/payments/real/click/create-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "course_id": 1,
    "amount": 50000,
    "phone": "+998901234567"
  }'
```

**Response:**
```json
{
    "invoice_id": "INV_abc123",
    "payment_url": "https://click.uz/pay/INV_abc123",
    "amount": 50000,
    "phone": "+998901234567",
    "message": "Click invoice created. Redirect user to payment_url"
}
```

**Step 2: Verify Payment**
```bash
curl -X POST http://localhost:8001/payments/real/click/verify \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "INV_abc123",
    "student_id": 1,
    "course_id": 1
  }'
```

**Response:**
```json
{
    "success": true,
    "payment_id": 43,
    "status": "paid",
    "message": "Click payment verified! Real money received."
}
```

---

## Implementation Notes

### Async Operations

Click and Payme use async operations:

```python
import asyncio

# Async call
result = await PaymentProcessor.process_payment(
    method="click",
    amount=50000,
    student_id=1,
    course_id=1,
    phone="+998901234567"
)

# In FastAPI endpoint, use async:
@app.post("/payments/real/click/create-invoice")
async def create_click_invoice(...):
    result = await ClickPaymentService.create_invoice(...)
    return result
```

### Error Handling

All services include error handling:

```python
try:
    result = StripePaymentService.create_payment_intent(...)
    if not result.get("success"):
        raise HTTPException(400, result["error"])
except stripe.error.CardError as e:
    raise HTTPException(400, f"Card error: {e.message}")
except Exception as e:
    raise HTTPException(500, "Server error")
```

---

**This API is production-ready and fully documented!** 🚀
