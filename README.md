# 🛍️ ShopSphere
## A Modern Full-Stack E-Commerce Platform

**Built with React, TypeScript, Node.js, Express & PostgreSQL**

A modern, responsive online shopping platform featuring product discovery, user authentication, shopping cart management, demo checkout, order tracking, and an admin dashboard.

**Developed as a B.Tech CSE Project**

---

## 📌 About the Project

ShopSphere is a full-stack e-commerce web application designed to provide a seamless online shopping experience. It demonstrates how a modern shopping platform can be built using frontend technologies, a REST API, and a relational database.

Users can explore products, search and filter the catalogue, manage their shopping cart, create an account, place demo orders, and view their order history. Administrators can manage products and review orders through a protected dashboard.

**Project Goal:** To develop a responsive, database-driven e-commerce application while applying practical full-stack development, authentication, validation, and deployment concepts.

> **Demo Mode:** This project does not process real payments or collect payment card details.

---

## ✨ Key Features

### 🛒 Product Discovery
- Responsive homepage with featured products and categories.
- Product catalogue and individual product details.
- Product search and category filtering.
- Price range filtering and sorting options.
- Pagination for product listings.

### 🛍️ Shopping Cart
- Add products to the cart.
- Update product quantities and remove items.
- Automatic subtotal, shipping, and total calculations.
- Cart persistence using browser local storage.
- Stock-aware quantity validation.

### 👤 Authentication
- User registration and login.
- Logout and session restoration.
- Protected account and order pages.
- JWT-based authentication.
- Password hashing.

### 📦 Checkout and Orders
- Shipping information form.
- Frontend and backend input validation.
- Demo checkout without real payments.
- Server-side price and stock validation.
- Order confirmation page.
- Personal order history.

### 🛡️ Admin Dashboard
- Dashboard statistics.
- Create, update, and delete products.
- View customer orders.
- Role-based administrative access.
- Server-side authorization.

### 📱 User Experience
- Responsive desktop and mobile layouts.
- Loading indicators and error messages.
- Toast notifications.
- Empty states and form validation.
- Accessible navigation and focus styles.

---

## 🖼️ Project Screenshots

### Home Page

![ShopSphere Home Page](docs/screenshots/home.png)

### Product Catalogue

![ShopSphere Products Page](docs/screenshots/products.png)

### Mobile View

![ShopSphere Mobile View](docs/screenshots/mobile.png)

---

## 🧰 Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Database Hosting | Supabase |
| Authentication | JSON Web Tokens (JWT) |
| Password Hashing | bcryptjs |
| Input Validation | Zod |
| Security | Helmet, express-rate-limit |
| Database Driver | pg |
| Testing | Vitest, Testing Library, Node.js Test Runner |
| Deployment | Render, Vercel |

---

## 🏗️ System Architecture

ShopSphere follows a client-server architecture.

```text
                 USER / ADMIN
                      |
                      v
             REACT FRONTEND
          React + TypeScript + Vite
                      |
                REST API Requests
                      |
                      v
              EXPRESS BACKEND
          Authentication & Validation
                      |
                      v
              BUSINESS LOGIC
           Products, Cart & Orders
                      |
                      v
             POSTGRESQL DATABASE
                   SUPABASE
```

### How It Works

1. Users interact with the React frontend.
2. The frontend sends requests to the Express REST API.
3. The backend validates requests and checks authentication.
4. Controllers execute the required business logic.
5. PostgreSQL stores and retrieves application data.
6. The API returns JSON responses to the frontend.

---

## 📂 Project Structure

```text
ShopSphere/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       ├── services/
│       ├── utils/
│       └── __tests__/
│
├── server/
│   ├── scripts/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── validators/
│   └── tests/
│
├── docs/
│   └── screenshots/
│
├── e2e/
├── render.yaml
├── package.json
└── README.md
```

---

## 🗄️ Database Design

ShopSphere uses PostgreSQL with five core entities.

| Table | Purpose |
|---|---|
| `users` | User accounts, password hashes, and roles |
| `categories` | Product categories |
| `products` | Product information, prices, discounts, and stock |
| `orders` | Customer orders and shipping details |
| `order_items` | Products and quantities associated with orders |

### Database Relationships

- One user can place multiple orders.
- One order can contain multiple order items.
- Each order item references a product.
- One category can contain multiple products.

Foreign keys and database constraints help maintain data integrity.

---

## 🔌 REST API Endpoints

**Base Path:** `/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | API health check |
| `POST` | `/api/auth/register` | Register a user |
| `POST` | `/api/auth/login` | Log in |
| `GET` | `/api/auth/me` | Get the current user |
| `GET` | `/api/categories` | Get categories |
| `GET` | `/api/products` | List and filter products |
| `GET` | `/api/products/:id` | Get product details |
| `POST` | `/api/orders` | Place a demo order |
| `GET` | `/api/orders/mine` | Get personal order history |
| `GET` | `/api/orders/mine/:id` | Get an individual order |
| `GET` | `/api/admin/stats` | Get admin statistics |
| `GET` | `/api/admin/orders` | View all orders |
| `POST` | `/api/admin/products` | Create a product |
| `PATCH` | `/api/admin/products/:id` | Update a product |
| `DELETE` | `/api/admin/products/:id` | Delete a product |

Protected endpoints require authentication. Admin endpoints additionally require administrative authorization.

---

## 🚀 Getting Started

Follow these steps to run ShopSphere locally.

### Prerequisites

- Node.js 20 or newer recommended.
- npm.
- Git.
- PostgreSQL or a Supabase project.

### Step 1: Clone the Repository

```bash
git clone https://github.com/pushprajkumar640-lang/ShopSphere.git
cd ShopSphere
```

### Step 2: Install Dependencies

```bash
npm run install:all
```

### Step 3: Configure Environment Variables

Create `server/.env` using `server/.env.example` as the template.

Configure the required database connection, JWT secret, and other server settings.

For Supabase, configure the database connection and enable the appropriate SSL setting.

For local frontend development, the `VITE_API_URL` value can remain empty because Vite proxies `/api` requests to the local backend.

**Important:** Never commit `.env` files, database passwords, or JWT secrets to GitHub.

### Step 4: Run Database Migrations

```bash
npm run db:migrate
```

### Step 5: Seed Sample Data

```bash
npm run db:seed
```

The seed script inserts sample catalogue data and prepares the demo administrator account using the server's environment configuration.

### Step 6: Start the Backend

Open a terminal in the project root:

```bash
npm run dev:server
```

Backend URL:

`http://localhost:4000`

### Step 7: Start the Frontend

Open another terminal in the project root:

```bash
npm run dev:client
```

Open the URL shown in the terminal, usually:

`http://localhost:5173`

If the default port is occupied, Vite may choose another port, such as `5174`.

---

## ⚙️ Environment Variables

Configure these variables in `server/.env` and your backend hosting dashboard.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DATABASE_SSL` | Database SSL configuration |
| `JWT_SECRET` | Secret for signing authentication tokens |
| `JWT_EXPIRES_IN` | Token expiry duration |
| `CLIENT_ORIGIN` | Allowed frontend origin for CORS |
| `PORT` | Backend server port |
| `NODE_ENV` | Application environment |
| `ADMIN_EMAIL` | Administrator email for seeding |
| `ADMIN_PASSWORD` | Administrator password for seeding |

For a separately hosted frontend, configure `VITE_API_URL` to the deployed backend API URL ending in `/api`.

Example:

```env
VITE_API_URL=https://your-api.onrender.com/api
```

Replace the example URL with your actual backend URL.

Never expose database credentials or JWT secrets in frontend environment variables.

---

## 🧪 Build and Testing

### Build the Frontend

```bash
npm run build
```

### Run Frontend Tests

```bash
npm test --prefix client
```

### Run Backend Tests

```bash
npm test --prefix server
```

The end-to-end testing suite is located in the `e2e/` directory and requires the documented runtime prerequisites.

---

## ☁️ Deployment Guide

### Backend Deployment — Render

1. Push the project to GitHub.
2. Open Render and choose **New → Blueprint**.
3. Select the repository containing `render.yaml`.
4. Review the build and start configuration.
5. Configure the required environment variables.
6. Connect the Supabase PostgreSQL database.
7. Deploy the backend and review its logs.
8. Test the API health endpoint.

### Frontend Deployment — Vercel

1. Import the ShopSphere repository into Vercel.
2. Set the root directory to `client`.
3. Select Vite as the frontend framework.
4. Set the build command to `npm run build`.
5. Set the output directory to `dist`.
6. Configure `VITE_API_URL` with the actual Render API URL ending in `/api`.
7. Deploy the frontend.
8. Set `CLIENT_ORIGIN` on Render to the exact Vercel frontend origin.
9. Redeploy the backend if its environment configuration changes.

Always verify the actual commands and configuration in `render.yaml` and the hosting dashboards before deployment.

---

## 🔐 Security Considerations

- Passwords should be stored as secure hashes, never as plain text.
- JWT authentication protects user-specific operations.
- Administrative access is checked on the server.
- SQL queries use parameterised statements.
- Product prices, order totals, and stock are validated by the backend.
- Authentication endpoints use rate limiting.
- Demo checkout does not process real payments.
- Production secrets must remain private.
- Rotate credentials if they have been exposed.

---

## 🚧 Future Improvements

- Product image uploads using Supabase Storage or Cloudinary.
- Payment gateway integration for a future production version.
- Password reset and refresh-token functionality.
- Improved automated testing and monitoring.
- More advanced inventory and order-management features.

---

## 🎯 Learning Outcomes

This project demonstrates practical skills in:

- React and TypeScript frontend development.
- Node.js and Express REST API development.
- PostgreSQL database integration.
- Authentication and role-based access control.
- Shopping cart and order processing.
- Input validation and security practices.
- Testing and cloud deployment.

---

## 📄 License

Created for academic and learning purposes. Add a formal license before redistributing the project publicly.

---

<div align="center">

### ShopSphere
**Full-Stack E-Commerce Platform**

Built with ❤️ for learning and demonstrating modern web development.

</div>
