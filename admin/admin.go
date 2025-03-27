package admin

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"escort/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)


//Approve user profile

func ApproveUser(c *gin.Context) {
	id := c.Param("id")

	objID,_ := primitive.ObjectIDFromHex(id)

	_, err := database.UserCollection.UpdateOne(
		context.TODO(),
		bson.M{"_id": objID},
		 bson.M{"$set": bson.M{"is_active": true}},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error approving user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User approved"})
}

//Delete user profile (Admin only)

func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	objID,_ := primitive.ObjectIDFromHex(id)

	_, err := database.UserCollection.DeleteOne(
		context.TODO(),
		bson.M{"_id": objID})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}