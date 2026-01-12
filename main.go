package main

import (
	"log"
	"os"

	"escort/database"
	"escort/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Connect to the database
	database.ConnectDB()

	// Create Gin router - minimal setup
	router := gin.New()
	router.Use(gin.Logger())   // Optional: request logging
	router.Use(gin.Recovery()) // Optional: panic recovery

	//CORS middleware - essntial for frontend-backend communication

	// Setup all routes
	setupRoutes(router)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 API Server starting on http://localhost:%s", port)
	log.Printf("📝 API Endpoints:")
	log.Printf("   POST   http://localhost:%s/auth/register", port)
	log.Printf("   POST   http://localhost:%s/auth/login", port)
	log.Printf("   PUT    http://localhost:%s/admin/approve/:id", port)
	log.Printf("   DELETE http://localhost:%s/admin/delete/:id", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func setupRoutes(router *gin.Engine) {
	// Simple health check
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service": "Escort API",
			"status":  "running",
			"version": "1.0",
		})
	})

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	// Setup your existing routes
	routes.AuthRoutes(router)
	routes.AdminRoutes(router)

	// If you have profile routes, add them:
	// routes.ProfileRoutes(router)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		allowedOrigins := []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"http://127.0.0.1:3000",
		}

		origin := c.Request.Header.Get("Origin")

		// Check if the origin is in the allowed list
		allowed := false
		for _, o := range allowedOrigins {
			if o == origin {
				allowed = true
				break
			}
			// For production, you might want to check against your actual domain
			if origin != "" && allowed {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				// For development, you can allow all origins (not recommended for production)
				c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
			}

			// Required headers
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

			// Handle preflight requests
			if c.Request.Method == "OPTIONS" {
				c.AbortWithStatus(204)
				return
			}

			c.Next()
		}
	}
}
