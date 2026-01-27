package controllers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"escort/database"
	"escort/models"
	"escort/services"
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
	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

	// Create a registration DTO that matches frontend
	type RegisterRequest struct {
		FirstName         string `json:"firstName" binding:"required"`
		LastName          string `json:"lastName" binding:"required"`
		Email             string `json:"email" binding:"required,email"`
		PhoneNo           string `json:"phoneNo" binding:"required"`
		Password          string `json:"password" binding:"required"`
		Gender            string `json:"gender" binding:"required"`
		SexualOrientation string `json:"sexualOrientation"`
		Age               int    `json:"age"`
		Nationality       string `json:"nationality"`
		Location          string `json:"location" binding:"required"`
	}

	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid request: " + err.Error(),
		})
		return
	}

	// Check if user exists
	var existingUser models.User
	err := database.UserCollection.FindOne(context.TODO(), bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"error":   "User already exists",
		})
		return
	}

	// Validate password
	if !isValidPassword(req.Password) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Password must be at least 6 characters, with one uppercase letter and one special character",
		})
		return
	}

	// Hash password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 14)

	// Create user from request
	user := models.User{
		ID:                 primitive.NewObjectID(),
		FirstName:          req.FirstName,
		LastName:           req.LastName,
		Email:              req.Email,
		PhoneNo:            req.PhoneNo,
		Password:           string(hashedPassword),
		Location:           req.Location,
		IsActive:           false,
		Role:               "user",
		HasSubscription:    false,
		SubscriptionExpiry: time.Time{},
		LastPaymentDate:    time.Time{},
		// Store additional fields in a map or separate collection if needed
	}

	_, err = database.UserCollection.InsertOne(context.TODO(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to register user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User registered successfully. Account pending admin approval.",
		"user": gin.H{
			"id":        user.ID.Hex(),
			"firstName": user.FirstName,
			"lastName":  user.LastName,
			"email":     user.Email,
			"role":      user.Role,
			"isActive":  user.IsActive,
		},
	})
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

	// NEW LOGIC: Get users who are EITHER:
	// 1. Admin-approved (is_active: true) OR
	// 2. Have active subscription (has_subscription: true AND subscription_expiry > now)
	filter := bson.M{
		"role": "user",
		"$or": []bson.M{
			// Option 1: Admin-approved users
			{"is_active": true},
			// Option 2: Users with active subscription
			{
				"has_subscription":    true,
				"subscription_expiry": bson.M{"$gt": time.Now()},
			},
		},
	}

	location := c.Query("location")
	if location != "" {
		filter["location"] = bson.M{"$regex": location, "$options": "i"}
	}

	// Find options - get the fields we need
	findOptions := options.Find()
	findOptions.SetLimit(50)

	// UPDATE: Add has_subscription to projection
	projection := bson.M{
		"first_name":       1,
		"last_name":        1,
		"phone_no":         1,
		"image_url":        1,
		"location":         1,
		"services":         1,
		"has_subscription": 1, // ADD THIS
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

		// NEW: Get has_subscription field
		hasSubscription, _ := result["has_subscription"].(bool)

		// Handle services
		var services []string
		switch s := result["services"].(type) {
		case primitive.A:
			for _, v := range s {
				if str, ok := v.(string); ok {
					services = append(services, str)
				}
			}
		case string:
			if s != "" {
				services = strings.Split(s, ",")
				for i, service := range services {
					services[i] = strings.TrimSpace(service)
				}
			}
		case []interface{}:
			for _, v := range s {
				if str, ok := v.(string); ok {
					services = append(services, str)
				}
			}
		case []string:
			services = s
		}

		user := models.MinimalUserResponse{
			ID:              id,
			FullName:        firstName + " " + lastName,
			PhoneNo:         phoneNo,
			ImageUrl:        imageUrl,
			Services:        services,
			Location:        location,
			HasSubscription: hasSubscription, // ADD THIS
		}
		users = append(users, user)
	}

	// Log for debugging
	fmt.Printf("✅ Found %d visible users (admin-approved or subscribed)\n", len(users))

	// Return successful response
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

// GetSubscriptionPlans - Get all available subscription plans
func GetSubscriptionPlans(c *gin.Context) {
	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get only active plans
	filter := bson.M{"is_active": true}
	findOptions := options.Find().SetSort(bson.M{"amount": 1}) // Sort by price

	cursor, err := database.SubscriptionPlanCollection.Find(ctx, filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch subscription plans",
		})
		return
	}
	defer cursor.Close(ctx)

	var plans []models.SubscriptionPlan
	if err = cursor.All(ctx, &plans); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to read subscription plans",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    plans,
		"message": "Subscription plans fetched successfully",
	})
}

// Subscribe - Initiate sunscription payment
func Subscribe(c *gin.Context) {
	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	// Get user from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Not authenticated",
		})
		return
	}

	var req struct {
		PlanID string `json:"plan_id" binding:"required"`
		Phone  string `json:"phone,omitempty"` // Make optional
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Convert IDs
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid user ID",
		})
		return
	}

	planObjID, err := primitive.ObjectIDFromHex(req.PlanID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid plan ID",
		})
		return
	}

	// 1. Get plan details
	var plan models.SubscriptionPlan
	err = database.SubscriptionPlanCollection.FindOne(ctx, bson.M{"_id": planObjID}).Decode(&plan)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Subscription plan not found",
		})
		return
	}

	// ⭐⭐ ADD THESE LINES RIGHT AFTER THE ABOVE CODE ⭐⭐
	fmt.Println("=== DEBUG: BEFORE OVERRIDE ===")
	fmt.Printf("Plan Name: %s\n", plan.Name)
	fmt.Printf("Original Amount: %.0f KSH\n", plan.Amount)

	// FORCE AMOUNT TO 10 KSH FOR TESTING
	plan.Amount = 10
	fmt.Printf("✅ OVERRIDDEN Amount: %.0f KSH\n", plan.Amount)
	fmt.Println("=== DEBUG: AFTER OVERRIDE ===")

	// 2. Check if user already has active subscription
	var existingSubscription models.Subscription
	err = database.SubscriptionCollection.FindOne(ctx, bson.M{
		"user_id":     userObjID,
		"status":      "active",
		"expiry_date": bson.M{"$gt": time.Now()},
	}).Decode(&existingSubscription)

	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "You already have an active subscription",
			"expires": existingSubscription.ExpiryDate.Format("2006-01-02 15:04:05"),
		})
		return
	}

	// 3. DETERMINE PHONE NUMBER TO USE
	phoneToUse := ""

	// Priority 1: Use phone from request (if provided)
	if req.Phone != "" {
		phoneToUse = req.Phone
		fmt.Printf("📱 Using phone from request: %s\n", phoneToUse)
	} else {
		// Priority 2: Use phone from .env file
		phoneToUse = os.Getenv("MY_TEST_PHONE")
		if phoneToUse == "" {
			// Priority 3: Use default test phone
			phoneToUse = "254708374149" // MPESA sandbox test phone
			fmt.Println("📱 Using default sandbox test phone")
		} else {
			fmt.Printf("📱 Using phone from .env: %s\n", phoneToUse)
		}
	}

	// Validate phone number
	if phoneToUse == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Phone number is required. Either provide it in the request or set MY_TEST_PHONE in .env",
		})
		return
	}

	// 4. Create subscription record (pending)
	subscription := models.Subscription{
		ID:          primitive.NewObjectID(),
		UserID:      userObjID,
		PlanID:      planObjID,
		PhoneUsed:   phoneToUse,
		AmountPaid:  plan.Amount,
		Status:      "pending",
		StartDate:   time.Now(),
		ExpiryDate:  time.Now().Add(time.Duration(plan.DurationDays) * 24 * time.Hour),
		PaymentDate: time.Now(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// 5. Save subscription to database
	_, err = database.SubscriptionCollection.InsertOne(ctx, subscription)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create subscription record",
		})
		return
	}

	// 6. Initiate MPESA payment
	mpesaService := services.NewMpesaService()

	// Generate account reference
	accountReference := fmt.Sprintf("SUB-%s", subscription.ID.Hex())
	transactionDesc := fmt.Sprintf("Subscription: %s", plan.Name)

	fmt.Printf("🚀 Initiating payment to: %s for KSH %.0f\n", phoneToUse, plan.Amount)

	mpesaResponse, err := mpesaService.InitiateSTKPush(
		phoneToUse,
		int(plan.Amount),
		accountReference,
		transactionDesc,
	)

	if err != nil {
		// Update subscription status to failed
		database.SubscriptionCollection.UpdateOne(ctx,
			bson.M{"_id": subscription.ID},
			bson.M{"$set": bson.M{"status": "failed"}},
		)

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to initiate MPESA payment: " + err.Error(),
		})
		return
	}

	// 7. Extract checkout ID from MPESA response
	checkoutID, ok := mpesaResponse["CheckoutRequestID"].(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Invalid MPESA response",
		})
		return
	}

	// 8. Update subscription with checkout ID
	_, err = database.SubscriptionCollection.UpdateOne(ctx,
		bson.M{"_id": subscription.ID},
		bson.M{"$set": bson.M{
			"checkout_id": checkoutID,
			"updated_at":  time.Now(),
		}},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update subscription with checkout ID",
		})
		return
	}

	// 9. Return success response
	c.JSON(http.StatusOK, gin.H{
		"success":             true,
		"message":             fmt.Sprintf("Payment initiated to %s. Check your phone to complete MPESA payment", maskPhone(phoneToUse)),
		"subscription_id":     subscription.ID.Hex(),
		"checkout_id":         checkoutID,
		"amount":              plan.Amount,
		"phone_used":          maskPhone(phoneToUse), // Mask for security
		"merchant_request_id": mpesaResponse["MerchantRequestID"],
		"customer_message":    mpesaResponse["CustomerMessage"],
	})
}

// Helper function to mask phone number
func maskPhone(phone string) string {
	if len(phone) < 6 {
		return phone
	}
	return phone[:3] + "****" + phone[len(phone)-3:]
}

// GetUserSubscriptionStatus - Get current user's subscription status
func GetUserSubscriptionStatus(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Not authenticated",
		})
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID.(string))
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find active subscription
	var subscription models.Subscription
	err := database.SubscriptionCollection.FindOne(ctx, bson.M{
		"user_id":     userObjID,
		"status":      "active",
		"expiry_date": bson.M{"$gt": time.Now()},
	}).Decode(&subscription)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success":          true,
			"has_subscription": false,
			"message":          "No active subscription found",
		})
		return
	}

	// Get plan details
	var plan models.SubscriptionPlan
	database.SubscriptionPlanCollection.FindOne(ctx, bson.M{"_id": subscription.PlanID}).Decode(&plan)

	// Calculate days remaining
	daysRemaining := int(time.Until(subscription.ExpiryDate).Hours() / 24)
	if daysRemaining < 0 {
		daysRemaining = 0
	}

	c.JSON(http.StatusOK, gin.H{
		"success":          true,
		"has_subscription": true,
		"subscription":     subscription,
		"plan":             plan,
		"days_remaining":   daysRemaining,
		"is_active":        true,
		"message":          "Active subscription found",
	})
}

// MpesaCallback handles MPESA payment confirmation webhook
func MpesaCallback(c *gin.Context) {
	// MPESA sends JSON data in the request body
	var callbackData map[string]interface{}

	if err := c.ShouldBindJSON(&callbackData); err != nil {
		fmt.Printf("❌ Invalid callback JSON: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"ResultCode": 1,
			"ResultDesc": "Invalid JSON",
		})
		return
	}

	fmt.Printf("📥 MPESA Callback Received:\n")
	fmt.Printf("   Raw Data: %v\n", callbackData)

	// Extract the callback data
	body, ok := callbackData["Body"].(map[string]interface{})
	if !ok {
		fmt.Println("❌ No Body in callback")
		c.JSON(http.StatusBadRequest, gin.H{
			"ResultCode": 1,
			"ResultDesc": "Invalid callback structure",
		})
		return
	}

	stkCallback, ok := body["stkCallback"].(map[string]interface{})
	if !ok {
		fmt.Println("❌ No stkCallback in body")
		c.JSON(http.StatusBadRequest, gin.H{
			"ResultCode": 1,
			"ResultDesc": "Invalid callback structure",
		})
		return
	}

	// Extract essential fields
	resultCode, ok := stkCallback["ResultCode"].(float64)
	if !ok {
		fmt.Println("❌ No ResultCode in callback")
		c.JSON(http.StatusBadRequest, gin.H{
			"ResultCode": 1,
			"ResultDesc": "Invalid callback structure",
		})
		return
	}

	checkoutRequestID, _ := stkCallback["CheckoutRequestID"].(string)
	merchantRequestID, _ := stkCallback["MerchantRequestID"].(string)

	fmt.Printf("   CheckoutRequestID: %s\n", checkoutRequestID)
	fmt.Printf("   MerchantRequestID: %s\n", merchantRequestID)
	fmt.Printf("   ResultCode: %.0f\n", resultCode)

	// Process based on result code
	if resultCode == 0 {
		// Payment successful
		fmt.Println("✅ Payment Successful!")
		processSuccessfulPayment(stkCallback)
	} else {
		// Payment failed
		resultDesc, _ := stkCallback["ResultDesc"].(string)
		fmt.Printf("❌ Payment Failed: %s\n", resultDesc)
		processFailedPayment(checkoutRequestID, resultDesc)
	}

	// Always respond success to MPESA (they'll retry if we don't)
	c.JSON(http.StatusOK, gin.H{
		"ResultCode": 0,
		"ResultDesc": "Success",
	})
}

// processSuccessfulPayment handles successful MPESA payments
func processSuccessfulPayment(stkCallback map[string]interface{}) {
	// Extract metadata
	callbackMetadata, ok := stkCallback["CallbackMetadata"].(map[string]interface{})
	if !ok {
		fmt.Println("❌ No CallbackMetadata in successful payment")
		return
	}

	items, ok := callbackMetadata["Item"].([]interface{})
	if !ok {
		fmt.Println("❌ No Items in CallbackMetadata")
		return
	}

	// Extract payment details
	var amount float64
	var mpesaReceiptNumber string
	var phoneNumber string
	var transactionDate string

	for _, item := range items {
		itemMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}

		name, _ := itemMap["Name"].(string)
		value := itemMap["Value"]

		switch name {
		case "Amount":
			if val, ok := value.(float64); ok {
				amount = val
			}
		case "MpesaReceiptNumber":
			if val, ok := value.(string); ok {
				mpesaReceiptNumber = val
			}
		case "PhoneNumber":
			if val, ok := value.(string); ok {
				phoneNumber = val
			}
		case "TransactionDate":
			if val, ok := value.(string); ok {
				transactionDate = val
			}
		}
	}

	fmt.Printf("💰 Payment Details:\n")
	fmt.Printf("   Amount: %.2f\n", amount)
	fmt.Printf("   Receipt: %s\n", mpesaReceiptNumber)
	fmt.Printf("   Phone: %s\n", phoneNumber)
	fmt.Printf("   Date: %s\n", transactionDate)

	// Find subscription by checkout ID
	checkoutRequestID, _ := stkCallback["CheckoutRequestID"].(string)
	activateSubscription(checkoutRequestID, mpesaReceiptNumber, amount)
}

// activateSubscription finds and activates the subscription
func activateSubscription(checkoutID, receiptNumber string, amount float64) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Find the pending subscription by checkout ID
	var subscription models.Subscription
	err := database.SubscriptionCollection.FindOne(ctx,
		bson.M{"checkout_id": checkoutID},
	).Decode(&subscription)

	if err != nil {
		fmt.Printf("❌ Subscription not found for checkout ID: %s\n", checkoutID)
		return
	}

	fmt.Printf("📋 Found subscription: %s\n", subscription.ID.Hex())

	// 2. Update subscription to active
	_, err = database.SubscriptionCollection.UpdateOne(ctx,
		bson.M{"_id": subscription.ID},
		bson.M{"$set": bson.M{
			"status":        "active",
			"mpesa_receipt": receiptNumber,
			"amount_paid":   amount,
			"payment_date":  time.Now(),
			"updated_at":    time.Now(),
		}},
	)

	if err != nil {
		fmt.Printf("❌ Failed to update subscription: %v\n", err)
		return
	}

	fmt.Printf("✅ Subscription activated: %s\n", subscription.ID.Hex())

	// 3. Update user's subscription status
	_, err = database.UserCollection.UpdateOne(ctx,
		bson.M{"_id": subscription.UserID},
		bson.M{"$set": bson.M{
			"has_subscription":    true,
			"subscription_expiry": subscription.ExpiryDate,
			"last_payment_date":   time.Now(),
		}},
	)

	if err != nil {
		fmt.Printf("❌ Failed to update user: %v\n", err)
		return
	}

	// 4. Get user details for logging
	var user models.User
	database.UserCollection.FindOne(ctx, bson.M{"_id": subscription.UserID}).Decode(&user)

	fmt.Printf("🎉 User %s (%s) now has active subscription!\n",
		user.FirstName+" "+user.LastName,
		user.PhoneNo)

	// 5. Send notification (optional - implement later)
	// sendSubscriptionActivationNotification(user.PhoneNo, user.Email)
}

// processFailedPayment handles failed MPESA payments
func processFailedPayment(checkoutID, failureReason string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Update subscription status to failed
	_, err := database.SubscriptionCollection.UpdateOne(ctx,
		bson.M{"checkout_id": checkoutID},
		bson.M{"$set": bson.M{
			"status":         "failed",
			"failure_reason": failureReason,
			"updated_at":     time.Now(),
		}},
	)

	if err != nil {
		fmt.Printf("❌ Failed to update subscription status: %v\n", err)
	} else {
		fmt.Printf("📝 Subscription marked as failed: %s\n", checkoutID)
	}
}

// CheckSubscriptionStatus allows users to check payment status
func CheckSubscriptionStatus(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Not authenticated",
		})
		return
	}

	checkoutID := c.Query("checkout_id")
	if checkoutID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Checkout ID is required",
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find subscription
	var subscription models.Subscription
	err := database.SubscriptionCollection.FindOne(ctx,
		bson.M{"checkout_id": checkoutID},
	).Decode(&subscription)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Subscription not found",
		})
		return
	}

	// Verify user owns this subscription
	userObjID, _ := primitive.ObjectIDFromHex(userID.(string))
	if subscription.UserID != userObjID {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"error":   "Access denied",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"status":  subscription.Status,
		"data":    subscription,
	})
}
