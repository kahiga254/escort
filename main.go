package main

import (
	"log"
	"os"
	"regexp"
	"strings"

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

	// Create Gin router
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS middleware - PRODUCTION READY
	router.Use(CORSMiddleware())

	// Serve static files
	router.Static("/uploads", "./uploads")

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

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func setupRoutes(router *gin.Engine) {
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
}

// PRODUCTION CORS Middleware
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get allowed origins from environment variable or use defaults
		allowedOriginsStr := os.Getenv("ALLOWED_ORIGINS")
		var allowedOrigins []string

		if allowedOriginsStr == "" {
			// Default origins for development
			allowedOrigins = []string{
				"http://localhost:3000",
				"http://localhost:3001",
				"http://127.0.0.1:3000",
				"http://127.0.0.1:3001",
			}
		} else {
			// Split comma-separated origins from environment variable
			allowedOrigins = strings.Split(allowedOriginsStr, ",")
		}

		// Add your production domains to the list
		productionDomains := []string{
			"https://escort-crr9.vercel.app",
			"https://escort-*-kahiga254s-projects.vercel.app", // Wildcard for all Vercel previews
			"https://escort-git-master-kahiga254s-projects.vercel.app",
			"https://escort-2smjynczz-kahiga254s-projects.vercel.app",
			"https://escort.vercel.app",        // If you set up a custom domain
			"https://escort-vcix.onrender.com", // Your backend
		}

		// Combine default/production domains
		allAllowedOrigins := append(allowedOrigins, productionDomains...)

		origin := c.Request.Header.Get("Origin")

		// Check if origin is in allowed list
		allowed := false
		for _, allowedOrigin := range allAllowedOrigins {
			// Support wildcard subdomains
			if strings.Contains(allowedOrigin, "*") {
				pattern := strings.ReplaceAll(allowedOrigin, "*", ".*")
				if matched, _ := regexp.MatchString(pattern, origin); matched {
					allowed = true
					break
				}
			} else if allowedOrigin == origin {
				allowed = true
				break
			}
		}

		// Set CORS headers
		if allowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else if origin != "" {
			// Log unauthorized origin attempts (for security monitoring)
			log.Printf("CORS: Blocked origin: %s", origin)
		}

		// Always set these headers
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, Accept, Origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400") // 24 hours cache for preflight

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// Add regexp import at top if using wildcard pattern
// import "regexp"
