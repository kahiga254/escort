package admin

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"escort/database"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Helper function to calculate growth rate
func calculateGrowthRate(current, previous int64) float64 {
	if previous == 0 {
		return 100.0
	}
	return (float64(current-previous) / float64(previous)) * 100
}

// GetAllUsers - Get all users with filters and pagination
func GetAllUsers(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get query parameters
	status := c.Query("status") // "active", "inactive", or "all"
	search := c.Query("search")
	role := c.Query("role")
	page, _ := strconv.Atoi(c.Query("page"))
	limit, _ := strconv.Atoi(c.Query("limit"))

	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	skip := (page - 1) * limit

	// Build filter
	filter := bson.M{}

	if status == "active" {
		filter["is_active"] = true
	} else if status == "inactive" {
		filter["is_active"] = false
	}

	if role != "" {
		filter["role"] = role
	}

	if search != "" {
		filter["$or"] = []bson.M{
			{"first_name": bson.M{"$regex": search, "$options": "i"}},
			{"last_name": bson.M{"$regex": search, "$options": "i"}},
			{"email": bson.M{"$regex": search, "$options": "i"}},
			{"phone_no": bson.M{"$regex": search, "$options": "i"}},
			{"location": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	// Get total count for pagination
	total, err := database.UserCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count users"})
		return
	}

	// Find users with pagination
	findOptions := options.Find()
	findOptions.SetSkip(int64(skip))
	findOptions.SetLimit(int64(limit))
	findOptions.SetSort(bson.M{"created_at": -1}) // Newest first

	cursor, err := database.UserCollection.Find(ctx, filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	defer cursor.Close(ctx)

	var users []bson.M
	if err = cursor.All(ctx, &users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode users"})
		return
	}

	// Remove passwords for security
	for i := range users {
		delete(users[i], "password")
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"users":   users,
		"pagination": gin.H{
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": int(math.Ceil(float64(total) / float64(limit))),
		},
		"filters": gin.H{
			"status": status,
			"search": search,
			"role":   role,
		},
	})
}

// GetUserByID - Get detailed user information
func GetUserByID(c *gin.Context) {
	userID := c.Param("id")

	if !primitive.IsValidObjectID(userID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get user details
	var user bson.M
	err := database.UserCollection.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&user)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get user's active subscriptions
	var subscriptions []bson.M
	subFilter := bson.M{"user_id": userObjID, "status": "active", "expiry_date": bson.M{"$gt": time.Now()}}
	subCursor, _ := database.SubscriptionCollection.Find(ctx, subFilter)
	subCursor.All(ctx, &subscriptions)

	// Get subscription history
	var subscriptionHistory []bson.M
	historyFilter := bson.M{"user_id": userObjID}
	historyCursor, _ := database.SubscriptionCollection.Find(ctx, historyFilter,
		options.Find().SetSort(bson.M{"created_at": -1}).SetLimit(10))
	historyCursor.All(ctx, &subscriptionHistory)

	// Remove sensitive data
	delete(user, "password")

	c.JSON(http.StatusOK, gin.H{
		"success":              true,
		"user":                 user,
		"active_subscriptions": subscriptions,
		"subscription_history": subscriptionHistory,
	})
}

// ApproveUser - Approve/Activate a user
func ApproveUser(c *gin.Context) {
	userID := c.Param("id")

	if !primitive.IsValidObjectID(userID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Update user status to active
	update := bson.M{
		"is_active":  true,
		"updated_at": time.Now(),
	}

	result, err := database.UserCollection.UpdateOne(
		ctx,
		bson.M{"_id": userObjID},
		bson.M{"$set": update},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve user"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "User approved successfully",
		"is_active": true,
	})
}

// ToggleUserStatus - Activate/Deactivate user
func ToggleUserStatus(c *gin.Context) {
	userID := c.Param("id")

	if !primitive.IsValidObjectID(userID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)

	var request struct {
		IsActive bool `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Update user status
	update := bson.M{
		"is_active":  request.IsActive,
		"updated_at": time.Now(),
	}

	result, err := database.UserCollection.UpdateOne(
		ctx,
		bson.M{"_id": userObjID},
		bson.M{"$set": update},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	statusText := "activated"
	if !request.IsActive {
		statusText = "deactivated"
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   fmt.Sprintf("User %s successfully", statusText),
		"is_active": request.IsActive,
	})
}

// DeleteUser - Delete a user account
func DeleteUser(c *gin.Context) {
	userID := c.Param("id")

	if !primitive.IsValidObjectID(userID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// First check if user exists
	var user bson.M
	err := database.UserCollection.FindOne(ctx, bson.M{"_id": userObjID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Delete user
	result, err := database.UserCollection.DeleteOne(ctx, bson.M{"_id": userObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	// Also delete user's subscriptions
	database.SubscriptionCollection.DeleteMany(ctx, bson.M{"user_id": userObjID})

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"message":       "User deleted successfully",
		"deleted_count": result.DeletedCount,
	})
}

// GetDashboardStats - Get admin dashboard statistics
func GetDashboardStats(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get user counts
	totalUsers, _ := database.UserCollection.CountDocuments(ctx, bson.M{})
	activeUsers, _ := database.UserCollection.CountDocuments(ctx, bson.M{"is_active": true})
	inactiveUsers, _ := database.UserCollection.CountDocuments(ctx, bson.M{"is_active": false})

	// Get today's registrations
	today := time.Now().Truncate(24 * time.Hour)
	todayRegistrations, _ := database.UserCollection.CountDocuments(ctx, bson.M{
		"created_at": bson.M{"$gte": today},
	})

	// Get yesterday's registrations for comparison
	yesterday := today.Add(-24 * time.Hour)
	yesterdayRegistrations, _ := database.UserCollection.CountDocuments(ctx, bson.M{
		"created_at": bson.M{"$gte": yesterday, "$lt": today},
	})

	// Get subscription stats
	activeSubscriptions, _ := database.SubscriptionCollection.CountDocuments(ctx, bson.M{
		"status":      "active",
		"expiry_date": bson.M{"$gt": time.Now()},
	})

	expiredSubscriptions, _ := database.SubscriptionCollection.CountDocuments(ctx, bson.M{
		"expiry_date": bson.M{"$lt": time.Now()},
	})

	// Get recent users (last 5)
	var recentUsers []bson.M
	userCursor, _ := database.UserCollection.Find(ctx, bson.M{},
		options.Find().SetSort(bson.M{"created_at": -1}).SetLimit(5))
	userCursor.All(ctx, &recentUsers)

	for i := range recentUsers {
		delete(recentUsers[i], "password")
	}

	// Get recent subscriptions (last 5)
	var recentSubscriptions []bson.M
	subCursor, _ := database.SubscriptionCollection.Find(ctx, bson.M{},
		options.Find().SetSort(bson.M{"created_at": -1}).SetLimit(5))
	subCursor.All(ctx, &recentSubscriptions)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats": gin.H{
			"users": gin.H{
				"total":       totalUsers,
				"active":      activeUsers,
				"inactive":    inactiveUsers,
				"today":       todayRegistrations,
				"yesterday":   yesterdayRegistrations,
				"growth_rate": calculateGrowthRate(todayRegistrations, yesterdayRegistrations),
			},
			"subscriptions": gin.H{
				"active":  activeSubscriptions,
				"expired": expiredSubscriptions,
				"total":   activeSubscriptions + expiredSubscriptions,
			},
			"recent": gin.H{
				"users":         recentUsers,
				"subscriptions": recentSubscriptions,
			},
		},
	})
}

// GetAllSubscriptions - Get all subscriptions with filters
func GetAllSubscriptions(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	status := c.Query("status") // "active", "expired", "pending"
	page, _ := strconv.Atoi(c.Query("page"))
	limit, _ := strconv.Atoi(c.Query("limit"))

	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	skip := (page - 1) * limit

	filter := bson.M{}
	if status == "active" {
		filter["status"] = "active"
		filter["expiry_date"] = bson.M{"$gt": time.Now()}
	} else if status == "expired" {
		filter["expiry_date"] = bson.M{"$lt": time.Now()}
	} else if status == "pending" {
		filter["status"] = "pending"
	}

	total, _ := database.SubscriptionCollection.CountDocuments(ctx, filter)

	findOptions := options.Find()
	findOptions.SetSkip(int64(skip))
	findOptions.SetLimit(int64(limit))
	findOptions.SetSort(bson.M{"created_at": -1})

	cursor, err := database.SubscriptionCollection.Find(ctx, filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subscriptions"})
		return
	}
	defer cursor.Close(ctx)

	var subscriptions []bson.M
	cursor.All(ctx, &subscriptions)

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"subscriptions": subscriptions,
		"pagination": gin.H{
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": int(math.Ceil(float64(total) / float64(limit))),
		},
	})
}

// UpdateSubscription - Update subscription status
func UpdateSubscription(c *gin.Context) {
	subscriptionID := c.Param("id")

	if !primitive.IsValidObjectID(subscriptionID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid subscription ID"})
		return
	}

	subObjID, _ := primitive.ObjectIDFromHex(subscriptionID)

	var request struct {
		Status     string    `json:"status"`
		ExpiryDate time.Time `json:"expiry_date"`
		Notes      string    `json:"notes"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	update := bson.M{
		"status":     request.Status,
		"updated_at": time.Now(),
	}

	if !request.ExpiryDate.IsZero() {
		update["expiry_date"] = request.ExpiryDate
	}
	if request.Notes != "" {
		update["notes"] = request.Notes
	}

	result, err := database.SubscriptionCollection.UpdateOne(
		ctx,
		bson.M{"_id": subObjID},
		bson.M{"$set": update},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update subscription"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subscription not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Subscription updated successfully",
	})
}

// GetUserReport - Generate user registration report
func GetUserReport(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get user registration by month for the last 6 months
	sixMonthsAgo := time.Now().AddDate(0, -6, 0)

	pipeline := []bson.M{
		{
			"$match": bson.M{
				"created_at": bson.M{"$gte": sixMonthsAgo},
			},
		},
		{
			"$group": bson.M{
				"_id": bson.M{
					"year":  bson.M{"$year": "$created_at"},
					"month": bson.M{"$month": "$created_at"},
				},
				"count": bson.M{"$sum": 1},
			},
		},
		{
			"$sort": bson.M{"_id.year": 1, "_id.month": 1},
		},
	}

	cursor, err := database.UserCollection.Aggregate(ctx, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate report"})
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M
	cursor.All(ctx, &results)

	// Format results for frontend
	var monthlyData []gin.H
	for _, result := range results {
		monthlyData = append(monthlyData, gin.H{
			"year":  result["_id"].(bson.M)["year"],
			"month": result["_id"].(bson.M)["month"],
			"count": result["count"],
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"report": gin.H{
			"type":   "user_registration",
			"period": "last_6_months",
			"data":   monthlyData,
		},
	})
}

// GetSubscriptionReport - Generate subscription report
func GetSubscriptionReport(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get subscription revenue by month
	pipeline := []bson.M{
		{
			"$group": bson.M{
				"_id": bson.M{
					"year":  bson.M{"$year": "$created_at"},
					"month": bson.M{"$month": "$created_at"},
				},
				"count":        bson.M{"$sum": 1},
				"total_amount": bson.M{"$sum": "$amount"},
			},
		},
		{
			"$sort": bson.M{"_id.year": 1, "_id.month": 1},
		},
		{
			"$limit": 12, // Last 12 months
		},
	}

	cursor, err := database.SubscriptionCollection.Aggregate(ctx, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate subscription report"})
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M
	cursor.All(ctx, &results)

	// Format results for frontend
	var monthlyData []gin.H
	for _, result := range results {
		monthlyData = append(monthlyData, gin.H{
			"year":         result["_id"].(bson.M)["year"],
			"month":        result["_id"].(bson.M)["month"],
			"count":        result["count"],
			"total_amount": result["total_amount"],
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"report": gin.H{
			"type":   "subscription_revenue",
			"period": "last_12_months",
			"data":   monthlyData,
		},
	})
}
