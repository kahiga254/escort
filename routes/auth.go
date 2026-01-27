package routes

import (
	"context"
	"escort/controllers"
	"escort/database"
	"escort/middleware"
	"escort/models"
	"fmt"
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
			err := c.Request.ParseMultipartForm(10 << 20) // 10MB max
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

			// Limit to 5 files
			if len(files) > 5 {
				files = files[:5]
			}

			var imageUrls []string

			// For now, save files locally or return placeholder URLs
			// You'll need to implement actual file storage (S3, Cloudinary, etc.)
			for i, file := range files {
				// Create a unique filename
				filename := fmt.Sprintf("%s_%d_%s", userID.(string), i, file.Filename)

				// Save file to local directory (create 'uploads' folder first)
				uploadPath := "./uploads/" + filename
				if err := c.SaveUploadedFile(file, uploadPath); err != nil {
					c.JSON(500, gin.H{"error": "Failed to save file: " + err.Error()})
					return
				}

				// For local development, use a local URL
				imageUrl := fmt.Sprintf("http://localhost:8080/uploads/%s", filename)
				imageUrls = append(imageUrls, imageUrl)
			}

			// Update user with image URLs
			userObjID, _ := primitive.ObjectIDFromHex(userID.(string))

			_, err = database.UserCollection.UpdateOne(
				context.Background(),
				bson.M{"_id": userObjID},
				bson.M{"$set": bson.M{
					"image_url":  imageUrls[0], // Set first image as main
					"updated_at": time.Now(),
				}},
			)

			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to update user: " + err.Error()})
				return
			}

			c.JSON(200, gin.H{
				"success":   true,
				"message":   "Images uploaded successfully",
				"imageUrls": imageUrls,
			})
		})
	}
}
