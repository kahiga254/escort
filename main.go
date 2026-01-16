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
	router.Use(CORSMiddleware())
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

	// 🔥 ADD OPTIONS HANDLERS FOR CORS PREFLIGHT 🔥
	router.OPTIONS("/users", handleOptions)
	router.OPTIONS("/search", handleOptions)
	router.OPTIONS("/location/:location", handleOptions)
	router.OPTIONS("/auth/login", handleOptions)
	router.OPTIONS("/auth/register", handleOptions)
	router.OPTIONS("/admin/approve/:id", handleOptions)
	router.OPTIONS("/admin/delete/:id", handleOptions)

	// Setup your existing routes
	routes.AuthRoutes(router)
	routes.AdminRoutes(router)
}

// Handler for OPTIONS requests
func handleOptions(c *gin.Context) {
	log.Printf("OPTIONS preflight request for: %s", c.Request.URL.Path)

	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
	c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, X-Requested-With")
	c.Status(204) // No Content
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("CORS Middleware: Request from Origin: %s", c.Request.Header.Get("Origin"))

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
		}

		// Set the appropriate origin header
		if origin != "" && allowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			// For development, you can allow all origins
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}

		// Required headers - ALWAYS SET THESE
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			log.Printf("CORS: Handling OPTIONS preflight request")
			c.AbortWithStatus(204)
			return
		}

		log.Printf("CORS Headers Set: %v", c.Writer.Header())
		c.Next()
	}
}
