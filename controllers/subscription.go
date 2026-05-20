package controllers

import (
	"fmt"
	"net/http"
	"time"

	"escort/models"
	"escort/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type SubscriptionController struct {
	payHeroClient *services.PayHeroClient
	db            *mongo.Database
}

func NewSubscriptionController(db *mongo.Database) *SubscriptionController {
	return &SubscriptionController{
		payHeroClient: services.NewPayHeroClient(),
		db:            db,
	}
}

type subscribeRequest struct {
	PlanID string `json:"plan_id"`
	Phone  string `json:"phone"`
}

type subscribeResponse struct {
	Status     string `json:"status"`
	Message    string `json:"message"`
	Amount     int    `json:"amount"`
	Plan       string `json:"plan"`
	Reference  string `json:"reference,omitempty"`
	CheckoutID string `json:"checkout_id,omitempty"`
}

// InitiateSubscription - Send STK Push to customer's phone
func (sc *SubscriptionController) InitiateSubscription(c *gin.Context) {
	// Get user ID from context (set by your auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req subscribeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Get the plan from database using your existing collection
	planCollection := sc.db.Collection("subscription_plans")
	planObjID, err := primitive.ObjectIDFromHex(req.PlanID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan ID"})
		return
	}

	var plan models.SubscriptionPlan
	err = planCollection.FindOne(c.Request.Context(), bson.M{"_id": planObjID}).Decode(&plan)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}

	// Generate unique reference for this transaction
	externalRef := fmt.Sprintf("SUB_%s_%d", userID.(primitive.ObjectID).Hex(), time.Now().Unix())

	// Send M-Pesa STK Push via PayHero - convert amount to int
	stkResp, err := sc.payHeroClient.SendSTKPush(int(plan.Amount), req.Phone, externalRef)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate payment: " + err.Error()})
		return
	}

	// Return response to user
	response := subscribeResponse{
		Status:     stkResp.Status,
		Message:    "STK Push sent to your phone. Please enter your PIN to complete payment.",
		Amount:     int(plan.Amount),
		Plan:       plan.Name,
		Reference:  stkResp.Reference,
		CheckoutID: stkResp.CheckoutRequestID,
	}

	c.JSON(http.StatusOK, response)
}

// TestPayHeroConnection - Temporary endpoint to test PayHero API
func (sc *SubscriptionController) TestPayHeroConnection(c *gin.Context) {
	// Test with 10 KES (must be integer)
	testAmount := 10
	testPhone := "0712345678" // Format starting with 0
	testRef := "TEST_" + time.Now().Format("20060102150405")

	stkResp, err := sc.payHeroClient.SendSTKPush(testAmount, testPhone, testRef)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"error":   err.Error(),
			"message": "Connection failed - check your credentials",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"status":      stkResp.Status,
		"reference":   stkResp.Reference,
		"checkout_id": stkResp.CheckoutRequestID,
		"message":     "PayHero connection successful! STK Push queued",
	})
}
