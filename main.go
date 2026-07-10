package main

import (
	"log"
	"os"

	"escort/controllers"
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

	// Get MongoDB database instance
	db := database.GetDB()

	// Create Gin router
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS middleware
	router.Use(CORSMiddleware())

	// Serve static files
	router.Static("/uploads", "./uploads")

	// Initialize subscription controller
	subscriptionController := controllers.NewSubscriptionController(db)

	// Initialize blog controller
	controllers.InitBlogCollection(database.GetClient())

	// Setup all routes
	setupRoutes(router, subscriptionController)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 API Server starting on http://localhost:%s", port)
	log.Printf("📝 API Endpoints:")
	log.Printf("   POST   http://localhost:%s/auth/register", port)
	log.Printf("   POST   http://localhost:%s/auth/login", port)
	log.Printf("   POST   http://localhost:%s/api/subscribe", port)
	log.Printf("   GET    http://localhost:%s/api/blogs", port)
	log.Printf("   POST   http://localhost:%s/api/blogs", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func setupRoutes(router *gin.Engine, subscriptionController *controllers.SubscriptionController) {
	// Health check
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

	// Setup routes
	routes.AuthRoutes(router)
	routes.AdminRoutes(router)
	routes.SubscriptionRoutes(router, subscriptionController)
	routes.BlogRoutes(router) // Add blog routes
	routes.TelegramRoutes(router)
}


// PRODUCTION CORS Middleware
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Allow both www and non-www versions (browser requests)
		if origin == "https://escorthub254.com" || origin == "https://www.escorthub254.com" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}

		// Allow server-to-server requests (from bot/backend)
		// These requests don't have an Origin header
		if origin == "" {
			// Allow telegram bot requests
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, Accept, Origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
