// middleware/auth_middleware.go
package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Println("🔐 RequireAdmin middleware called")

		// Get token from header
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			fmt.Println("❌ No Authorization header")
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Authorization header required",
			})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix
		tokenString = strings.TrimPrefix(tokenString, "Bearer ")
		fmt.Printf("   Token: %s...\n", tokenString[:min(20, len(tokenString))])

		// Parse token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Check signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("invalid signing method")
			}
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil {
			fmt.Printf("❌ Token parse error: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Invalid token: " + err.Error(),
			})
			c.Abort()
			return
		}

		// Check if token is valid and user is admin
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			userID := claims["user_id"].(string)
			role := claims["role"].(string)

			fmt.Printf("   UserID: %s, Role: %s\n", userID, role)

			if role == "admin" {
				fmt.Println("✅ Admin access granted")
				c.Set("userID", userID)
				c.Set("userRole", role)
				c.Next()
				return
			} else {
				fmt.Printf("❌ Access denied - Not admin (role: %s)\n", role)
				c.JSON(http.StatusForbidden, gin.H{
					"success": false,
					"error":   "Admin access required",
				})
				c.Abort()
				return
			}
		}

		fmt.Println("❌ Invalid token claims")
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid token claims",
		})
		c.Abort()
	}
}

func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Println("🔐 RequireAuth middleware called")

		// Get token from header
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			fmt.Println("❌ No Authorization header")
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Authorization header required",
			})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix
		tokenString = strings.TrimPrefix(tokenString, "Bearer ")

		// Parse token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Check signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("invalid signing method")
			}
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil {
			fmt.Printf("❌ Token parse error: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "Invalid token: " + err.Error(),
			})
			c.Abort()
			return
		}

		// Check if token is valid
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			userID := claims["user_id"].(string)
			role := claims["role"].(string)

			fmt.Printf("✅ Authenticated - UserID: %s, Role: %s\n", userID, role)

			// Set user info in context for use in controllers
			c.Set("userID", userID)
			c.Set("userRole", role)
			c.Next()
			return
		}

		fmt.Println("❌ Invalid token claims")
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid token claims",
		})
		c.Abort()
	}
}
