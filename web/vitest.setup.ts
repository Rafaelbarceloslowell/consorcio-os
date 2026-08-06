import "@testing-library/jest-dom/vitest"

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://gorillaos_test:gorillaos_test@127.0.0.1:65535/gorillaos_test"
}
