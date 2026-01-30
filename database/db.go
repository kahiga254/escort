package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var UserCollection *mongo.Collection
var SubscriptionCollection *mongo.Collection
var SubscriptionPlanCollection *mongo.Collection

func ConnectDB() {
	fmt.Println("🟢 Running ConnectDB()...")

	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ Warning: .env file not found, using system environment variables")
	}

	MONGO_URI := os.Getenv("MONGODB_URI")
	if MONGO_URI == "" {
		log.Fatal("❌ MONGO_URI is not set in the environment!")
	}

	fmt.Println("📌 Connecting to MongoDB...")

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Configure client options for MongoDB Atlas
	clientOptions := options.Client().
		ApplyURI(MONGO_URI).
		SetServerSelectionTimeout(30 * time.Second).
		SetConnectTimeout(30 * time.Second).
		SetSocketTimeout(30 * time.Second).
		SetMaxPoolSize(50).
		SetMinPoolSize(10).
		SetRetryWrites(true).
		SetAppName("escort-app")

	// Connect to MongoDB
	Client, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal("❌ Error connecting to MongoDB:", err)
	}

	// Test the connection
	pingCtx, pingCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer pingCancel()

	err = Client.Ping(pingCtx, nil)
	if err != nil {
		log.Fatal("❌ Error pinging MongoDB:", err)
	}

	fmt.Println("✅ Successfully connected to MongoDB!")

	// ✅ Use "Inventory" database where your data actually is
	databaseName := "Inventory" // Changed from "Escort" to "Inventory"
	fmt.Println("📊 Using database:", databaseName)

	db := Client.Database(databaseName)

	// Initialize collections
	UserCollection = db.Collection("users")
	SubscriptionCollection = db.Collection("subscriptions")
	SubscriptionPlanCollection = db.Collection("subscription_plans")

	// DEBUG: Check collections
	fmt.Println("🔍 Checking collections...")

	// Check users collection count
	userCount, err := UserCollection.CountDocuments(ctx, bson.M{})
	if err != nil {
		fmt.Printf("⚠️ Could not count users: %v\n", err)
	} else {
		fmt.Printf("📊 User collection has %d documents\n", userCount)
	}

	// Create indexes
	createIndexes(ctx, db)

	// Initialize default data (only if subscription_plans is empty)
	initializeDefaultPlans(ctx)

	fmt.Println("✅ Database initialization complete!")
}

// Updated createIndexes function with parameters
func createIndexes(ctx context.Context, db *mongo.Database) {
	// Index for subscriptions
	subscriptionIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "user_id", Value: 1},
				{Key: "status", Value: 1},
				{Key: "expiry_date", Value: 1},
			},
		},
		{
			Keys: bson.D{
				{Key: "expiry_date", Value: 1},
			},
			Options: options.Index().SetExpireAfterSeconds(0), // TTL index
		},
	}

	// Index for users (for faster searches)
	userIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "is_active", Value: 1},
				{Key: "location", Value: 1},
			},
		},
		{
			Keys: bson.D{
				{Key: "services", Value: 1},
			},
		},
	}

	// Create indexes for subscriptions
	if _, err := SubscriptionCollection.Indexes().CreateMany(ctx, subscriptionIndexes); err != nil {
		log.Printf("⚠️ Warning: Could not create subscription indexes: %v", err)
	} else {
		fmt.Println("✅ Subscription indexes created")
	}

	// Create indexes for users
	if _, err := UserCollection.Indexes().CreateMany(ctx, userIndexes); err != nil {
		log.Printf("⚠️ Warning: Could not create user indexes: %v", err)
	} else {
		fmt.Println("✅ User indexes created")
	}
}

// Updated initializeDefaultPlans function with context parameter
func initializeDefaultPlans(ctx context.Context) {
	// Check if plans already exist
	count, err := SubscriptionPlanCollection.CountDocuments(ctx, bson.M{})
	if err != nil {
		log.Printf("⚠️ Warning: Could not count subscription plans: %v", err)
		return
	}

	if count > 0 {
		fmt.Println("✅ Subscription plans already exist")
		return
	}

	// Create default plans (using struct for better type safety)
	type Plan struct {
		Name         string    `bson:"name"`
		Amount       float64   `bson:"amount"`
		DurationDays int       `bson:"duration_days"`
		Description  string    `bson:"description"`
		IsActive     bool      `bson:"is_active"`
		CreatedAt    time.Time `bson:"created_at"`
	}

	plans := []interface{}{
		Plan{
			Name:         "5-Day Basic",
			Amount:       10.0,
			DurationDays: 5,
			Description:  "Basic visibility for 5 days",
			IsActive:     true,
			CreatedAt:    time.Now(),
		},
		Plan{
			Name:         "2-Week Pro",
			Amount:       1000.0,
			DurationDays: 14,
			Description:  "Better visibility for 2 weeks",
			IsActive:     true,
			CreatedAt:    time.Now(),
		},
		Plan{
			Name:         "1-Month Premium",
			Amount:       3000.0,
			DurationDays: 30,
			Description:  "Maximum visibility for 1 month",
			IsActive:     true,
			CreatedAt:    time.Now(),
		},
	}

	_, err = SubscriptionPlanCollection.InsertMany(ctx, plans)
	if err != nil {
		log.Printf("⚠️ Warning: Could not insert default plans: %v", err)
	} else {
		fmt.Println("✅ Default subscription plans created")
	}
}

// Add a disconnect function for graceful shutdown
func DisconnectDB() {
	if Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := Client.Disconnect(ctx); err != nil {
			log.Printf("Error disconnecting from MongoDB: %v", err)
		} else {
			fmt.Println("✅ Disconnected from MongoDB")
		}
	}
}
