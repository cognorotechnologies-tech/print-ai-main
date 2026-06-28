# Requirements Document

## Introduction

PrintAI is an AI-powered print-on-demand platform that enables customers to create custom T-shirt designs using AI image generation, configure products, place orders with integrated payment processing, and have orders fulfilled by registered print vendors. The platform consists of three main interfaces: a customer-facing storefront, an admin panel for order and vendor management, and a vendor portal for order fulfillment.

## Glossary

- **Customer**: End user who creates designs and places orders for custom T-shirts
- **Admin**: Platform administrator who manages orders, vendors, catalog, and analytics
- **Vendor**: Registered print service provider who fulfills customer orders
- **Design_Generator**: AI-powered system that generates T-shirt designs from text prompts
- **Product_Configurator**: System that allows customization of fabric type, GSM, size, and color
- **Order_Manager**: System that handles order creation, routing, and status tracking
- **Payment_Gateway**: Razorpay integration for processing payments
- **Notification_Service**: Multi-channel notification system (WhatsApp, SMS, Email)
- **Mockup_Generator**: System that renders product previews with applied designs
- **Print_File_Generator**: System that creates print-ready PDF files for vendors
- **Auth_System**: NextAuth.js-based authentication supporting email/password, Google OAuth, and mobile OTP
- **Vendor_Router**: System that assigns orders to appropriate vendors based on availability and capacity
- **Pre_Prompt_Gallery**: Curated collection of example prompts to inspire customer designs
- **Cart_System**: Shopping cart for managing multiple items before checkout
- **Analytics_Dashboard**: Admin interface displaying platform metrics and insights

## Requirements

### Requirement 1: Customer Authentication

**User Story:** As a customer, I want to create an account and log in securely, so that I can save my designs and track my orders.

#### Acceptance Criteria

1. THE Auth_System SHALL support registration and login via email and password
2. THE Auth_System SHALL support Google OAuth authentication
3. THE Auth_System SHALL support mobile number authentication with OTP verification
4. WHEN a customer registers with an email, THE Auth_System SHALL send a verification email
5. WHEN a customer enters invalid credentials, THE Auth_System SHALL return a descriptive error message
6. THE Auth_System SHALL maintain secure session management across the platform

### Requirement 2: AI Design Generation

**User Story:** As a customer, I want to generate custom T-shirt designs using AI from text prompts, so that I can create unique products without design skills.

#### Acceptance Criteria

1. WHEN a customer submits a text prompt, THE Design_Generator SHALL generate an image using Stability AI SDXL or DALL-E 3
2. THE Design_Generator SHALL return the generated image within 30 seconds
3. WHEN generation fails, THE Design_Generator SHALL return a descriptive error message and allow retry
4. THE Design_Generator SHALL store generated images in Cloudinary
5. THE Design_Generator SHALL support multiple aspect ratios suitable for T-shirt printing
6. WHEN a customer provides an invalid or inappropriate prompt, THE Design_Generator SHALL reject the request with an explanation

### Requirement 3: Pre-Prompt Gallery

**User Story:** As a customer, I want to browse example prompts and designs, so that I can get inspiration for my own creations.

#### Acceptance Criteria

1. THE Pre_Prompt_Gallery SHALL display a curated collection of example prompts with preview images
2. WHEN a customer selects a pre-prompt, THE Design_Generator SHALL use it to generate a new design
3. THE Pre_Prompt_Gallery SHALL allow customers to modify selected prompts before generation
4. THE Pre_Prompt_Gallery SHALL categorize prompts by theme or style

### Requirement 4: Product Configuration

**User Story:** As a customer, I want to configure my T-shirt's fabric type, GSM, size, and color, so that I can customize the product to my preferences.

#### Acceptance Criteria

1. THE Product_Configurator SHALL provide selection options for fabric type (cotton, polyester, blend)
2. THE Product_Configurator SHALL provide GSM options (160, 180, 200, 220)
3. THE Product_Configurator SHALL provide size options (XS, S, M, L, XL, XXL, XXXL)
4. THE Product_Configurator SHALL provide color options for the base T-shirt
5. WHEN a customer changes any configuration option, THE Product_Configurator SHALL update the price accordingly
6. THE Product_Configurator SHALL validate that selected combinations are available

### Requirement 5: Mockup Preview

**User Story:** As a customer, I want to see a realistic preview of my design on the configured T-shirt, so that I can visualize the final product before ordering.

#### Acceptance Criteria

1. WHEN a customer applies a design to a product, THE Mockup_Generator SHALL render a realistic preview
2. THE Mockup_Generator SHALL reflect the selected T-shirt color in the preview
3. THE Mockup_Generator SHALL update the preview within 3 seconds when configuration changes
4. THE Mockup_Generator SHALL display the design in correct proportions and placement
5. THE Mockup_Generator SHALL support front and back placement views

### Requirement 6: Shopping Cart

**User Story:** As a customer, I want to add multiple items to my cart, so that I can order several products in a single transaction.

#### Acceptance Criteria

1. WHEN a customer adds a configured product, THE Cart_System SHALL store the item with all configuration details
2. THE Cart_System SHALL display the total price including all items
3. THE Cart_System SHALL allow customers to update quantities for cart items
4. THE Cart_System SHALL allow customers to remove items from the cart
5. THE Cart_System SHALL persist cart contents for authenticated customers across sessions
6. THE Cart_System SHALL validate product availability before checkout

### Requirement 7: Checkout and Payment

**User Story:** As a customer, I want to complete my purchase securely with multiple payment options, so that I can pay conveniently.

#### Acceptance Criteria

1. WHEN a customer initiates checkout, THE Order_Manager SHALL create a pending order with all cart items
2. THE Payment_Gateway SHALL integrate with Razorpay for payment processing
3. THE Payment_Gateway SHALL support UPI, credit/debit cards, net banking, and wallets
4. WHEN payment succeeds, THE Order_Manager SHALL confirm the order and update status to "Paid"
5. WHEN payment fails, THE Order_Manager SHALL retain the pending order and allow retry
6. THE Payment_Gateway SHALL handle payment callbacks securely with signature verification
7. WHEN an order is confirmed, THE Order_Manager SHALL clear the customer's cart

### Requirement 8: Order Confirmation and Notifications

**User Story:** As a customer, I want to receive immediate confirmation when I place an order, so that I know my purchase was successful.

#### Acceptance Criteria

1. WHEN an order is confirmed, THE Notification_Service SHALL send a confirmation email to the customer
2. WHEN an order is confirmed, THE Notification_Service SHALL send a WhatsApp message to the customer
3. WHEN an order is confirmed, THE Notification_Service SHALL send an SMS to the customer
4. THE Notification_Service SHALL include order details, estimated delivery date, and tracking information in notifications
5. WHEN a notification channel fails, THE Notification_Service SHALL log the failure and continue with other channels

### Requirement 9: Order Status Tracking

**User Story:** As a customer, I want to track my order status in real-time, so that I know when to expect delivery.

#### Acceptance Criteria

1. THE Order_Manager SHALL maintain order status (Pending, Paid, Assigned, In Production, Shipped, Delivered, Cancelled)
2. WHEN order status changes, THE Notification_Service SHALL notify the customer via all configured channels
3. THE Order_Manager SHALL display order history with current status for authenticated customers
4. THE Order_Manager SHALL provide estimated delivery dates based on vendor location and shipping method
5. THE Order_Manager SHALL allow customers to view detailed order information including design, configuration, and vendor details

### Requirement 10: Print File Generation

**User Story:** As a vendor, I want to download print-ready files for accepted orders, so that I can produce the products accurately.

#### Acceptance Criteria

1. WHEN an order is assigned to a vendor, THE Print_File_Generator SHALL create a print-ready PDF file
2. THE Print_File_Generator SHALL include the design at correct dimensions and resolution (minimum 300 DPI)
3. THE Print_File_Generator SHALL include product specifications (size, fabric, GSM, color)
4. THE Print_File_Generator SHALL include order details and customer information
5. FOR ALL valid designs, THE Print_File_Generator SHALL produce files that meet industry printing standards
6. THE Print_File_Generator SHALL use Puppeteer for PDF generation

### Requirement 11: Vendor Order Management

**User Story:** As a vendor, I want to view assigned orders and update their fulfillment status, so that I can manage my production workflow.

#### Acceptance Criteria

1. THE Order_Manager SHALL display all assigned orders in the vendor portal
2. THE Order_Manager SHALL allow vendors to accept or reject assigned orders within 24 hours
3. WHEN a vendor accepts an order, THE Order_Manager SHALL update status to "In Production"
4. THE Order_Manager SHALL allow vendors to update order status to "Shipped" with tracking information
5. THE Order_Manager SHALL allow vendors to mark orders as "Delivered"
6. WHEN a vendor rejects an order, THE Vendor_Router SHALL reassign it to another available vendor
7. THE Order_Manager SHALL display order details including design preview, specifications, and customer shipping address

### Requirement 12: Vendor Registration and Management

**User Story:** As an admin, I want to register and manage print vendors, so that I can ensure reliable order fulfillment.

#### Acceptance Criteria

1. THE Admin SHALL be able to register new vendors with business details, location, and capabilities
2. THE Admin SHALL be able to activate or deactivate vendor accounts
3. THE Admin SHALL be able to set vendor capacity limits for concurrent orders
4. THE Admin SHALL be able to view vendor performance metrics (acceptance rate, fulfillment time, quality ratings)
5. THE Admin SHALL be able to assign priority levels to vendors for order routing

### Requirement 13: Order Routing

**User Story:** As an admin, I want orders to be automatically assigned to appropriate vendors, so that fulfillment is efficient and reliable.

#### Acceptance Criteria

1. WHEN an order is confirmed, THE Vendor_Router SHALL assign it to an available vendor based on capacity and location
2. THE Vendor_Router SHALL prioritize vendors with higher priority levels
3. THE Vendor_Router SHALL consider vendor capacity limits when assigning orders
4. WHEN no vendors are available, THE Vendor_Router SHALL queue the order and notify the admin
5. THE Vendor_Router SHALL distribute orders evenly among vendors with equal priority

### Requirement 14: Admin Order Management

**User Story:** As an admin, I want to view and manage all orders across the platform, so that I can handle exceptions and ensure customer satisfaction.

#### Acceptance Criteria

1. THE Order_Manager SHALL display all orders with filtering by status, date, customer, and vendor
2. THE Admin SHALL be able to manually reassign orders to different vendors
3. THE Admin SHALL be able to cancel orders with refund processing
4. THE Admin SHALL be able to view detailed order information including payment status and notification history
5. THE Admin SHALL be able to override order status manually when needed

### Requirement 15: Product Catalog Management

**User Story:** As an admin, I want to manage the product catalog including fabrics, GSM options, sizes, and pricing, so that I can keep offerings current.

#### Acceptance Criteria

1. THE Admin SHALL be able to add, edit, and remove fabric types
2. THE Admin SHALL be able to add, edit, and remove GSM options
3. THE Admin SHALL be able to add, edit, and remove size options
4. THE Admin SHALL be able to set base prices and price modifiers for each configuration option
5. THE Admin SHALL be able to set product availability status
6. WHEN catalog changes are saved, THE Product_Configurator SHALL reflect updates immediately

### Requirement 16: Analytics Dashboard

**User Story:** As an admin, I want to view platform analytics and insights, so that I can make informed business decisions.

#### Acceptance Criteria

1. THE Analytics_Dashboard SHALL display total orders, revenue, and order status distribution
2. THE Analytics_Dashboard SHALL display vendor performance metrics
3. THE Analytics_Dashboard SHALL display popular design categories and prompts
4. THE Analytics_Dashboard SHALL display customer acquisition and retention metrics
5. THE Analytics_Dashboard SHALL allow filtering by date range
6. THE Analytics_Dashboard SHALL display conversion funnel metrics (visitors, designs created, orders placed)

### Requirement 17: Admin Authentication and Authorization

**User Story:** As an admin, I want secure access to the admin panel with role-based permissions, so that platform management is protected.

#### Acceptance Criteria

1. THE Auth_System SHALL support admin login with email and password
2. THE Auth_System SHALL enforce strong password requirements for admin accounts
3. THE Auth_System SHALL support role-based access control (Super Admin, Order Manager, Catalog Manager)
4. THE Auth_System SHALL log all admin actions for audit purposes
5. WHEN an unauthorized user attempts to access admin functions, THE Auth_System SHALL deny access and log the attempt

### Requirement 18: Vendor Authentication

**User Story:** As a vendor, I want secure access to the vendor portal, so that I can manage my assigned orders.

#### Acceptance Criteria

1. THE Auth_System SHALL support vendor login with email and password
2. THE Auth_System SHALL restrict vendor access to only their assigned orders
3. WHEN a vendor account is deactivated, THE Auth_System SHALL immediately revoke access
4. THE Auth_System SHALL maintain secure session management for vendor portal

### Requirement 19: File Storage and Management

**User Story:** As a platform operator, I want all generated designs and print files stored securely and accessibly, so that they can be retrieved when needed.

#### Acceptance Criteria

1. THE Platform SHALL store all generated design images in Cloudinary
2. THE Platform SHALL store all print-ready PDF files in Cloudinary
3. THE Platform SHALL organize files by order ID and customer ID
4. THE Platform SHALL generate secure, time-limited URLs for file access
5. THE Platform SHALL retain order files for at least 90 days after delivery
6. THE Platform SHALL implement automatic cleanup of expired files

### Requirement 20: Database Schema and Data Integrity

**User Story:** As a platform operator, I want a robust database schema with proper relationships and constraints, so that data integrity is maintained.

#### Acceptance Criteria

1. THE Platform SHALL use PostgreSQL with Prisma ORM for database management
2. THE Platform SHALL enforce referential integrity between related entities (orders, customers, vendors, products)
3. THE Platform SHALL use database transactions for critical operations (order creation, payment processing)
4. THE Platform SHALL implement proper indexing for query performance
5. THE Platform SHALL maintain audit trails for order status changes
6. THE Platform SHALL implement soft deletes for customer and vendor records

### Requirement 21: API Design and Documentation

**User Story:** As a developer, I want well-designed RESTful APIs with clear documentation, so that I can integrate and maintain the platform effectively.

#### Acceptance Criteria

1. THE Platform SHALL expose RESTful APIs for all core functionality
2. THE Platform SHALL use consistent API response formats with proper HTTP status codes
3. THE Platform SHALL implement API authentication using JWT tokens
4. THE Platform SHALL implement rate limiting to prevent abuse
5. THE Platform SHALL validate all API inputs and return descriptive error messages
6. THE Platform SHALL provide API documentation with request/response examples

### Requirement 22: Error Handling and Logging

**User Story:** As a platform operator, I want comprehensive error handling and logging, so that I can diagnose and resolve issues quickly.

#### Acceptance Criteria

1. WHEN an error occurs, THE Platform SHALL log the error with timestamp, context, and stack trace
2. THE Platform SHALL categorize errors by severity (info, warning, error, critical)
3. WHEN a critical error occurs, THE Platform SHALL notify administrators immediately
4. THE Platform SHALL return user-friendly error messages without exposing sensitive system details
5. THE Platform SHALL log all payment transactions for reconciliation and debugging
6. THE Platform SHALL implement structured logging for easy searching and filtering

### Requirement 23: Performance and Scalability

**User Story:** As a platform operator, I want the system to handle growing traffic and order volumes efficiently, so that customer experience remains excellent.

#### Acceptance Criteria

1. THE Platform SHALL respond to API requests within 500ms for 95% of requests under normal load
2. THE Design_Generator SHALL handle concurrent design generation requests efficiently
3. THE Platform SHALL implement caching for frequently accessed data (product catalog, pre-prompts)
4. THE Platform SHALL use connection pooling for database access
5. THE Mockup_Generator SHALL optimize image processing to minimize memory usage
6. THE Platform SHALL support horizontal scaling of backend services

### Requirement 24: Security and Data Protection

**User Story:** As a customer, I want my personal information and payment details protected, so that I can use the platform safely.

#### Acceptance Criteria

1. THE Platform SHALL encrypt all sensitive data at rest and in transit
2. THE Platform SHALL comply with PCI DSS requirements for payment processing
3. THE Platform SHALL implement CSRF protection for all state-changing operations
4. THE Platform SHALL sanitize all user inputs to prevent injection attacks
5. THE Platform SHALL implement secure password hashing using bcrypt or similar
6. THE Platform SHALL not store raw payment card details
7. THE Platform SHALL implement proper CORS policies for API access

### Requirement 25: Notification Reliability

**User Story:** As a customer, I want to receive timely notifications about my orders, so that I stay informed throughout the fulfillment process.

#### Acceptance Criteria

1. THE Notification_Service SHALL integrate with Wati or Interakt for WhatsApp notifications
2. THE Notification_Service SHALL integrate with SendGrid for email notifications
3. THE Notification_Service SHALL integrate with MSG91 for SMS notifications
4. WHEN a notification fails, THE Notification_Service SHALL retry up to 3 times with exponential backoff
5. THE Notification_Service SHALL queue notifications for asynchronous processing
6. THE Notification_Service SHALL log all notification attempts with delivery status
7. THE Admin SHALL be able to view notification history for any order

### Requirement 26: Responsive Design

**User Story:** As a customer, I want to use the platform on any device, so that I can create and order designs from my phone, tablet, or computer.

#### Acceptance Criteria

1. THE Platform SHALL provide a responsive user interface that adapts to screen sizes from 320px to 4K displays
2. THE Platform SHALL optimize touch interactions for mobile devices
3. THE Platform SHALL maintain full functionality across desktop, tablet, and mobile viewports
4. THE Design_Generator interface SHALL be usable on mobile devices
5. THE Product_Configurator SHALL provide an intuitive mobile experience

### Requirement 27: Design Parsing and Printing

**User Story:** As a vendor, I want print files that accurately represent customer designs, so that I can produce high-quality products.

#### Acceptance Criteria

1. THE Print_File_Generator SHALL parse design images and embed them at 300 DPI minimum
2. THE Print_File_Generator SHALL convert designs to CMYK color space for printing
3. THE Print_File_Generator SHALL include bleed areas and crop marks in print files
4. THE Print_File_Generator SHALL validate design dimensions against product specifications
5. FOR ALL valid design images, parsing then printing specifications then parsing SHALL produce equivalent print instructions (round-trip property)
6. WHEN a design does not meet print quality requirements, THE Print_File_Generator SHALL notify the admin and flag the order

