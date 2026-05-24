# Turf Booking System

A complete, fully functioning Turf Booking System with a production-grade UI/UX frontend and a Java Spring Boot backend.

## Tech Stack
- **Frontend**: React (Vite), TailwindCSS, Framer Motion, Axios, Zustand, React Query
- **Backend**: Java Spring Boot 3, PostgreSQL, Spring Security, JWT
- **Deployment**: Docker, Docker Compose

## Prerequisites
- Docker and Docker Compose
- Java 17 (for local backend development)
- Node.js 20+ (for local frontend development)

## Running with Docker Compose
The easiest way to run the entire application is using Docker Compose.

```bash
cd /e/Turfiez
docker-compose up --build
```

- Frontend will be available at `http://localhost:5173`
- Backend API will be available at `http://localhost:8080/api`
- Swagger UI will be available at `http://localhost:8080/swagger-ui.html`

## Running Locally (Without Docker)

### Backend
1. Start a PostgreSQL instance.
2. Update `turf-booking-backend/src/main/resources/application.yml` with your DB credentials.
3. Run the Spring Boot application:
```bash
cd turf-booking-backend
mvn spring-boot:run
```

### Frontend
1. Install dependencies:
```bash
cd turf-booking-frontend
npm install
```
2. Create a `.env` file based on `.env.example`.
3. Start the Vite dev server:
```bash
npm run dev
```
