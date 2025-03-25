package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"
	

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"github.com/joho/godotenv"
)

var Client *mongo.Client
var UserCollection *mongo.Collection

func ConnectDB() {
	fmt.Println("🟢 Running ConnectDB()...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	  // ✅ Get MongoDB URI from .env
	  MONGO_URI := os.Getenv("MONGODB_URI")
	  fmt.Println("📌 MongoDB URI:", MONGO_URI)
	  if MONGO_URI == "" {
		  log.Fatal("❌ MONGO_URI is not set in the environment!")
	  }

	Client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(MONGO_URI))
	if err != nil {
		log.Fatal("Error connecting to MongoDB:", err)
	}

	err = Client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("Error pinging MongoDB:", err)
	}else{
		fmt.Println("✅ Successfully connected to MongoDB!")
	}

	
	UserCollection = Client.Database("Inventory").Collection("users")
	
	if UserCollection == nil {
		log.Fatal("UserCollection is nil")
	}
		fmt.Println("✅ UserCollection successfully initialized:", UserCollection)
}




