package controllers

import (
	"context"
	"net/http"
	"time"
	"fmt"

	"escort/database"
	"escort/models"
	"unicode"
	"os"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
	if err := c.BindJSON(&user); err !=nil{
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

func LoginUser(c *gin.Context){
	var credentials struct {
		Email string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error":"Invalid input"})
		return
	}

	var user models.User
	err := database.UserCollection.FindOne(context.TODO(), bson.M{"email": credentials.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error":"Invalid email or password"})
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

	c.JSON(http.StatusOK, gin.H{"token":token, "role":user.Role, "id":user.ID.Hex()})
}

func generateJWT(userID string, role string) string{
	token := jwt.NewWithClaims(jwt.SigningMethodHS256,jwt.MapClaims{
		"user_id" : userID,
		"role" : role,
		"exp"  : time.Now().Add(time.Hour * 24).Unix(), 
	})

	tokenString,_ := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	return tokenString
}