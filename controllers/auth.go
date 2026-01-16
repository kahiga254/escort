package controllers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"escort/database"
	"escort/models"
	"os"
	"strings"
	"unicode"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// Function to validate password
func isValidPassword(password string) bool {
	if len(password) < 6 {
		return false
	}

	hasUpper := false
	hasSpecial := false

	for _, char := range password {
		if unicode.IsUpper(char) {
			hasUpper = true
		} else if unicode.IsPunct(char) || unicode.IsSymbol(char) {
			hasSpecial = true
		}
	}

	return hasUpper && hasSpecial
}

func RegisterUser(c *gin.Context) {
	// Add these 3 lines to ALL FIVE functions:
	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

	var user models.User

	// Bind JSON input and validate required fields
	if err := c.BindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	//validate password strength
	if !isValidPassword(user.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters, with one uppercase letter and one special character"})
		return
	}

	//Check if user exists
	var existingUser models.User
	err := database.UserCollection.FindOne(context.TODO(), bson.M{"email": user.Email}).Decode(&existingUser)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	//Hash password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(user.Password), 14)
	user.Password = string(hashedPassword)

	//set default values
	user.ID = primitive.NewObjectID()
	user.IsActive = false
	user.Role = "user"

	fmt.Printf("User: %v\n", user)

	_, err = database.UserCollection.InsertOne(context.TODO(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user registered, pending approval"})

}

func LoginUser(c *gin.Context) {

	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

	var credentials struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var user models.User
	err := database.UserCollection.FindOne(context.TODO(), bson.M{"email": credentials.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(credentials.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Print the user ID for debugging
	//fmt.Println("User ID:", user.ID.Hex())

	//Generate JWT Token

	token := generateJWT(user.ID.Hex(), user.Role)

	c.JSON(http.StatusOK, gin.H{"token": token, "role": user.Role, "id": user.ID.Hex()})
}

func generateJWT(userID string, role string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, _ := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	return tokenString
}

// Get all Active Users
func GetAllActiveUsers(c *gin.Context) {

	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Simple filter: only get verified and approved users
	filter := bson.M{
		"role":      "user",
		"is_active": true,
	}

	location := c.Query("location")
	if location != "" {
		filter["location"] = bson.M{"$regex": location, "$options": "i"} // FIXED: $regex not &regex
	}

	// Find options - only get the fields we need
	findOptions := options.Find()
	findOptions.SetLimit(50) // Limit to 50 results

	projection := bson.M{
		"first_name": 1,
		"last_name":  1,
		"phone_no":   1,
		"image_url":  1,
		"location":   1,
		"services":   1,
	}
	findOptions.SetProjection(projection)

	// Execute the query
	cursor, err := database.UserCollection.Find(ctx, filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch users from database"})
		return
	}
	defer cursor.Close(ctx)

	// Read results
	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to read user data"})
		return
	}

	// Convert to Minimal User Response
	var users []models.MinimalUserResponse
	for _, result := range results {
		// Safely extract fields with type assertions
		id, _ := result["_id"].(primitive.ObjectID)
		firstName, _ := result["first_name"].(string)
		lastName, _ := result["last_name"].(string)
		phoneNo, _ := result["phone_no"].(string)
		imageUrl, _ := result["image_url"].(string)
		location, _ := result["location"].(string)

		// Handle services - it might be stored as string or array in DB
		var services []string

		// Try different possible types
		switch s := result["services"].(type) {
		case primitive.A: // MongoDB array type
			for _, v := range s {
				if str, ok := v.(string); ok {
					services = append(services, str)
				}
			}
		case string: // Stored as string
			if s != "" {
				// If comma-separated
				services = strings.Split(s, ",")
				// Trim spaces
				for i, service := range services {
					services[i] = strings.TrimSpace(service)
				}
			}
		case []interface{}: // Another array format
			for _, v := range s {
				if str, ok := v.(string); ok {
					services = append(services, str)
				}
			}
		case []string: // Direct string slice (if driver handles it)
			services = s
		}

		user := models.MinimalUserResponse{
			ID:       id,
			FullName: firstName + " " + lastName, // FIXED: Added space
			PhoneNo:  phoneNo,
			ImageUrl: imageUrl,
			Services: services, // Now []string
			Location: location,
		}
		users = append(users, user)
	}

	// Return successful response with minimal data
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(users),
		"data":    users,
		"message": "Users fetched successfully",
	})
}

// search users by location or services
func SearchUsers(c *gin.Context) {
	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get search query from URL parameter
	query := c.Query("q")
	location := c.Query("location")
	service := c.Query("service")

	// Validate at least one search parameter is provided
	if query == "" && location == "" && service == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "At least one search parameter (q, location, service) is required"})
		return
	}

	// Build filter based on provided parameters
	filter := bson.M{
		"role":      "user",
		"is_active": true,
	}

	//search conditions
	var searchConditions []bson.M

	// If query parameter in multiple fileds
	if query != "" {
		searchConditions = append(searchConditions, bson.M{
			"$or": []bson.M{
				{"location": bson.M{"$regex": primitive.Regex{Pattern: query, Options: "i"}}},
				{"first_name": bson.M{"$regex": primitive.Regex{Pattern: query, Options: "i"}}},
				{"last_name": bson.M{"$regex": primitive.Regex{Pattern: query, Options: "i"}}},
				{"services": bson.M{"$regex": primitive.Regex{Pattern: query, Options: "i"}}},
			},
		})
	}

	// If specific location parameter provided
	if location != "" {
		searchConditions = append(searchConditions, bson.M{
			"location": bson.M{"$regex": primitive.Regex{Pattern: location, Options: "i"}},
		})
	}

	// If service parameter provided
	if service != "" {
		searchConditions = append(searchConditions, bson.M{
			"services": bson.M{"$in": []string{service}},
		})
	}

	// Combine all search conditions with AND
	if len(searchConditions) > 0 {
		filter["$and"] = searchConditions
	}

	// Get pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	skip := (page - 1) * limit

	// Find options for pagination
	findOptions := options.Find()
	findOptions.SetSkip(int64(skip))
	findOptions.SetLimit(int64(limit))
	findOptions.SetSort(bson.D{{Key: "created_at", Value: -1}}) // Newest first

	// Get total count for pagination
	totalCount, err := database.UserCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to count search results",
		})
		return
	}

	// Execute query
	cursor, err := database.UserCollection.Find(ctx, filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to search plumbers",
		})
		return
	}
	defer cursor.Close(ctx)

	// Read results
	var users []models.User
	if err = cursor.All(ctx, &users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to decode search results",
		})
		return
	}

	//convert to Minimal User Response
	var results []models.MinimalUserResponse
	for _, user := range users {
		minUser := models.MinimalUserResponse{
			ID:       user.ID,
			FullName: user.FirstName + " " + user.LastName,
			PhoneNo:  user.PhoneNo,
			ImageUrl: user.ImageUrl,
			Services: user.Services,
			Location: user.Location,
		}
		results = append(results, minUser)
	}

	//calculate total pages
	totalPages := 0
	if totalCount > 0 {
		totalPages = int((totalCount + int64(limit) - 1) / int64(limit))

	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    results,
		"pagination": gin.H{
			"current_page": page,
			"per_page":     limit,
			"total":        totalCount,
			"total_pages":  totalPages,
			"has_next":     page < totalPages,
			"has_prev":     page > 1,
		},
		"search_query": gin.H{
			"q":        query,
			"location": location,
			"service":  service,
		},
		"message": "Search completed successfully",
	})
}

// Get user by specific Location
func GetUsersByLocation(c *gin.Context) {
	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	location := c.Param("location")
	if location == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Location is required",
		})
		return
	}

	// Build filter
	filter := bson.M{
		"role":      "user",
		"is_active": true,
		"location":  bson.M{"$regex": primitive.Regex{Pattern: location, Options: "i"}},
	}

	// Get pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	skip := (page - 1) * limit

	findOptions := options.Find()
	findOptions.SetSkip(int64(skip))
	findOptions.SetLimit(int64(limit))
	findOptions.SetSort(bson.D{{Key: "created_at", Value: -1}})

	// Execute query
	cursor, err := database.UserCollection.Find(ctx, filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch users by location",
		})
		return
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err = cursor.All(ctx, &users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to decode users",
		})
		return
	}

	// Convert to response
	var results []models.MinimalUserResponse
	for _, user := range users {
		minUser := models.MinimalUserResponse{
			ID:       user.ID,
			FullName: user.FirstName + " " + user.LastName,
			PhoneNo:  user.PhoneNo,
			ImageUrl: user.ImageUrl,
			Services: user.Services,
			Location: user.Location,
		}
		results = append(results, minUser)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"data":     users,
		"location": location,
		"count":    len(users),
		"message":  "Users in " + location + " retrieved successfully",
	})
}
