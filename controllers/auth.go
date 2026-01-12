package controllers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"escort/database"
	"escort/models"
	"os"
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
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	//simple filter: only get verified and approved users
	filter := bson.M{
		"role":      "user",
		"is_active": true,
	}

	location := c.Query("location")
	if location != "" {
		filter["location"] = bson.M{"&regex": location, "&options": "i"} //case insensitive search
	}

	//find options - only get the fields we need
	findOptions := options.Find()

	findOptions.SetLimit(50) //limit to 50 results

	projection := bson.M{
		"first_name": 1,
		"last_name":  1,
		"phone_no":   1,
		"image_url":  1,
		"location":   1,
		"services":   1,
	}
	findOptions.SetProjection(projection)

	//Execute the query
	cursor, err := database.UserCollection.Find(ctx, filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch user from database"})
		return
	}
	defer cursor.Close(ctx)

	//Read results
	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to read user data"})
		return
	}

	//convert to Minimal User Response
	var users []models.MinimalUserResponse
	for _, result := range results {

		// Safely extract fields with type assertions
		id, _ := result["_id"].(primitive.ObjectID)
		firstName, _ := result["first_name"].(string)
		lastName, _ := result["last_name"].(string)
		phoneNo, _ := result["phone_no"].(string)
		imageUrl, _ := result["image_url"].(string)
		services, _ := result["services"].(string)
		location, _ := result["location"].(string)

		user := models.MinimalUserResponse{
			ID:       id,
			FullName: firstName + "" + lastName,
			PhoneNo:  phoneNo,
			ImageUrl: imageUrl,
			Services: services,
			Location: location,
		}
		users = append(users, user)
	}

	//Return successful response with minimal data
	c.JSON(http.StatusOK, gin.H{"success": true, "count": len(users), "data": users, "message": "Users fetched successfully"})
}
