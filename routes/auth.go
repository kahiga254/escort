package routes

import (
	"context"
	"escort/controllers"
	"escort/database"
	"escort/middleware"
	"escort/models"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func AuthRoutes(route *gin.Engine) {

	// Public routes (no authentication required)

	// GET /users
	route.GET("/users", controllers.GetAllActiveUsers)

	// GET /search?q=nairobi
	route.GET("/search", controllers.SearchUsers)

	// GET /location/nairobi
	route.GET("location/:location", controllers.GetUsersByLocation)

	//Get Subscription Plans
	route.GET("/subscription/plans", controllers.GetSubscriptionPlans)

	//MPESA CALLBACK Webhook
	route.POST("/mpesa/callback", controllers.MpesaCallback)

	auth := route.Group("/auth")

	{
		auth.POST("/login", controllers.LoginUser)
		auth.POST("/register", controllers.RegisterUser)

		auth.GET("/debug/subscriptions", func(c *gin.Context) {
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			// Get all subscriptions
			cursor, err := database.SubscriptionCollection.Find(ctx, bson.M{})
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to query: " + err.Error()})
				return
			}
			defer cursor.Close(ctx)

			var results []map[string]interface{}
			for cursor.Next(ctx) {
				var sub map[string]interface{}
				if err := cursor.Decode(&sub); err != nil {
					continue
				}
				results = append(results, sub)
			}

			c.JSON(200, gin.H{
				"count":         len(results),
				"subscriptions": results,
			})
		})

		// ====== SUBSCRIPTION ROUTES ======
		protected := auth.Group("").Use(middleware.RequireAuth())
		// 1. subscribe - Initiate MPESA payment
		protected.POST("/subscribe", controllers.Subscribe)

		//2. Check User's subscription status
		protected.GET("/subscription/check-status", controllers.CheckSubscriptionStatus)

		//3. Check user's current subscription status
		protected.GET("/subscription/status", controllers.GetUserSubscriptionStatus)

		// Add to routes/auth.go
		protected.GET("/me", func(c *gin.Context) {
			userID, exists := c.Get("userID")
			if !exists {
				c.JSON(401, gin.H{"error": "Not authenticated"})
				return
			}

			userObjID, _ := primitive.ObjectIDFromHex(userID.(string))

			var user models.User
			err := database.UserCollection.FindOne(context.Background(),
				bson.M{"_id": userObjID}).Decode(&user)

			if err != nil {
				c.JSON(404, gin.H{"error": "User not found"})
				return
			}

			// Remove sensitive data
			user.Password = ""

			c.JSON(200, gin.H{
				"success": true,
				"user":    user,
			})
		})

		// In your routes/auth.go file, update the update-profile route:
		protected.PUT("/update-profile", func(c *gin.Context) {
			userID, _ := c.Get("userID")
			userObjID, _ := primitive.ObjectIDFromHex(userID.(string))

			type UpdateProfileRequest struct {
				FirstName         string   `json:"first_name"`
				LastName          string   `json:"last_name"`
				PhoneNo           string   `json:"phone_no"`
				Location          string   `json:"location"`
				Gender            string   `json:"gender"`
				SexualOrientation string   `json:"sexual_orientation"`
				Age               int      `json:"age"`
				Nationality       string   `json:"nationality"`
				Services          []string `json:"services"`
			}

			var updateData UpdateProfileRequest
			if err := c.ShouldBindJSON(&updateData); err != nil {
				c.JSON(400, gin.H{
					"success": false,
					"error":   "Invalid request data: " + err.Error(),
				})
				return
			}

			// Validate required fields
			if updateData.FirstName == "" || updateData.LastName == "" {
				c.JSON(400, gin.H{
					"success": false,
					"error":   "First name and last name are required",
				})
				return
			}

			// Build update document
			updateDoc := bson.M{
				"first_name":         updateData.FirstName,
				"last_name":          updateData.LastName,
				"phone_no":           updateData.PhoneNo,
				"location":           updateData.Location,
				"gender":             updateData.Gender,
				"sexual_orientation": updateData.SexualOrientation,
				"age":                updateData.Age,
				"nationality":        updateData.Nationality,
				"services":           updateData.Services,
				"updated_at":         time.Now(),
			}

			// Remove empty fields to avoid overwriting with empty values
			cleanUpdateDoc := bson.M{}
			for key, value := range updateDoc {
				if value != "" && value != 0 {
					cleanUpdateDoc[key] = value
				}
			}

			_, err := database.UserCollection.UpdateOne(
				context.Background(),
				bson.M{"_id": userObjID},
				bson.M{"$set": cleanUpdateDoc},
			)

			if err != nil {
				c.JSON(500, gin.H{
					"success": false,
					"error":   "Failed to update profile: " + err.Error(),
				})
				return
			}

			// Fetch updated user
			var updatedUser models.User
			err = database.UserCollection.FindOne(context.Background(),
				bson.M{"_id": userObjID}).Decode(&updatedUser)

			if err != nil {
				c.JSON(500, gin.H{
					"success": false,
					"error":   "Profile updated but failed to fetch updated data",
				})
				return
			}

			// Remove sensitive data
			updatedUser.Password = ""

			c.JSON(200, gin.H{
				"success": true,
				"message": "Profile updated successfully",
				"user":    updatedUser,
			})
		})

		// Add this route in your AuthRoutes function, inside the protected group:

		protected.POST("/upload-images", func(c *gin.Context) {
			userID, exists := c.Get("userID")
			if !exists {
				c.JSON(401, gin.H{"error": "Not authenticated"})
				return
			}

			// Parse multipart form
			err := c.Request.ParseMultipartForm(50 << 20) // 50MB max for multiple files
			if err != nil {
				c.JSON(400, gin.H{"error": "Failed to parse form: " + err.Error()})
				return
			}

			// Get files from form
			form, err := c.MultipartForm()
			if err != nil {
				c.JSON(400, gin.H{"error": "Failed to get multipart form: " + err.Error()})
				return
			}

			files := form.File["images"]
			if len(files) == 0 {
				c.JSON(400, gin.H{"error": "No images provided"})
				return
			}

			// Limit to 5 files per upload
			if len(files) > 5 {
				files = files[:5]
			}

			userObjID, _ := primitive.ObjectIDFromHex(userID.(string))

			// First, get current user to check existing images
			var existingUser map[string]interface{}
			err = database.UserCollection.FindOne(context.Background(), bson.M{"_id": userObjID}).Decode(&existingUser)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to fetch user: " + err.Error()})
				return
			}

			// Get existing images - handle both images array and image_url field
			var existingImages []string

			// Check if images array exists
			if imagesInterface, ok := existingUser["images"]; ok && imagesInterface != nil {
				if imagesArray, ok := imagesInterface.(primitive.A); ok {
					for _, img := range imagesArray {
						if str, ok := img.(string); ok && str != "" {
							existingImages = append(existingImages, str)
						}
					}
				}
			}

			// If no images array but has image_url, use that
			if len(existingImages) == 0 {
				if imageURL, ok := existingUser["image_url"].(string); ok && imageURL != "" {
					existingImages = append(existingImages, imageURL)
				}
			}

			// Check if adding new files would exceed 5 total
			if len(existingImages)+len(files) > 5 {
				c.JSON(400, gin.H{
					"error": fmt.Sprintf("Maximum 5 photos allowed. You have %d photos, trying to add %d more",
						len(existingImages), len(files)),
				})
				return
			}

			var uploadedImageUrls []string

			// Ensure uploads directory exists
			if err := os.MkdirAll("./uploads", 0755); err != nil {
				c.JSON(500, gin.H{"error": "Failed to create uploads directory: " + err.Error()})
				return
			}

			// Helper function to sanitize filenames
			sanitizeFilename := func(filename string) string {
				// Remove path traversal attempts
				filename = filepath.Base(filename)
				// Replace spaces with underscores
				filename = strings.ReplaceAll(filename, " ", "_")
				// Remove any non-alphanumeric characters except . _ -
				reg := regexp.MustCompile(`[^a-zA-Z0-9._-]`)
				filename = reg.ReplaceAllString(filename, "")
				return filename
			}

			for _, file := range files {
				// Create unique filename with timestamp
				timestamp := time.Now().UnixNano()
				extension := filepath.Ext(file.Filename)
				safeFilename := sanitizeFilename(strings.TrimSuffix(file.Filename, extension))
				filename := fmt.Sprintf("%s_%d_%s%s", userID.(string), timestamp, safeFilename, extension)

				// Save file to local directory
				uploadPath := "./uploads/" + filename
				if err := c.SaveUploadedFile(file, uploadPath); err != nil {
					c.JSON(500, gin.H{"error": "Failed to save file: " + err.Error()})
					return
				}

				// For local development, use a local URL
				imageUrl := fmt.Sprintf("http://localhost:8080/uploads/%s", filename)
				uploadedImageUrls = append(uploadedImageUrls, imageUrl)
			}

			// Combine existing images with new ones
			allImages := append(existingImages, uploadedImageUrls...)

			// Update user with all images (and set first as main image_url for backward compatibility)
			updateData := bson.M{
				"images":     allImages,
				"image_url":  allImages[0], // First image as main for backward compatibility
				"updated_at": time.Now(),
			}

			_, err = database.UserCollection.UpdateOne(
				context.Background(),
				bson.M{"_id": userObjID},
				bson.M{"$set": updateData},
			)

			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to update user: " + err.Error()})
				return
			}

			c.JSON(200, gin.H{
				"success":     true,
				"message":     "Images uploaded successfully",
				"imageUrls":   uploadedImageUrls,
				"totalImages": len(allImages),
				"maxAllowed":  5,
			})
		})

		// Add this DELETE endpoint to your protected routes
		protected.DELETE("/delete-image", func(c *gin.Context) {
			fmt.Printf("DELETE /auth/delete-image route hit!")
			userID, exists := c.Get("userID")
			if !exists {
				c.JSON(401, gin.H{"error": "Not authenticated"})
				return
			}

			var request struct {
				ImageURL string `json:"imageUrl"`
				Filename string `json:"filename"`
			}

			if err := c.ShouldBindJSON(&request); err != nil {
				c.JSON(400, gin.H{"error": "Invalid request: " + err.Error()})
				return
			}

			if request.ImageURL == "" || request.Filename == "" {
				c.JSON(400, gin.H{"error": "Image URL and filename are required"})
				return
			}

			userObjID, err := primitive.ObjectIDFromHex(userID.(string))
			if err != nil {
				c.JSON(400, gin.H{"error": "Invalid user ID"})
				return
			}

			// First, get current user to check images
			var existingUser map[string]interface{}
			err = database.UserCollection.FindOne(context.Background(), bson.M{"_id": userObjID}).Decode(&existingUser)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to fetch user: " + err.Error()})
				return
			}

			// Get current images array
			var currentImages []string
			if imagesInterface, ok := existingUser["images"]; ok && imagesInterface != nil {
				if imagesArray, ok := imagesInterface.(primitive.A); ok {
					for _, img := range imagesArray {
						if str, ok := img.(string); ok && str != "" {
							currentImages = append(currentImages, str)
						}
					}
				}
			}

			// Check if image exists in user's images
			imageIndex := -1
			for i, img := range currentImages {
				if img == request.ImageURL {
					imageIndex = i
					break
				}
			}

			if imageIndex == -1 {
				c.JSON(404, gin.H{"error": "Image not found in user's photos"})
				return
			}

			// Remove image from array
			updatedImages := append(currentImages[:imageIndex], currentImages[imageIndex+1:]...)

			// Delete the actual file from server
			filePath := "./uploads/" + request.Filename
			if err := os.Remove(filePath); err != nil {
				// Log the error but continue - the file might have been deleted already
				fmt.Printf("Warning: Could not delete file %s: %v\n", filePath, err)
			}

			// Update user with new images array
			updateData := bson.M{
				"images":     updatedImages,
				"image_url":  "", // Will be set below
				"updated_at": time.Now(),
			}

			// Set image_url to first image if available
			if len(updatedImages) > 0 {
				updateData["image_url"] = updatedImages[0]
			}

			_, err = database.UserCollection.UpdateOne(
				context.Background(),
				bson.M{"_id": userObjID},
				bson.M{"$set": updateData},
			)

			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to update user: " + err.Error()})
				return
			}

			c.JSON(200, gin.H{
				"success":         true,
				"message":         "Image deleted successfully",
				"remainingImages": len(updatedImages),
			})
		})
	}
}
