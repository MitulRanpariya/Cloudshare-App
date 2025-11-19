# CloudShare Application - Sequence Diagrams

## 1. User Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant ClerkAuth as Clerk Auth
    participant React as React App
    participant API as Spring Boot API
    participant MongoDB

    User->>Browser: Access Application
    Browser->>React: Load Landing Page
    React->>ClerkAuth: Check Auth Status
    
    alt Not Authenticated
        ClerkAuth-->>React: Redirect to Sign In
        User->>ClerkAuth: Enter Credentials
        ClerkAuth->>ClerkAuth: Validate User
        ClerkAuth-->>React: Return JWT Token
    else Already Authenticated
        ClerkAuth-->>React: Return JWT Token
    end
    
    React->>API: Request with JWT Token
    API->>API: Validate JWT (ClerkJwtAuthFilter)
    API->>MongoDB: Check/Create User Profile
    MongoDB-->>API: User Profile
    API-->>React: Protected Resource
    React-->>Browser: Display Dashboard
```

## 2. File Upload Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Dashboard as Dashboard Component
    participant Upload as DashboardUpload Component
    participant API as FileController
    participant FileService as FileMetadataService
    participant CreditService as UserCreditsService
    participant MongoDB
    participant FileSystem as Local Storage

    User->>Browser: Select/Drag Files (Max 5)
    Browser->>Upload: handleFileChange()
    Upload->>Upload: Validate File Count
    Upload-->>Dashboard: Update File List
    
    User->>Upload: Click Upload Button
    Upload->>Dashboard: handleUpload()
    Dashboard->>Dashboard: Create FormData
    Dashboard->>API: POST /api/v1.0/files/upload
    
    API->>FileService: uploadFiles(files[])
    FileService->>FileService: getCurrentProfile()
    FileService->>CreditService: hasEnoughCredits(count)
    
    alt Insufficient Credits
        CreditService-->>FileService: false
        FileService-->>API: Error: Not enough credits
        API-->>Dashboard: 400 Bad Request
        Dashboard-->>Browser: Show Error Message
    else Sufficient Credits
        CreditService-->>FileService: true
        
        loop For Each File
            FileService->>FileSystem: Save File (UUID filename)
            FileSystem-->>FileService: File Path
            FileService->>MongoDB: Save FileMetadata
            MongoDB-->>FileService: Saved Document
            FileService->>CreditService: consumeCredit()
            CreditService->>MongoDB: Update User Credits
        end
        
        FileService-->>API: List<FileMetadataDTO>
        API->>CreditService: getUserCredits()
        CreditService->>MongoDB: Query Credits
        MongoDB-->>CreditService: UserCredits
        CreditService-->>API: Credits Info
        API-->>Dashboard: 200 OK (files + credits)
        Dashboard->>Dashboard: fetchUserCredits()
        Dashboard->>API: GET /api/v1.0/files/my
        API-->>Dashboard: Recent Files
        Dashboard-->>Browser: Update UI
    end
```

## 3. File Management Flow (View/Download/Delete/Share)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant MyFiles as MyFiles Page
    participant FileCard as FileCard Component
    participant API as FileController
    participant FileService as FileMetadataService
    participant MongoDB
    participant FileSystem as Local Storage

    User->>Browser: Navigate to My Files
    Browser->>MyFiles: Load Component
    MyFiles->>API: GET /api/v1.0/files/my
    API->>FileService: getFiles()
    FileService->>MongoDB: findByClerkId()
    MongoDB-->>FileService: List<FileMetadata>
    FileService-->>API: List<FileMetadataDTO>
    API-->>MyFiles: File List
    MyFiles-->>Browser: Display Files

    alt Download File
        User->>FileCard: Click Download
        FileCard->>API: GET /api/v1.0/files/download/{id}
        API->>FileService: getDownloadableFile(id)
        FileService->>MongoDB: findById(id)
        MongoDB-->>FileService: FileMetadata
        FileService->>FileSystem: Read File
        FileSystem-->>API: File Resource
        API-->>Browser: File Download (200 OK)
        Browser-->>User: Save File
    
    else Toggle Public/Private
        User->>FileCard: Click Share Toggle
        FileCard->>API: PATCH /api/v1.0/files/{id}/toggle-public
        API->>FileService: togglePublic(id)
        FileService->>MongoDB: Update isPublic Flag
        MongoDB-->>FileService: Updated Document
        FileService-->>API: FileMetadataDTO
        API-->>FileCard: Updated File Info
        FileCard-->>Browser: Update UI (Show Link)
    
    else Delete File
        User->>FileCard: Click Delete
        FileCard->>Browser: Show Confirmation Dialog
        User->>Browser: Confirm Delete
        Browser->>API: DELETE /api/v1.0/files/{id}
        API->>FileService: deleteFile(id)
        FileService->>MongoDB: Verify Ownership
        FileService->>FileSystem: Delete Physical File
        FileService->>MongoDB: Delete Metadata
        API-->>FileCard: 204 No Content
        FileCard->>MyFiles: Refresh File List
        MyFiles-->>Browser: Update UI
    end
```

## 4. Public File Sharing Flow

```mermaid
sequenceDiagram
    actor Owner
    actor Recipient
    participant Browser1 as Owner Browser
    participant Browser2 as Recipient Browser
    participant FileCard
    participant PublicView as PublicFileView Page
    participant API as FileController
    participant FileService as FileMetadataService
    participant MongoDB
    participant FileSystem

    Owner->>Browser1: Toggle File to Public
    Browser1->>API: PATCH /api/v1.0/files/{id}/toggle-public
    API->>FileService: togglePublic(id)
    FileService->>MongoDB: Set isPublic = true
    MongoDB-->>FileService: Updated Document
    FileService-->>API: FileMetadataDTO
    API-->>Browser1: Updated File with Link
    Browser1->>FileCard: Display Share Link
    
    Owner->>Recipient: Share Link (file/{fileId})
    
    Recipient->>Browser2: Open Shared Link
    Browser2->>PublicView: Load Component
    PublicView->>API: GET /api/v1.0/files/public/{fileId}
    API->>FileService: getPublicFile(fileId)
    FileService->>MongoDB: findById(fileId)
    
    alt File is Public
        MongoDB-->>FileService: FileMetadata (isPublic=true)
        FileService-->>API: FileMetadataDTO
        API-->>PublicView: File Info (200 OK)
        PublicView-->>Browser2: Display File Details
        
        Recipient->>Browser2: Click Download
        Browser2->>API: GET /api/v1.0/files/download/{fileId}
        API->>FileService: getDownloadableFile(fileId)
        FileService->>FileSystem: Read File
        FileSystem-->>API: File Resource
        API-->>Browser2: File Download
        Browser2-->>Recipient: Save File
    
    else File is Private/Not Found
        FileService-->>API: Error: Unable to get file
        API-->>PublicView: 400 Bad Request
        PublicView-->>Browser2: Show Error Message
    end
```

## 5. Payment & Credits Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Subscription as Subscription Page
    participant API as PaymentController
    participant PaymentService
    participant Razorpay
    participant CreditService as UserCreditsService
    participant MongoDB

    User->>Browser: Navigate to Subscriptions
    Browser->>Subscription: Load Plans
    User->>Subscription: Select Plan (Premium/Ultimate)
    
    Subscription->>API: POST /api/v1.0/payments/create-order
    API->>PaymentService: createOrder(paymentDTO)
    PaymentService->>Razorpay: Create Order
    Razorpay-->>PaymentService: Order ID
    PaymentService->>MongoDB: Save Transaction (PENDING)
    MongoDB-->>PaymentService: Transaction Saved
    PaymentService-->>API: PaymentDTO (orderId)
    API-->>Subscription: Order Details
    
    Subscription->>Browser: Open Razorpay Checkout
    Browser->>Razorpay: Display Payment Form
    User->>Razorpay: Enter Payment Details
    Razorpay->>Razorpay: Process Payment
    
    alt Payment Success
        Razorpay-->>Browser: Payment Success (signature, paymentId)
        Browser->>Subscription: onPaymentSuccess()
        Subscription->>API: POST /api/v1.0/payments/verify-payment
        API->>PaymentService: verifyPayment(verificationDTO)
        PaymentService->>PaymentService: Verify HMAC Signature
        
        alt Signature Valid
            PaymentService->>CreditService: addCredits(clerkId, amount, plan)
            CreditService->>MongoDB: Update UserCredits
            MongoDB-->>CreditService: Updated Credits
            PaymentService->>MongoDB: Update Transaction (SUCCESS)
            PaymentService-->>API: PaymentDTO (success=true)
            API-->>Subscription: Credits Added
            Subscription-->>Browser: Show Success Message
            Browser->>API: GET /api/v1.0/users/credits
            API-->>Browser: Updated Credits
        
        else Signature Invalid
            PaymentService->>MongoDB: Update Transaction (FAILED)
            PaymentService-->>API: PaymentDTO (success=false)
            API-->>Subscription: Verification Failed
            Subscription-->>Browser: Show Error Message
        end
    
    else Payment Failed
        Razorpay-->>Browser: Payment Failed
        Browser->>Subscription: onPaymentFailure()
        Subscription->>API: Update Transaction Status
        API->>MongoDB: Update Transaction (FAILED)
        Subscription-->>Browser: Show Error Message
    end
```

## 6. User Credits Monitoring Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Context as UserCreditsContext
    participant Components as Dashboard/Upload/MyFiles
    participant API as UserCreditsController
    participant CreditService as UserCreditsService
    participant MongoDB

    User->>Browser: Login to Application
    Browser->>Context: Initialize UserCreditsContext
    Context->>API: GET /api/v1.0/users/credits
    API->>CreditService: getUserCredits()
    CreditService->>MongoDB: Find UserCredits by ClerkId
    
    alt User Credits Exist
        MongoDB-->>CreditService: UserCredits Document
    else First Time User
        CreditService->>MongoDB: Create Default Credits (10)
        MongoDB-->>CreditService: New UserCredits
    end
    
    CreditService-->>API: UserCreditsDTO
    API-->>Context: Credits Info
    Context-->>Components: Provide Credits via Context
    Components-->>Browser: Display Credits Badge
    
    loop On File Upload/Delete
        Components->>Context: fetchUserCredits()
        Context->>API: GET /api/v1.0/users/credits
        API->>CreditService: getUserCredits()
        CreditService->>MongoDB: Query Latest Credits
        MongoDB-->>CreditService: Updated Credits
        CreditService-->>API: UserCreditsDTO
        API-->>Context: Updated Credits
        Context-->>Components: Update UI
        Components-->>Browser: Refresh Credits Display
    end
```

## 7. Transaction History Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Transactions as Transactions Page
    participant API as TransactionController
    participant Repository as PaymentTransactionRepository
    participant MongoDB

    User->>Browser: Navigate to Transactions
    Browser->>Transactions: Load Component
    Transactions->>API: GET /api/v1.0/transactions
    API->>Repository: findByClerkId(clerkId)
    Repository->>MongoDB: Query Transactions
    MongoDB-->>Repository: List<PaymentTransaction>
    Repository-->>API: Transaction List
    API-->>Transactions: Transaction History
    Transactions-->>Browser: Display Table
    
    Note over Transactions,Browser: Shows: Date, Order ID, Amount,<br/>Plan, Status, Credits Added
```

## Architecture Overview

### Frontend (React + Vite)
- **Authentication**: Clerk React SDK
- **State Management**: React Context (UserCreditsContext)
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **UI**: Tailwind CSS + Lucide Icons

### Backend (Spring Boot)
- **Security**: JWT Authentication (Clerk)
- **Database**: MongoDB
- **Payment Gateway**: Razorpay
- **File Storage**: Local File System
- **API**: RESTful endpoints

### Key Components

#### Frontend Pages
- Landing - Marketing page
- Dashboard - File upload & recent files
- MyFiles - File management
- Upload - Dedicated upload page
- Subscription - Plan selection & payment
- Transactions - Payment history
- PublicFileView - Public file access

#### Backend Controllers
- FileController - File operations
- PaymentController - Payment processing
- UserCreditsController - Credits management
- TransactionController - Transaction history
- ClerkWebhookController - Clerk events

#### Backend Services
- FileMetadataService - File business logic
- PaymentService - Payment & verification
- UserCreditsService - Credits management
- ProfileService - User profile management

#### Security
- ClerkJwtAuthFilter - JWT validation
- ClerkJwksProvider - Key management
- SecurityConfig - Security configuration
