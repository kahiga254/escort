package controllers

import (
	"context"
	"escort/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var blogCollection *mongo.Collection

func InitBlogCollection(client *mongo.Client) {
	db := client.Database("NairobiEscort") // Replace "escort" with your actual DB name
	blogCollection = db.Collection("blogs")
}

// CreateBlog - POST /api/blogs
func CreateBlog(c *gin.Context) {
	var blog models.Blog
	if err := c.ShouldBindJSON(&blog); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	blog.ID = primitive.NewObjectID()
	blog.CreatedAt = time.Now()
	blog.UpdatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := blogCollection.InsertOne(ctx, blog)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create blog"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": result.InsertedID})
}

// GetAllBlogs - GET /api/blogs
func GetAllBlogs(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := blogCollection.Find(ctx, bson.M{"published": true})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch blogs"})
		return
	}
	defer cursor.Close(ctx)

	var blogs []models.Blog
	if err = cursor.All(ctx, &blogs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse blogs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": blogs})
}

// GetBlogBySlug - GET /api/blogs/:slug
func GetBlogBySlug(c *gin.Context) {
	slug := c.Param("slug")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var blog models.Blog
	err := blogCollection.FindOne(ctx, bson.M{"slug": slug, "published": true}).Decode(&blog)
	if err == mongo.ErrNoDocuments {
		c.JSON(http.StatusNotFound, gin.H{"error": "Blog not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch blog"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": blog})
}

// UpdateBlog - PUT /api/blogs/:id
func UpdateBlog(c *gin.Context) {
	id := c.Param("id")
	var blog models.Blog
	if err := c.ShouldBindJSON(&blog); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	blog.UpdatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := blogCollection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": blog})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update blog"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": result.ModifiedCount})
}

// DeleteBlog - DELETE /api/blogs/:id
func DeleteBlog(c *gin.Context) {
	id := c.Param("id")

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := blogCollection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete blog"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": result.DeletedCount})
}
