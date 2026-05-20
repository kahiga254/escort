package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PaymentTransaction - Track each payment
type PaymentTransaction struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	SubscriptionID primitive.ObjectID `bson:"subscription_id" json:"subscription_id"`
	UserID         primitive.ObjectID `bson:"user_id" json:"user_id"`
	Amount         float64            `bson:"amount" json:"amount"`
	MpesaReceipt   string             `bson:"mpesa_receipt" json:"mpesa_receipt"`
	PhoneNumber    string             `bson:"phone_number" json:"phone_number"`
	Status         string             `bson:"status" json:"status"` // pending, completed, failed
	CreatedAt      time.Time          `bson:"created_at" json:"created_at"`
}
