package controllers

import (
	"context"
	"net/http"
	"time"

	"escort/database"
	"escort/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GetNextUnadvertisedCreator - Get next creator not yet advertised
func GetNextUnadvertisedCreator(c *gin.Context) {
	var creator models.User

	// Find first creator where advertised is false and is_active is true
	err := database.UserCollection.FindOne(
		context.TODO(),
		bson.M{
			"advertised": false,
			"is_active":  true,
		},
	).Decode(&creator)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No unadvertised creators found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":          creator.ID.Hex(),
			"full_name":   creator.FirstName + " " + creator.LastName,
			"image_url":   creator.ImageUrl,
			"bio":         creator.Nationality, // or use a bio field if you have one
			"services":    creator.Services,
			"location":    creator.Location,
			"phone_no":    creator.PhoneNo,
			"age":         creator.Age,
			"gender":      creator.Gender,
		},
	})
}

// MarkCreatorAdvertised - Mark creator as advertised
func MarkCreatorAdvertised(c *gin.Context) {
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	_, err = database.UserCollection.UpdateOne(
		context.TODO(),
		bson.M{"_id": objID},
		bson.M{
			"$set": bson.M{
				"advertised":    true,
				"advertised_at": time.Now(),
			},
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error marking creator as advertised"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Creator marked as advertised"})
}