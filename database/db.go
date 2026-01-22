// database/database.go
package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var UserCollection *mongo.Collection
var SubscriptionCollection *mongo.Collection
var SubscriptionPlanCollection *mongo.Collection

func ConnectDB() {
	fmt.Println("🟢 Running ConnectDB()...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	MONGO_URI := os.Getenv("MONGODB_URI")
	fmt.Println("📌 MongoDB URI:", MONGO_URI)
	if MONGO_URI == "" {
		log.Fatal("❌ MONGO_URI is not set in the environment!")
	}

	// FIX: Use = instead of := to assign to global Client
	var connectErr error
	Client, connectErr = mongo.Connect(context.TODO(), options.Client().ApplyURI(MONGO_URI))
	if connectErr != nil {
		log.Fatal("Error connecting to MongoDB:", connectErr)
	}

	err = Client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("Error pinging MongoDB:", err)
	} else {
		fmt.Println("✅ Successfully connected to MongoDB!")
	}

	db := Client.Database("Inventory")

	// Your existing collection
	UserCollection = db.Collection("users")

	// NEW: Subscription collections
	SubscriptionCollection = db.Collection("subscriptions")
	SubscriptionPlanCollection = db.Collection("subscription_plans")

	// Create indexes for subscriptions
	createSubscriptionIndexes()

	// Initialize default plans (with amount 10)
	initializeDefaultPlans()

	fmt.Println("✅ All collections successfully initialized!")
}

func createSubscriptionIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Index for quick lookup of active subscriptions
	indexModel := mongo.IndexModel{
		Keys: map[string]interface{}{
			"user_id":     1,
			"status":      1,
			"expiry_date": 1,
		},
	}

	_, err := SubscriptionCollection.Indexes().CreateOne(ctx, indexModel)
	if err != nil {
		log.Printf("Warning: Could not create subscription index: %v", err)
	}
}

func initializeDefaultPlans() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if plans already exist
	count, err := SubscriptionPlanCollection.CountDocuments(ctx, map[string]interface{}{})
	if err != nil {
		log.Printf("Warning: Could not count subscription plans: %v", err)
		return
	}

	if count > 0 {
		fmt.Println("✅ Subscription plans already exist")
		return
	}

	// Create default plans
	plans := []interface{}{
		map[string]interface{}{
			"name":          "5-Day Basic",
			"amount":        10,
			"duration_days": 5,
			"description":   "Basic visibility for 5 days",
			"is_active":     true,
			"created_at":    time.Now(),
		},
		map[string]interface{}{
			"name":          "2-Week Pro",
			"amount":        1000,
			"duration_days": 14,
			"description":   "Better visibility for 2 weeks",
			"is_active":     true,
			"created_at":    time.Now(),
		},
		map[string]interface{}{
			"name":          "1-Month Premium",
			"amount":        3000,
			"duration_days": 30,
			"description":   "Maximum visibility for 1 month",
			"is_active":     true,
			"created_at":    time.Now(),
		},
	}

	_, err = SubscriptionPlanCollection.InsertMany(ctx, plans)
	if err != nil {
		log.Printf("Warning: Could not insert default plans: %v", err)
	} else {
		fmt.Println("✅ Default subscription plans created")
	}
}
