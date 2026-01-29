package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	FirstName string             `bson:"first_name" json:"first_name" binding:"required"`
	LastName  string             `bson:"last_name" json:"last_name" binding:"required"`
	PhoneNo   string             `bson:"phone_no" json:"phone_no" binding:"required"`
	Email     string             `bson:"email" json:"email" binding:"required,email"`
	Password  string             `bson:"password" json:"password" binding:"required"`
	Location  string             `bson:"location" json:"location" binding:"required"`

	// ADD THESE NEW FIELDS:
	Gender            string `bson:"gender" json:"gender" binding:"required"`
	SexualOrientation string `bson:"sexual_orientation" json:"sexual_orientation,omitempty"`
	Age               int    `bson:"age" json:"age,omitempty"`
	Nationality       string `bson:"nationality" json:"nationality,omitempty"`

	Services           []string  `bson:"services" json:"services"`
	Images             []string  `json:"images,omitempty" bson:"images,omitempty"`
	ImageUrl           string    `bson:"image_url" json:"image_url"`
	IsActive           bool      `bson:"is_active" json:"is_active"`
	Role               string    `bson:"role" json:"role"` // "user" or "admin"
	HasSubscription    bool      `bson:"has_subscription" json:"has_subscription"`
	SubscriptionExpiry time.Time `bson:"subscription_expiry,omitempty" json:"subscription_expiry,omitempty"`
	LastPaymentDate    time.Time `bson:"last_payment_date,omitempty" json:"last_payment_date,omitempty"`
	CreatedAt          time.Time `bson:"created_at" json:"created_at,omitempty"`
	UpdatedAt          time.Time `bson:"updated_at" json:"updated_at,omitempty"`
}

// MinimalPUserResponse - Only fields needed for homepage
type MinimalUserResponse struct {
	ID              primitive.ObjectID `json:"id"`
	FullName        string             `json:"full_name"`
	PhoneNo         string             `json:"phone_no"`
	ImageUrl        string             `json:"image_url"`
	Services        []string           `json:"services"`
	Location        string             `json:"location"`         // Optional for homepage
	HasSubscription bool               `json:"has_subscription"` // ADD THIS
}

// Subscription Model
type Subscription struct {
	ID     primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID primitive.ObjectID `bson:"user_id" json:"user_id"` // References User.ID
	PlanID primitive.ObjectID `bson:"plan_id" json:"plan_id"`

	// Subscription details
	Status     string    `bson:"status" json:"status"` // "active", "inactive"
	StartDate  time.Time `bson:"start_date" json:"start_date"`
	ExpiryDate time.Time `bson:"expiry_date" json:"expiry_date"`

	// MPESA payment info
	MpesaReceipt string    `bson:"mpesa_receipt,omitempty" json:"mpesa_receipt,omitempty"`
	AmountPaid   float64   `bson:"amount_paid" json:"amount_paid"`
	PaymentDate  time.Time `bson:"payment_date" json:"payment_date"`

	//MPESA PROCESSING
	CheckoutID string `bson:"checkout_id,omitempty" json:"checkout_id,omitempty"` // MPESA checkout request ID
	PhoneUsed  string `bson:"phone_used,omitempty" json:"phone_used,omitempty"`   // Phone used for payment

	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

// Subscription Plan Model
type SubscriptionPlan struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name         string             `bson:"name" json:"name"`                   // "5-Day", "2-Week", "1-Month"
	Amount       float64            `bson:"amount" json:"amount"`               // 500, 1000, 3000
	DurationDays int                `bson:"duration_days" json:"duration_days"` // 5, 14, 30
	IsActive     bool               `bson:"is_active" json:"is_active"`
}
